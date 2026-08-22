import { Skeleton } from "@/components/ui/skeleton";

export default function OperatorLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div><Skeleton className="h-6 w-48" /><Skeleton className="mt-2 h-4 w-64" /></div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-44 w-full rounded-xl" />
      <Skeleton className="h-36 w-full rounded-xl" />
    </div>
  );
}
