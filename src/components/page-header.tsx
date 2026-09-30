/** Centered placeholder for an empty list or a search with no results. Page layout lives in `components/frame.tsx`. */
export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-14 text-center">
      {icon && <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>}
      <p className="font-medium">{title}</p>
      {body && <p className="max-w-md text-sm text-muted-foreground">{body}</p>}
      {action}
    </div>
  );
}
