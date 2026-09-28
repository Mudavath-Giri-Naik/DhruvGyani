import "server-only";

import { embedItemChunks } from "@/lib/ai/embed";
import { buildDataCard, profileCsv } from "@/lib/datasets/profile";
import type { Repo, StorageBucket } from "@/lib/data/repo";
import type { Item } from "@/lib/types";
import { chunkPages, type PageText } from "./chunker";

const MAX_ATTEMPTS = 3;

export async function extractPdfPages(bytes: ArrayBuffer): Promise<PageText[]> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await extractText(pdf, { mergePages: false });
  return text.map((t, i) => ({ page_no: i + 1, text: t }));
}

async function saveChunks(repo: Repo, item: Item, pages: PageText[]) {
  const chunks = chunkPages(pages);
  const embeddings = await embedItemChunks(item, chunks.map((c) => c.content));
  await repo.replaceChunks(
    item.id,
    chunks.map((c, i) => ({ ...c, embedding: embeddings?.[i] ?? null })),
  );
  return { chunks: chunks.length, embedded: Boolean(embeddings) };
}

/**
 * Process one background job. Runs after the upload response is sent
 * (`after()`), and can be retried from the Upload page. Failures are
 * recorded on the job; it is retried up to MAX_ATTEMPTS times.
 */
export async function runJob(repo: Repo, jobId: string): Promise<void> {
  const job = await repo.getJob(jobId);
  if (!job || job.status === "done" || job.status === "running") return;
  await repo.updateJob(job.id, { status: "running", attempts: job.attempts + 1, error: null });
  try {
    const item = job.item_id ? await repo.getItem(job.item_id) : null;
    if (!item) throw new Error("Item not found or not visible");
    const bucket = job.payload.bucket as StorageBucket | undefined;
    const path = job.payload.path as string | undefined;
    let note = "";

    switch (job.type) {
      case "ingest_pdf": {
        const bytes = bucket && path ? await repo.getFile(bucket, path) : null;
        if (!bytes) throw new Error("Uploaded file not found");
        const pages = (await extractPdfPages(bytes)).filter((p) => p.text.trim().length > 20);
        if (!pages.length) {
          // Scanned PDF without a text layer: keep the item usable via its description.
          await saveChunks(repo, item, [{ page_no: null, text: `${item.title}. ${item.description}` }]);
          note = "No text layer found (scanned PDF?). OCR is not available in this prototype; indexed title and description only.";
        } else {
          const r = await saveChunks(repo, item, pages);
          note = `${pages.length} pages → ${r.chunks} chunks${r.embedded ? " (embedded)" : " (keyword search only)"}`;
        }
        break;
      }
      case "ingest_csv": {
        const bytes = bucket && path ? await repo.getFile(bucket, path) : null;
        if (!bytes) throw new Error("Uploaded file not found");
        const csv = new TextDecoder().decode(bytes);
        const { rows: _rows, ...profile } = profileCsv(csv, (job.payload.units as Record<string, string>) ?? {});
        void _rows;
        await repo.saveDatasetProfile({ ...profile, item_id: item.id });
        const card = buildDataCard({ ...profile, item_id: item.id }, item.language);
        const r = await saveChunks(repo, item, [{ page_no: null, text: `${item.title}. ${item.description} ${card.join(" ")}` }]);
        note = `${profile.row_count} rows, ${profile.columns.length} columns profiled; ${r.chunks} chunk(s)`;
        break;
      }
      case "ingest_photo": {
        await saveChunks(repo, item, [{ page_no: null, text: [item.title, item.alt_text, item.description].filter(Boolean).join(". ") }]);
        note = "Caption and alt text indexed";
        break;
      }
      case "embed_item": {
        const existing = await repo.chunksFor([item.id]);
        const pages = existing.length ? existing.map((c) => ({ page_no: c.page_no, text: c.content })) : [{ page_no: null, text: `${item.title}. ${item.description}` }];
        const r = await saveChunks(repo, item, pages);
        note = r.embedded ? `Re-embedded ${r.chunks} chunk(s)` : "AI not available or not allowed; keyword index refreshed";
        break;
      }
    }
    await repo.updateJob(job.id, { status: "done", error: note || null });
  } catch (e) {
    const failed = job.attempts + 1 >= MAX_ATTEMPTS;
    await repo.updateJob(job.id, { status: failed ? "failed" : "queued", error: (e as Error).message.slice(0, 500) });
  }
}
