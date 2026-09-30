import { Frame, FrameBody } from "@/components/frame";
import { Skeleton } from "@/components/ui/skeleton";

/** Frame-shaped placeholder shown while a portal page loads its data. */
export default function Loading() {
  return (
    <Frame>
      <div className="flex shrink-0 items-center gap-3" aria-busy="true" aria-label="Loading">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-3 w-80 max-w-full" />
        </div>
      </div>
      <FrameBody className="lg:grid-cols-12">
        <Skeleton className="min-h-64 rounded-2xl lg:col-span-8" />
        <Skeleton className="min-h-64 rounded-2xl lg:col-span-4" />
      </FrameBody>
    </Frame>
  );
}
