import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdmin } from '@/lib/current-user';
import { ReturnForm } from './return-form';

export default async function ReturnAssetPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect(`/assets/${params.id}`);

  const supabase = createClient();
  const { data: asset } = await supabase.from('assets').select('id, asset_code, asset_type').eq('id', params.id).single();
  if (!asset) notFound();

  const { data: assignment } = await supabase
    .from('asset_assignments')
    .select('id, employee:employees(name)')
    .eq('asset_id', params.id)
    .is('returned_date', null)
    .maybeSingle<{ id: string; employee: { name: string } | null }>();

  if (!assignment) redirect(`/assets/${params.id}`);

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-bold text-slate-900">
        Return Asset — {asset.asset_code} ({asset.asset_type})
      </h1>
      <p className="text-sm text-slate-500">Currently with {assignment.employee?.name}</p>
      <ReturnForm assignmentId={assignment.id} assetId={asset.id} />
    </div>
  );
}
