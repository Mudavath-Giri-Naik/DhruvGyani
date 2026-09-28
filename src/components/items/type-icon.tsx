import { BookOpen, CalendarCheck, Database, FileText, Film, Image as ImageIcon, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const TYPE_ICON: Record<string, LucideIcon> = {
  report: FileText,
  dataset: Database,
  publication: BookOpen,
  photo: ImageIcon,
  video: Film,
  activity: CalendarCheck,
};

/** Per-type accent colours (work in light, dark and high-contrast). */
export const TYPE_TONE: Record<string, string> = {
  report: "text-sky-700 bg-sky-500/10 border-sky-500/25 dark:text-sky-300",
  dataset: "text-emerald-700 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-300",
  publication: "text-violet-700 bg-violet-500/10 border-violet-500/25 dark:text-violet-300",
  photo: "text-amber-700 bg-amber-500/10 border-amber-500/25 dark:text-amber-300",
  video: "text-rose-700 bg-rose-500/10 border-rose-500/25 dark:text-rose-300",
  activity: "text-teal-700 bg-teal-500/10 border-teal-500/25 dark:text-teal-300",
};

export function TypeIcon({ type, className }: { type: string; className?: string }) {
  const Icon = TYPE_ICON[type] ?? FileText;
  return <Icon className={cn("size-4", className)} aria-hidden />;
}
