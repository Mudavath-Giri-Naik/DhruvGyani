import { getRepo, isAdmin, requireRole } from "@/lib/auth";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireRole(isAdmin, "/admin/settings");
  const repo = await getRepo();
  const settings = await repo.settings();
  return <SettingsForm initial={settings} />;
}
