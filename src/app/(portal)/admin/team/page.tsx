import { getRepo, isAdmin, requireRole } from "@/lib/auth";
import { TeamTable } from "./team-table";

export const metadata = { title: "Team & Roles" };

export default async function TeamPage() {
  const viewer = await requireRole(isAdmin, "/admin/team");
  const repo = await getRepo();
  const [team, profiles] = await Promise.all([repo.team(), repo.profiles()]);
  const members = profiles.filter((p) => p.role === "member");
  return <TeamTable team={team} members={members.map((m) => ({ email: m.email ?? "", name: m.full_name }))} me={viewer.email} />;
}
