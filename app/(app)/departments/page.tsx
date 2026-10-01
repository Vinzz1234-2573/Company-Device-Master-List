import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/page-header';
import { DepartmentsIcon } from '@/components/icons';
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
    <div className="space-y-6">
      <PageHeader icon={DepartmentsIcon} eyebrow="Structure" title="Departments" subtitle="Organizational units assets and employees belong to." />

      <section className="form-section max-w-xl">
        <h2 className="form-section-title">Add Department</h2>
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
