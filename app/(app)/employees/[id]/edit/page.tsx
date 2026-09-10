import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdmin } from '@/lib/current-user';
import { updateEmployee } from '@/lib/actions/employees';
import { EmployeeForm } from '../../employee-form';

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect(`/employees/${params.id}`);

  const supabase = createClient();
  const [{ data: employee }, { data: departments }] = await Promise.all([
    supabase.from('employees').select('*').eq('id', params.id).single(),
    supabase.from('departments').select('*').order('name'),
  ]);
  if (!employee) notFound();

  const action = updateEmployee.bind(null, params.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Edit Employee — {employee.name}</h1>
      <EmployeeForm action={action} employee={employee} departments={departments || []} />
    </div>
  );
}
