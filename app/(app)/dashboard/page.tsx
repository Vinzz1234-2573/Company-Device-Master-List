import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AssetSummaryCards, AssetDistributionBar } from '@/components/asset-summary-cards';
import type { AssetStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<AssetStatus, string> = {
  available: 'Available',
  assigned: 'In Use',
  under_maintenance: 'Under Maintenance',
  lost: 'Lost / Missing',
  damaged: 'Damaged',
  retired: 'Retired',
  disposed: 'Disposed',
  pending_verification: 'Pending Verification',
};

export default async function DashboardPage() {
  const supabase = createClient();

  const [{ data: allAssets }, { data: assignedAssetIdRows }, { data: typeRows }, { data: deptRows }, { data: departments }, { data: recentLogs }, { data: outstanding }, { count: verifyAssets }, { count: verifyAssignments }] =
    await Promise.all([
      supabase.from('assets').select('id, status, asset_type, department_id'),
      supabase.from('asset_assignments').select('asset_id'),
      supabase.from('assets').select('asset_type'),
      supabase.from('assets').select('department_id'),
      supabase.from('departments').select('id, code, name'),
      supabase
        .from('audit_logs')
        .select('id, action, entity_type, user_email, created_at')
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('asset_assignments')
        .select('id, asset_id, employee:employees!inner(id, name, employment_status), assets!inner(asset_code, asset_type, description)')
        .is('returned_date', null)
        .eq('employee.employment_status', 'resigned'),
      supabase.from('assets').select('id', { count: 'exact', head: true }).eq('needs_verification', true),
      supabase.from('asset_assignments').select('id', { count: 'exact', head: true }).eq('needs_verification', true),
    ]);

  const total = allAssets?.length || 0;
  const everAssignedIds = new Set((assignedAssetIdRows || []).map(r => r.asset_id));

  const byStatus: Record<AssetStatus, number> = {
    available: 0,
    assigned: 0,
    under_maintenance: 0,
    lost: 0,
    damaged: 0,
    retired: 0,
    disposed: 0,
    pending_verification: 0,
  };
  const buckets = { inUse: 0, available: 0, inStock: 0, other: 0 };

  for (const asset of allAssets || []) {
    byStatus[asset.status as AssetStatus]++;
    if (asset.status === 'assigned') {
      buckets.inUse++;
    } else if (asset.status === 'available') {
      if (everAssignedIds.has(asset.id)) buckets.available++;
      else buckets.inStock++;
    } else {
      buckets.other++;
    }
  }

  const typeCounts = new Map<string, number>();
  for (const row of typeRows || []) {
    typeCounts.set(row.asset_type, (typeCounts.get(row.asset_type) || 0) + 1);
  }
  const topTypes = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

  const deptCounts = new Map<string, number>();
  for (const row of deptRows || []) {
    const key = row.department_id || 'none';
    deptCounts.set(key, (deptCounts.get(key) || 0) + 1);
  }
  const deptNameById = new Map((departments || []).map(d => [d.id, `${d.name} (${d.code})`]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Asset Overview</h1>
        <p className="text-sm text-slate-500">Track all company equipment and inventory</p>
      </div>

      <AssetSummaryCards counts={buckets} total={total} />

      {((outstanding && outstanding.length > 0) || (verifyAssets || 0) > 0 || (verifyAssignments || 0) > 0) && (
        <section className="card p-4 border-amber-300 bg-amber-50">
          <h2 className="text-sm font-semibold text-amber-800 mb-2">Administrative Alerts</h2>
          <ul className="space-y-1 text-sm text-amber-900">
            {outstanding && outstanding.length > 0 && (
              <li>
                <Link href="/employees?filter=resigned-outstanding" className="underline font-medium">
                  {outstanding.length} asset{outstanding.length === 1 ? '' : 's'} still assigned to resigned employees
                </Link>{' '}
                — please complete the return process.
              </li>
            )}
            {((verifyAssets || 0) > 0 || (verifyAssignments || 0) > 0) && (
              <li>
                <Link href="/verification" className="underline font-medium">
                  {(verifyAssets || 0) + (verifyAssignments || 0)} record{(verifyAssets || 0) + (verifyAssignments || 0) === 1 ? '' : 's'} require data verification
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Asset Distribution</h2>
        <AssetDistributionBar counts={buckets} total={total} />
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="card p-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Asset Status</h2>
          <ul className="space-y-1.5 text-sm">
            {(Object.keys(byStatus) as AssetStatus[]).map(status => (
              <li key={status} className="flex items-center justify-between">
                <span className="text-slate-700">{STATUS_LABELS[status]}</span>
                <span className="font-semibold text-slate-900">{byStatus[status]}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Asset Categories</h2>
          <ul className="space-y-1.5 text-sm">
            {topTypes.map(([type, count]) => (
              <li key={type} className="flex items-center justify-between">
                <span className="text-slate-700">{type}</span>
                <span className="font-semibold text-slate-900">{count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Department Summary</h2>
          <ul className="space-y-1.5 text-sm">
            {[...deptCounts.entries()].sort((a, b) => b[1] - a[1]).map(([id, count]) => (
              <li key={id} className="flex items-center justify-between">
                <span className="text-slate-700">{id === 'none' ? 'No Department' : deptNameById.get(id) || id}</span>
                <span className="font-semibold text-slate-900">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Entity</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {(recentLogs || []).map(log => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td>{log.action.replace(/_/g, ' ')}</td>
                  <td>{log.entity_type}</td>
                  <td>{log.user_email || '—'}</td>
                </tr>
              ))}
              {(!recentLogs || recentLogs.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center text-slate-400 py-4">
                    No activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
