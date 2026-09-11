import { createClient } from '@/lib/supabase/server';
import { NewDepartmentForm } from './new-department-form';
import { DepartmentRow } from './department-row';

export const dynamic = 'force-dynamic';

export default async function DepartmentsPage() {
  const supabase = createClient();
  const { data: departments } = await supabase.from('departments').select('*').order('name');
  const { data: assetRows } = await supabase.from('assets').select('department_id');

  const counts = new Map<string, number>();
  for (const row of assetRows || []) {
    if (!row.department_id) continue;
    counts.set(row.department_id, (counts.get(row.department_id) || 0) + 1);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold text-slate-900">Departments</h1>

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Add Department</h2>
        <NewDepartmentForm />
      </section>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Assets</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(departments || []).map(d => (
              <DepartmentRow key={d.id} department={d} assetCount={counts.get(d.id) || 0} />
            ))}
            {(!departments || departments.length === 0) && (
              <tr>
                <td colSpan={5} className="text-center text-slate-400 py-8">
                  No departments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
