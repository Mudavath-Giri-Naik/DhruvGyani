import { after } from "next/server";
import { getRepo, guardApi, isReviewer, isStaff } from "@/lib/auth";
import type { StorageBucket } from "@/lib/data/repo";
import { runJob } from "@/lib/ingest/process";
import { IngestMeta as Meta } from "@/lib/ingest/meta";
import { safeName, validateUpload } from "@/lib/ingest/validate";
import type { Job } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Jobs list for the Upload page. */
export async function GET() {
  const { deny } = await guardApi(isStaff);
  if (deny) return deny;
  const repo = await getRepo();
  const jobs = await repo.jobs(20);
  const items = await repo.getItems(jobs.map((j) => j.item_id).filter(Boolean) as string[]);
  return Response.json({ jobs: jobs.map((j) => ({ ...j, title: items.find((i) => i.id === j.item_id)?.title ?? null })) });
}

/** Retry a failed/queued job: POST /api/ingest?retry=<jobId> (no body). */
async function retry(jobId: string) {
  const repo = await getRepo();
  const job = await repo.getJob(jobId);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
  if (job.status === "failed") await repo.updateJob(job.id, { status: "queued", attempts: 0 });
  after(() => runJob(repo, job.id));
  return Response.json({ ok: true });
}

/** Final step of the upload flow: store the file, create the item, queue processing. */
export async function POST(request: Request) {
  const { viewer, deny } = await guardApi(isStaff);
  if (deny) return deny;
  const retryId = new URL(request.url).searchParams.get("retry");
  if (retryId) return retry(retryId);

  const form = await request.formData();
  const parsed = Meta.safeParse(JSON.parse(String(form.get("meta") ?? "{}")));
  if (!parsed.success) {
    return Response.json({ error: "Please fix the highlighted fields", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 422 });
  }
  const meta = parsed.data;
  if (meta.status === "published" && !isReviewer(viewer.role)) return Response.json({ error: "Only reviewers can publish directly. Choose “In review”." }, { status: 403 });

  const file = form.get("file");
  const repo = await getRepo();
  let stored: { bucket: StorageBucket; path: string; kind: string; mime: string; size: number; url: string; bytes: ArrayBuffer } | null = null;

  if (file instanceof File && file.size > 0) {
    const v = await validateUpload(file);
    if ("error" in v) return Response.json({ error: v.error }, { status: 415 });
    // Everything except raw CSVs goes to the private bucket; access is checked per request in /api/files.
    const bucket: StorageBucket = v.kind === "csv" ? "datasets" : "private-uploads";
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName(file.name)}`;
    const url = await repo.putFile(bucket, path, v.bytes, file.type || "text/csv");
    stored = { bucket, path, kind: v.kind, mime: file.type || "text/csv", size: file.size, url, bytes: v.bytes };
  } else if (!meta.external_url) {
    return Response.json({ error: "Add a file or an external link." }, { status: 400 });
  }

  const { phash, ...fields } = meta;
  const item = await repo.createItem({
    ...fields,
    media_url: stored && ["image", "pdf", "video"].includes(stored.kind) ? stored.url : null,
  });
  if (stored) {
    const digest = await crypto.subtle.digest("SHA-256", stored.bytes);
    await repo.addItemFile({
      item_id: item.id,
      storage_bucket: stored.bucket,
      storage_path: stored.path,
      mime: stored.mime,
      size: stored.size,
      checksum: Buffer.from(digest).toString("hex"),
      phash,
    });
  }
  await repo.audit("item.create", "item", item.id, { title: item.title, visibility: item.visibility, embargo_until: item.embargo_until });

  const jobType: Job["type"] = stored?.kind === "pdf" ? "ingest_pdf" : stored?.kind === "csv" ? "ingest_csv" : stored?.kind === "image" ? "ingest_photo" : "embed_item";
  const job = await repo.enqueueJob({ type: jobType, payload: stored ? { bucket: stored.bucket, path: stored.path } : {}, item_id: item.id });
  after(() => runJob(repo, job.id));

  return Response.json({ ok: true, item: { id: item.id, title: item.title }, job: { id: job.id, type: job.type } });
}
