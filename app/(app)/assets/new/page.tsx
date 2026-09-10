import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdmin } from '@/lib/current-user';
import { createAsset } from '@/lib/actions/assets';
import { AssetForm } from '../asset-form';

export default async function NewAssetPage() {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect('/assets');

  const supabase = createClient();
  const { data: departments } = await supabase.from('departments').select('*').order('name');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Add Asset</h1>
      <AssetForm action={createAsset} departments={departments || []} />
    </div>
  );
}
