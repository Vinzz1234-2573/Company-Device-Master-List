import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdmin } from '@/lib/current-user';
import { updateAsset } from '@/lib/actions/assets';
import { getAssetCatalog } from '@/lib/catalog';
import { PageHeader } from '@/components/page-header';
import { AssetsIcon } from '@/components/icons';
import { AssetForm } from '../../asset-form';

export default async function EditAssetPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect(`/assets/${params.id}`);

  const supabase = createClient();
  const [{ data: asset }, { data: departments }, catalog] = await Promise.all([
    supabase.from('assets').select('*').eq('id', params.id).single(),
    supabase.from('departments').select('*').order('name'),
    getAssetCatalog(supabase),
  ]);
  if (!asset) notFound();

  const action = updateAsset.bind(null, params.id);

  return (
    <div className="space-y-5">
      <PageHeader icon={AssetsIcon} eyebrow="Editing" title={`Edit Asset — ${asset.asset_code}`} />
      <AssetForm action={action} asset={asset} departments={departments || []} catalog={catalog} />
    </div>
  );
}
