import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdmin } from '@/lib/current-user';
import { EmploymentBadge, StatusBadge } from '@/components/badge';
import { EmploymentStatusForm } from './employment-status-form';

export const dynamic = 'force-dynamic';

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const profile = await getCurrentProfile();

  const { data: employee } = await supabase.from('employees').select('*, department:departments(id, code, name)').eq('id', params.id).single();
  if (!employee) notFound();

  const { data: history } = await supabase
    .from('asset_assignments')
    .select('*, asset:assets(id, asset_code, asset_type, description, serial_no, status)')
    .eq('employee_id', params.id)
    .order('issued_date', { ascending: false, nullsFirst: false });

  const outstanding = (history || []).filter(h => !h.returned_date);
  const admin = isAdmin(profile);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{employee.name}</h1>
          <p className="text-sm text-slate-500">{employee.job_title || '—'}</p>
          <div className="mt-1">
            <EmploymentBadge status={employee.employment_status} />
          </div>
        </div>
        {admin && (
          <Link href={`/employees/${employee.id}/edit`} className="btn-secondary">
            Edit
          </Link>
        )}
      </div>

      {employee.employment_status === 'resigned' && outstanding.length > 0 && (
        <div className="card p-4 border-red-300 bg-red-50 text-sm text-red-900">
          This employee has {outstanding.length} asset{outstanding.length === 1 ? '' : 's'} currently assigned. Please complete the asset
          return process.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card p-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Employee Information</h2>
          <dl className="text-sm space-y-2">
            <Row label="Employee No." value={employee.employee_no} />
            <Row label="Department" value={employee.department ? `${employee.department.name} (${employee.department.code})` : null} />
            <Row label="Email" value={employee.email} />
            <Row label="Phone" value={employee.phone} />
            <Row label="Date Joined" value={employee.joined_date} />
            <Row label="Date Resigned" value={employee.resigned_date} />
            <Row label="Remarks" value={employee.remarks} multiline />
          </dl>
        </section>

        {admin && (
          <section className="card p-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Employment Status</h2>
            <EmploymentStatusForm employeeId={employee.id} current={employee.employment_status} />
          </section>
        )}
      </div>

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Assigned Assets ({history?.length || 0})</h2>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Serial</th>
                <th>Status</th>
                <th>Date Issued</th>
                <th>Date Returned</th>
              </tr>
            </thead>
            <tbody>
              {(history || []).map(h => (
                <tr key={h.id}>
                  <td data-label="Asset">
                    <Link href={`/assets/${h.asset?.id}`} className="text-brand-600 hover:underline">
                      {h.asset?.asset_code} — {h.asset?.asset_type}
                    </Link>
                  </td>
                  <td data-label="Serial">{h.asset?.serial_no || '—'}</td>
                  <td data-label="Status">{h.asset && <StatusBadge status={h.asset.status} />}</td>
                  <td data-label="Date Issued" className="whitespace-nowrap">
                    {h.issued_date || '—'}
                  </td>
                  <td data-label="Date Returned" className="whitespace-nowrap">
                    {h.returned_date || <span className="text-blue-600 font-medium">Current</span>}
                  </td>
                </tr>
              ))}
              {(!history || history.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-6">
                    No assets have been issued to this employee yet.
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

function Row({ label, value, multiline = false }: { label: string; value: React.ReactNode; multiline?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-slate-500">{label}</dt>
      <dd className={`text-slate-900 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value || <span className="text-slate-300">—</span>}</dd>
    </div>
  );
}
