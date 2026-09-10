import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdmin } from '@/lib/current-user';
import { AssignForm } from './assign-form';

export default async function AssignAssetPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect(`/assets/${params.id}`);

  const supabase = createClient();
  const [{ data: asset }, { data: employees }] = await Promise.all([
    supabase.from('assets').select('id, asset_code, asset_type, status').eq('id', params.id).single(),
    supabase.from('employees').select('id, name, job_title, employment_status').eq('employment_status', 'active').order('name'),
  ]);
  if (!asset) notFound();
  if (asset.status === 'assigned') redirect(`/assets/${params.id}`);

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-bold text-slate-900">
        Assign Asset — {asset.asset_code} ({asset.asset_type})
      </h1>
      <AssignForm assetId={asset.id} employees={employees || []} />
    </div>
  );
}
