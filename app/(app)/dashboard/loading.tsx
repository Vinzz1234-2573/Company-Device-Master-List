import { PageHeaderSkeleton, CardGridSkeleton, TableSkeleton } from '@/components/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton />
      <TableSkeleton rows={4} />
    </div>
  );
}
