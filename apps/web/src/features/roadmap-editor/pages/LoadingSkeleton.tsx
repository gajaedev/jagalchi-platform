export function LoadingSkeleton() {
  return (
    <div className="bg-background flex h-screen w-screen flex-col">
      {/* Header Skeleton */}
      <div className="flex h-14 items-center gap-4 border-b px-4">
        <div className="bg-muted h-8 w-8 animate-pulse rounded" />
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
      </div>

      {/* Canvas + Sidebar */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Canvas Skeleton */}
        <div className="bg-muted/40 flex-1 animate-pulse" />

        {/* Sidebar Skeleton */}
        <div className="border-border bg-card w-[240px] border-l p-4">
          <div className="bg-muted mb-4 h-6 w-32 animate-pulse rounded" />
          <div className="space-y-4">
            <div className="bg-muted h-10 w-full animate-pulse rounded" />
            <div className="bg-muted h-20 w-full animate-pulse rounded" />
            <div className="bg-muted h-10 w-full animate-pulse rounded" />
            <div className="bg-muted h-10 w-full animate-pulse rounded" />
          </div>
        </div>

        {/* Toolbar Skeleton (absolute positioned) */}
        <div className="bg-muted absolute bottom-10 left-1/2 h-12 w-60 -translate-x-1/2 animate-pulse rounded-lg shadow-md" />
      </div>
    </div>
  );
}
