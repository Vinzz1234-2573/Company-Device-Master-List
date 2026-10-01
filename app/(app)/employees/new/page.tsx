import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdmin } from '@/lib/current-user';
import { createEmployee } from '@/lib/actions/employees';
import { PageHeader } from '@/components/page-header';
import { EmployeesIcon } from '@/components/icons';
import { EmployeeForm } from '../employee-form';

export default async function NewEmployeePage() {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect('/employees');

  const supabase = createClient();
  const { data: departments } = await supabase.from('departments').select('*').order('name');

  return (
    <div className="space-y-5">
      <PageHeader icon={EmployeesIcon} eyebrow="New Record" title="Add Employee" />
      <EmployeeForm action={createEmployee} departments={departments || []} />
    </div>
  );
}
