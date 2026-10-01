import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { VerificationBadge } from '@/components/badge';
import { Pagination } from '@/components/pagination';
import { ExportButtons } from '@/components/export-buttons';
import { PageHeader } from '@/components/page-header';
import { AssignmentsIcon } from '@/components/icons';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 30;

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; department?: string; page?: string };
}) {
  const supabase = createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('asset_assignments')
    .select('*, employee:employees(id, name), department:departments(id, code, name), asset:assets(id, asset_code, asset_type, description)', {
      count: 'exact',
    });

  if (searchParams.from) query = query.gte('issued_date', searchParams.from);
  if (searchParams.to) query = query.lte('issued_date', searchParams.to);
  if (searchParams.department) query = query.eq('department_id', searchParams.department);

  const { data: assignments, count } = await query.order('issued_date', { ascending: false, nullsFirst: false }).range(from, to);
  const { data: departments } = await supabase.from('departments').select('id, code, name').order('name');

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <PageHeader
        icon={AssignmentsIcon}
        eyebrow="Activity"
        title={`Asset Movement (${count || 0})`}
        subtitle="Every assign and return, in one timeline."
        actions={<ExportButtons rows={assignments || []} filename="asset-movement" />}
      />

      <form className="card p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end" method="get">
        <div>
          <label className="label">Issued From</label>
          <input type="date" name="from" defaultValue={searchParams.from} className="input" />
        </div>
        <div>
          <label className="label">Issued To</label>
          <input type="date" name="to" defaultValue={searchParams.to} className="input" />
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
        <div className="flex gap-2">
          <button type="submit" className="btn-primary w-full">
            Apply
          </button>
          <Link href="/assignments" className="btn-secondary">
            Clear
          </Link>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Issued</th>
              <th>Returned</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {(assignments || []).map(a => (
              <tr key={a.id}>
                <td data-label="Asset">
                  <Link href={`/assets/${a.asset?.id}`} className="text-brand-600 hover:underline">
                    {a.asset?.asset_code} — {a.asset?.asset_type}
                  </Link>
                </td>
                <td data-label="Employee">
                  <Link href={`/employees/${a.employee?.id}`} className="text-brand-600 hover:underline">
                    {a.employee?.name}
                  </Link>
                </td>
                <td data-label="Department">{a.department?.code || '—'}</td>
                <td data-label="Issued" className="whitespace-nowrap">
                  {a.issued_date || '—'}
                </td>
                <td data-label="Returned" className="whitespace-nowrap">
                  {a.returned_date || <span className="text-blue-600 font-medium">Current</span>}
                </td>
                <td data-label="Remarks" className="td-block max-w-xs">
                  <div className="truncate">{a.remarks || '—'}</div>
                  <VerificationBadge show={a.needs_verification} />
                </td>
              </tr>
            ))}
            {(!assignments || assignments.length === 0) && (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 py-8">
                  No assignment records match these filters.
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
