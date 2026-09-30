import {
  Activity,
  BookOpen,
  CalendarDays,
  ChartNoAxesColumn,
  Compass,
  Database,
  FileText,
  Film,
  GraduationCap,
  House,
  Image as ImageIcon,
  LayoutDashboard,
  Library,
  ListChecks,
  Map,
  MessageCircleQuestion,
  Newspaper,
  Radio,
  ScrollText,
  Settings,
  Ship,
  Sparkles,
  Upload,
  Users,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavEntry {
  key: string; // messages key under "nav"
  href: string;
  icon: LucideIcon;
  children?: NavEntry[];
  badge?: "review";
}

export interface NavGroup {
  key: "explore" | "studio" | "admin";
  roles: Role[];
  items: NavEntry[];
}

export const LIBRARY_NAV: NavEntry[] = [
  { key: "reports", href: "/library/reports", icon: FileText },
  { key: "datasets", href: "/library/datasets", icon: Database },
  { key: "publications", href: "/library/publications", icon: BookOpen },
  { key: "photos", href: "/library/photos", icon: ImageIcon },
  { key: "videos", href: "/library/videos", icon: Film },
  { key: "activities", href: "/library/activities", icon: CalendarCheck },
];

export const NAV: NavGroup[] = [
  {
    key: "explore",
    roles: ["visitor", "member", "curator", "reviewer", "admin"],
    items: [
      { key: "home", href: "/portal", icon: House },
      { key: "expeditions", href: "/expeditions", icon: Ship },
      { key: "search", href: "/explore", icon: Compass },
      { key: "library", href: "/library/reports", icon: Library, children: LIBRARY_NAV },
      { key: "stories", href: "/stories", icon: Newspaper },
      { key: "map", href: "/map", icon: Map },
      { key: "pulse", href: "/pulse", icon: Activity },
      { key: "learn", href: "/learn", icon: GraduationCap },
      { key: "ask", href: "/ask", icon: MessageCircleQuestion },
    ],
  },
  {
    key: "studio",
    roles: ["curator", "reviewer", "admin"],
    items: [
      { key: "overview", href: "/studio", icon: LayoutDashboard },
      { key: "contentStudio", href: "/studio/content", icon: Sparkles },
      { key: "review", href: "/studio/review", icon: ListChecks, badge: "review" },
      { key: "calendar", href: "/studio/calendar", icon: CalendarDays },
      { key: "upload", href: "/studio/upload", icon: Upload },
      { key: "live", href: "/studio/live", icon: Radio },
      { key: "analytics", href: "/studio/analytics", icon: ChartNoAxesColumn },
    ],
  },
  {
    key: "admin",
    roles: ["admin"],
    items: [
      { key: "team", href: "/admin/team", icon: Users },
      { key: "settings", href: "/admin/settings", icon: Settings },
      { key: "audit", href: "/admin/audit", icon: ScrollText },
    ],
  },
];


/** Breadcrumb labels for path segments (nav keys). */
export const SEGMENT_LABELS: Record<string, string> = {
  portal: "home",
  expeditions: "expeditions",
  explore: "search",
  library: "library",
  reports: "reports",
  datasets: "datasets",
  publications: "publications",
  photos: "photos",
  videos: "videos",
  activities: "activities",
  stories: "stories",
  map: "map",
  pulse: "pulse",
  learn: "learn",
  glossary: "glossary",
  ask: "ask",
  studio: "studio",
  content: "contentStudio",
  review: "review",
  calendar: "calendar",
  upload: "upload",
  live: "live",
  analytics: "analytics",
  admin: "admin",
  team: "team",
  settings: "settings",
  audit: "audit",
  about: "about",
  accessibility: "accessibility",
  items: "library",
};
