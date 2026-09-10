import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdmin } from '@/lib/current-user';
import { updateAsset } from '@/lib/actions/assets';
import { AssetForm } from '../../asset-form';

export default async function EditAssetPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect(`/assets/${params.id}`);

  const supabase = createClient();
  const [{ data: asset }, { data: departments }] = await Promise.all([
    supabase.from('assets').select('*').eq('id', params.id).single(),
    supabase.from('departments').select('*').order('name'),
  ]);
  if (!asset) notFound();

  const action = updateAsset.bind(null, params.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Edit Asset — {asset.asset_code}</h1>
      <AssetForm action={action} asset={asset} departments={departments || []} />
    </div>
  );
}
