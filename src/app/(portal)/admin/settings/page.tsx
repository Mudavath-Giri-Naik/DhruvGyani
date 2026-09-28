import { getTranslations } from "next-intl/server";
import { PageHeader, PageShell } from "@/components/page-header";
import { getRepo, isAdmin, requireRole } from "@/lib/auth";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireRole(isAdmin, "/admin/settings");
  const [t, repo] = await Promise.all([getTranslations("admin"), getRepo()]);
  const settings = await repo.settings();
  return (
    <PageShell className="max-w-4xl">
      <PageHeader title={t("settings")} description={t("settingsSub")} />
      <SettingsForm initial={settings} />
    </PageShell>
  );
}
