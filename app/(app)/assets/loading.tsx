import { PageHeaderSkeleton, TableSkeleton } from '@/components/skeleton';

export default function AssetsLoading() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} />
    </div>
  );
}
