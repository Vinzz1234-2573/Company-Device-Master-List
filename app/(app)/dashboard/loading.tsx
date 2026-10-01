import { PageHeaderSkeleton, CardGridSkeleton, TableSkeleton, Skeleton } from '@/components/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="card p-4">
        <Skeleton className="h-24 w-full" />
      </div>
      <CardGridSkeleton count={6} />
      <div className="grid lg:grid-cols-2 gap-6">
        <TableSkeleton rows={4} />
        <TableSkeleton rows={4} />
      </div>
    </div>
  );
}
