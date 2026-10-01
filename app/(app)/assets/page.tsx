import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdmin } from '@/lib/current-user';
import { StatusBadge, VerificationBadge, DonationBadge } from '@/components/badge';
import { Pagination } from '@/components/pagination';
import { PageHeader } from '@/components/page-header';
import { TypeBrandFilter } from '@/components/type-brand-filter';
import { AssetsIcon } from '@/components/icons';
import { getAssetCatalog } from '@/lib/catalog';
import type { AssetStatus } from '@/lib/types';
import { ExportButtons } from '@/components/export-buttons';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

const STATUS_OPTIONS: AssetStatus[] = [
  'available',
  'assigned',
  'under_maintenance',
  'lost',
  'damaged',
  'retired',
  'disposed',
  'pending_verification',
];

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    type?: string;
    brand?: string;
    department?: string;
    status?: string;
    verification?: string;
    acquisition?: string;
    location?: string;
    condition?: string;
    from?: string;
    to?: string;
    page?: string;
  };
}) {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase.from('assets').select('*, department:departments(id, code, name)', { count: 'exact' });

  if (searchParams.q) {
    const q = searchParams.q.trim();
    query = query.or(
      `asset_code.ilike.%${q}%,asset_type.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%,description.ilike.%${q}%,serial_no.ilike.%${q}%,imei.ilike.%${q}%,phone_number.ilike.%${q}%,remarks.ilike.%${q}%`
    );
  }
  if (searchParams.type) query = query.eq('asset_type', searchParams.type);
  if (searchParams.brand) query = query.eq('brand', searchParams.brand);
  if (searchParams.department) query = query.eq('department_id', searchParams.department);
  if (searchParams.status) query = query.eq('status', searchParams.status as AssetStatus);
  if (searchParams.verification === '1') query = query.eq('needs_verification', true);
  if (searchParams.acquisition) query = query.eq('acquisition_type', searchParams.acquisition);
  if (searchParams.location) query = query.eq('location', searchParams.location);
  if (searchParams.condition) query = query.eq('condition', searchParams.condition);
  if (searchParams.from) query = query.gte('created_at', searchParams.from);
  if (searchParams.to) query = query.lte('created_at', `${searchParams.to}T23:59:59`);

  const { data: assets, count } = await query.order('asset_code', { ascending: true }).range(from, to);

  const assetIds = (assets || []).map(a => a.id);
  const { data: openAssignments } = assetIds.length
    ? await supabase
        .from('asset_assignments')
        .select('asset_id, employee:employees(id, name)')
        .in('asset_id', assetIds)
        .is('returned_date', null)
        .returns<{ asset_id: string; employee: { id: string; name: string } | null }[]>()
    : { data: [] as { asset_id: string; employee: { id: string; name: string } | null }[] };

  const holderByAsset = new Map((openAssignments || []).map(a => [a.asset_id, a.employee]));

  const [catalog, { data: locationRows }, { data: departments }] = await Promise.all([
    getAssetCatalog(supabase),
    supabase.from('assets').select('location').not('location', 'is', null),
    supabase.from('departments').select('id, code, name').order('name'),
  ]);
  const distinctLocations = [...new Set((locationRows || []).map(l => l.location).filter(Boolean))].sort() as string[];

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <PageHeader
        icon={AssetsIcon}
        eyebrow="Inventory"
        title={`Assets (${count || 0})`}
        subtitle="Search, filter, and manage every tracked device and item."
        actions={
          <>
            <ExportButtons rows={assets || []} filename="assets" />
            {isAdmin(profile) && (
              <Link href="/assets/new" className="btn-primary">
                + Add Asset
              </Link>
            )}
          </>
        }
      />

      <form className="card p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 items-end" method="get">
        <div className="col-span-2 md:col-span-2">
          <label className="label">Search</label>
          <input name="q" defaultValue={searchParams.q} className="input" placeholder="Type, brand, serial, IMEI…" />
        </div>
        <TypeBrandFilter catalog={catalog} defaultType={searchParams.type || ''} defaultBrand={searchParams.brand || ''} />
        <div>
          <label className="label">Department</label>
          <select name="department" defaultValue={searchParams.department || ''} className="input">
            <option value="">All departments</option>
            {(departments || []).map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select name="status" defaultValue={searchParams.status || ''} className="input">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Acquisition</label>
          <select name="acquisition" defaultValue={searchParams.acquisition || ''} className="input">
            <option value="">All</option>
            <option value="purchased">Purchased</option>
            <option value="donation_in_kind">Donation in Kind</option>
          </select>
        </div>
        <div>
          <label className="label">Location</label>
          <select name="location" defaultValue={searchParams.location || ''} className="input">
            <option value="">All locations</option>
            {distinctLocations.map(l => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Added From</label>
          <input type="date" name="from" defaultValue={searchParams.from} className="input" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary w-full">
            Apply
          </button>
          <Link href="/assets" className="btn-secondary">
            Clear
          </Link>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Asset Code</th>
              <th>Type</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Department</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(assets || []).map(asset => {
              const holder = holderByAsset.get(asset.id);
              return (
                <tr key={asset.id}>
                  <td data-label="Asset Code" className="font-medium text-slate-900 whitespace-nowrap">
                    {asset.asset_code}
                  </td>
                  <td data-label="Type">{asset.asset_type}</td>
                  <td data-label="Brand">{asset.brand || '—'}</td>
                  <td data-label="Model" className="td-block">
                    <div className="truncate">{asset.model || '—'}</div>
                    <div className="text-xs text-slate-400">{asset.serial_no || 'No serial'}</div>
                  </td>
                  <td data-label="Status">
                    <div className="flex flex-col items-end gap-1 md:items-start">
                      <StatusBadge status={asset.status} />
                      <DonationBadge show={asset.acquisition_type === 'donation_in_kind'} />
                      <VerificationBadge show={asset.needs_verification} />
                    </div>
                  </td>
                  <td data-label="Assigned To">{holder?.name || <span className="text-slate-400">Unassigned</span>}</td>
                  <td data-label="Department">{asset.department?.code || '—'}</td>
                  <td data-label="">
                    <Link href={`/assets/${asset.id}`} className="text-brand-600 hover:underline text-sm font-medium">
                      View Details
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(!assets || assets.length === 0) && (
              <tr>
                <td colSpan={8} className="text-center text-slate-400 py-8">
                  No assets match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
