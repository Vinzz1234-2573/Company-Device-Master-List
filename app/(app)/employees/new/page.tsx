import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdmin } from '@/lib/current-user';
import { createEmployee } from '@/lib/actions/employees';
import { EmployeeForm } from '../employee-form';

export default async function NewEmployeePage() {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect('/employees');

  const supabase = createClient();
  const { data: departments } = await supabase.from('departments').select('*').order('name');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Add Employee</h1>
      <EmployeeForm action={createEmployee} departments={departments || []} />
    </div>
  );
}
