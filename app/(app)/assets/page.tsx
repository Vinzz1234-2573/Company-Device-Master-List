import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdmin } from '@/lib/current-user';
import { StatusBadge, VerificationBadge } from '@/components/badge';
import { Pagination } from '@/components/pagination';
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
  searchParams: { q?: string; type?: string; department?: string; status?: string; verification?: string; page?: string };
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
  if (searchParams.department) query = query.eq('department_id', searchParams.department);
  if (searchParams.status) query = query.eq('status', searchParams.status as AssetStatus);
  if (searchParams.verification === '1') query = query.eq('needs_verification', true);

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

  const { data: types } = await supabase.from('assets').select('asset_type');
  const distinctTypes = [...new Set((types || []).map(t => t.asset_type))].sort();
  const { data: departments } = await supabase.from('departments').select('id, code, name').order('name');

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-slate-900">Assets ({count || 0})</h1>
        <div className="flex gap-2">
          <ExportButtons rows={assets || []} filename="assets" />
          {isAdmin(profile) && (
            <Link href="/assets/new" className="btn-primary">
              Add Asset
            </Link>
          )}
        </div>
      </div>

      <form className="card p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end" method="get">
        <div className="col-span-2 md:col-span-1">
          <label className="label">Search</label>
          <input name="q" defaultValue={searchParams.q} className="input" placeholder="Type, brand, serial, IMEI…" />
        </div>
        <div>
          <label className="label">Asset Type</label>
          <select name="type" defaultValue={searchParams.type || ''} className="input">
            <option value="">All types</option>
            {distinctTypes.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
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
        <div className="flex gap-2">
          <button type="submit" className="btn-primary w-full">
            Apply Filters
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
              <th>Description / Serial</th>
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
                  <td className="font-medium text-slate-900 whitespace-nowrap">{asset.asset_code}</td>
                  <td>{asset.asset_type}</td>
                  <td className="max-w-xs">
                    <div className="truncate">{[asset.brand, asset.model, asset.description].filter(Boolean).join(' — ') || '—'}</div>
                    <div className="text-xs text-slate-400">{asset.serial_no || 'No serial'}</div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={asset.status} />
                      <VerificationBadge show={asset.needs_verification} />
                    </div>
                  </td>
                  <td>{holder?.name || <span className="text-slate-400">Unassigned</span>}</td>
                  <td>{asset.department?.code || '—'}</td>
                  <td>
                    <Link href={`/assets/${asset.id}`} className="text-brand-600 hover:underline text-sm font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(!assets || assets.length === 0) && (
              <tr>
                <td colSpan={7} className="text-center text-slate-400 py-8">
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
