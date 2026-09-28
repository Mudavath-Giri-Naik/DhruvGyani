import { getTranslations } from "next-intl/server";
import { PageHeader, PageShell } from "@/components/page-header";
import { getRepo, isStaff, requireRole } from "@/lib/auth";
import { UploadStudio } from "./upload-studio";

export const metadata = { title: "Upload & Import" };

export default async function UploadPage() {
  const viewer = await requireRole(isStaff, "/studio/upload");
  const [t, repo] = await Promise.all([getTranslations("upload"), getRepo()]);
  const [expeditions, stations] = await Promise.all([repo.expeditions(), repo.stations()]);
  return (
    <PageShell>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <UploadStudio
        role={viewer.role}
        expeditions={expeditions.map((e) => ({ id: e.id, code: e.code, title: e.title, station_id: e.station_id }))}
        stations={stations.map((s) => ({ id: s.id, name: s.name }))}
      />
    </PageShell>
  );
}
