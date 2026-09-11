import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Pagination } from '@/components/pagination';
import { ExportButtons } from '@/components/export-buttons';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 40;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { entity_type?: string; action?: string; page?: string };
}) {
  const supabase = createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase.from('audit_logs').select('*', { count: 'exact' });
  if (searchParams.entity_type) query = query.eq('entity_type', searchParams.entity_type);
  if (searchParams.action) query = query.eq('action', searchParams.action);

  const { data: logs, count } = await query.order('created_at', { ascending: false }).range(from, to);
  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-slate-900">Audit Logs ({count || 0})</h1>
        <ExportButtons rows={logs || []} filename="audit-logs" />
      </div>

      <form className="card p-4 grid grid-cols-2 md:grid-cols-4 gap-3 items-end" method="get">
        <div>
          <label className="label">Entity Type</label>
          <select name="entity_type" defaultValue={searchParams.entity_type || ''} className="input">
            <option value="">All</option>
            <option value="asset">Asset</option>
            <option value="employee">Employee</option>
            <option value="department">Department</option>
            <option value="profile">User</option>
            <option value="asset_assignment">Assignment</option>
          </select>
        </div>
        <div>
          <label className="label">Action</label>
          <input name="action" defaultValue={searchParams.action} className="input" placeholder="e.g. asset_assigned" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary w-full">
            Apply
          </button>
          <Link href="/audit-logs" className="btn-secondary">
            Clear
          </Link>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>When</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {(logs || []).map(log => (
              <tr key={log.id}>
                <td className="whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                <td>{log.user_email || '—'}</td>
                <td>{log.action.replace(/_/g, ' ')}</td>
                <td>
                  {log.entity_type}
                  {log.entity_id ? ` (${log.entity_id.slice(0, 8)}…)` : ''}
                </td>
                <td className="max-w-sm">
                  <details>
                    <summary className="cursor-pointer text-brand-600 text-xs">View</summary>
                    <pre className="text-xs whitespace-pre-wrap bg-slate-50 p-2 rounded mt-1">
                      {JSON.stringify({ old: log.old_value, new: log.new_value }, null, 1)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan={5} className="text-center text-slate-400 py-8">
                  No audit log entries match these filters.
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
