import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdmin } from '@/lib/current-user';
import { EmploymentBadge } from '@/components/badge';
import { ExportButtons } from '@/components/export-buttons';
import { PageHeader } from '@/components/page-header';
import { EmployeesIcon } from '@/components/icons';
import type { EmploymentStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: { q?: string; department?: string; status?: string; filter?: string };
}) {
  const supabase = createClient();
  const profile = await getCurrentProfile();

  let query = supabase.from('employees').select('*, department:departments(id, code, name)');
  if (searchParams.q) query = query.ilike('name', `%${searchParams.q}%`);
  if (searchParams.department) query = query.eq('department_id', searchParams.department);
  if (searchParams.status) query = query.eq('employment_status', searchParams.status as EmploymentStatus);
  if (searchParams.filter === 'resigned-outstanding') query = query.eq('employment_status', 'resigned');

  let { data: employees } = await query.order('name');
  const { data: departments } = await supabase.from('departments').select('id, code, name').order('name');

  const employeeIds = (employees || []).map(e => e.id);
  const { data: openAssignments } = employeeIds.length
    ? await supabase.from('asset_assignments').select('employee_id').in('employee_id', employeeIds).is('returned_date', null)
    : { data: [] as { employee_id: string }[] };
  const outstandingCount = new Map<string, number>();
  for (const a of openAssignments || []) {
    outstandingCount.set(a.employee_id, (outstandingCount.get(a.employee_id) || 0) + 1);
  }

  if (searchParams.filter === 'resigned-outstanding') {
    employees = (employees || []).filter(e => (outstandingCount.get(e.id) || 0) > 0);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        icon={EmployeesIcon}
        eyebrow="People"
        title={`Employees (${employees?.length || 0})`}
        subtitle="Who holds what — search, filter, and manage staff records."
        actions={
          <>
            <ExportButtons rows={employees || []} filename="employees" />
            {isAdmin(profile) && (
              <Link href="/employees/new" className="btn-primary">
                + Add Employee
              </Link>
            )}
          </>
        }
      />

      <form className="card p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end" method="get">
        <div>
          <label className="label">Search by name</label>
          <input name="q" defaultValue={searchParams.q} className="input" />
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
          <label className="label">Employment Status</label>
          <select name="status" defaultValue={searchParams.status || ''} className="input">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="resigned">Resigned</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary w-full">
            Apply
          </button>
          <Link href="/employees" className="btn-secondary">
            Clear
          </Link>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Name</th>
              <th>Job Title</th>
              <th>Department</th>
              <th>Status</th>
              <th>Assets Held</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(employees || []).map(emp => {
              const held = outstandingCount.get(emp.id) || 0;
              return (
                <tr key={emp.id}>
                  <td data-label="Name" className="font-medium text-slate-900">
                    {emp.name}
                  </td>
                  <td data-label="Job Title">{emp.job_title || '—'}</td>
                  <td data-label="Department">{emp.department ? `${emp.department.code}` : '—'}</td>
                  <td data-label="Status">
                    <EmploymentBadge status={emp.employment_status} />
                  </td>
                  <td data-label="Assets Held">
                    {held > 0 && emp.employment_status === 'resigned' ? (
                      <span className="font-semibold text-red-600">{held} (outstanding)</span>
                    ) : (
                      held
                    )}
                  </td>
                  <td data-label="">
                    <Link href={`/employees/${emp.id}`} className="text-brand-600 hover:underline text-sm font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(!employees || employees.length === 0) && (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 py-8">
                  No employees match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
