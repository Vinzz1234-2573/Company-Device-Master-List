import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdmin } from '@/lib/current-user';
import { createAsset } from '@/lib/actions/assets';
import { PageHeader } from '@/components/page-header';
import { AssetsIcon } from '@/components/icons';
import { AssetForm } from '../asset-form';

export default async function NewAssetPage() {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect('/assets');

  const supabase = createClient();
  const { data: departments } = await supabase.from('departments').select('*').order('name');

  return (
    <div className="space-y-5">
      <PageHeader
        icon={AssetsIcon}
        eyebrow="New Record"
        title="Add Asset"
        subtitle="Purchased or a non-cash donation — switch Acquisition type on the right to match."
      />
      <AssetForm action={createAsset} departments={departments || []} />
    </div>
  );
}
