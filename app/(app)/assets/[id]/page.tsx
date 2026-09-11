import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdmin } from '@/lib/current-user';
import { StatusBadge, VerificationBadge } from '@/components/badge';
import { StatusChangeForm } from './status-change-form';

export const dynamic = 'force-dynamic';

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const profile = await getCurrentProfile();

  const { data: asset } = await supabase.from('assets').select('*, department:departments(id, code, name)').eq('id', params.id).single();
  if (!asset) notFound();

  const { data: history } = await supabase
    .from('asset_assignments')
    .select('*, employee:employees(id, name, job_title), department:departments(id, code, name)')
    .eq('asset_id', params.id)
    .order('issued_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  const activeAssignment = (history || []).find(h => !h.returned_date) || null;
  const admin = isAdmin(profile);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-slate-400">{asset.asset_code}</p>
          <h1 className="text-xl font-bold text-slate-900">
            {asset.asset_type}
            {asset.brand ? ` — ${asset.brand}` : ''} {asset.model || ''}
          </h1>
          <div className="mt-1 flex gap-2">
            <StatusBadge status={asset.status} />
            <VerificationBadge show={asset.needs_verification} />
          </div>
        </div>
        {admin && (
          <div className="flex flex-wrap gap-2">
            <Link href={`/assets/${asset.id}/edit`} className="btn-secondary">
              Edit
            </Link>
            {!activeAssignment ? (
              <Link href={`/assets/${asset.id}/assign`} className="btn-primary">
                Assign Asset
              </Link>
            ) : (
              <>
                <Link href={`/assets/${asset.id}/return`} className="btn-primary">
                  Return Asset
                </Link>
                <Link href={`/print/handover/${activeAssignment.id}`} className="btn-secondary" target="_blank">
                  Print Handover Form
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {asset.needs_verification && asset.verification_reason && (
        <div className="card p-4 border-purple-300 bg-purple-50 text-sm text-purple-900">
          <p className="font-semibold mb-1">This record needs verification</p>
          <p>{asset.verification_reason}</p>
          {admin && (
            <Link href="/verification" className="underline font-medium">
              Go to Data Verification
            </Link>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card p-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Asset Information</h2>
          <dl className="text-sm space-y-2">
            <Row label="Asset Type" value={asset.asset_type} />
            <Row label="Brand" value={asset.brand} />
            <Row label="Model" value={asset.model} />
            <Row label="Description" value={asset.description} multiline />
            <Row label="Serial Number" value={asset.serial_no} />
            <Row label="IMEI" value={asset.imei} />
            <Row label="SIM Number" value={asset.sim_number} />
            <Row label="Phone Number" value={asset.phone_number} />
            <Row label="Location" value={asset.location} />
            <Row label="Condition" value={asset.condition} />
            <Row label="Department" value={asset.department ? `${asset.department.name} (${asset.department.code})` : null} />
            <Row label="Remarks" value={asset.remarks} multiline />
          </dl>
        </section>

        <section className="card p-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Current Assignment</h2>
          {activeAssignment ? (
            <dl className="text-sm space-y-2">
              <Row
                label="Employee"
                value={
                  <Link href={`/employees/${activeAssignment.employee?.id}`} className="text-brand-600 hover:underline">
                    {activeAssignment.employee?.name}
                  </Link>
                }
              />
              <Row label="Job Title" value={activeAssignment.employee?.job_title} />
              <Row label="Department" value={activeAssignment.department ? `${activeAssignment.department.name} (${activeAssignment.department.code})` : null} />
              <Row label="Date Issued" value={activeAssignment.issued_date} />
              <Row label="Expected Return" value={activeAssignment.expected_return_date} />
              <Row label="Condition When Issued" value={activeAssignment.issue_condition} />
              <Row label="Issued By" value={activeAssignment.issued_by} />
            </dl>
          ) : (
            <p className="text-sm text-slate-400">This asset is not currently assigned to anyone.</p>
          )}

          {admin && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Change Status</h3>
              <StatusChangeForm assetId={asset.id} currentStatus={asset.status} />
            </div>
          )}
        </section>
      </div>

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Assignment History</h2>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date Issued</th>
                <th>Date Returned</th>
                <th>Remarks</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(history || []).map(h => (
                <tr key={h.id}>
                  <td>
                    <Link href={`/employees/${h.employee?.id}`} className="text-brand-600 hover:underline">
                      {h.employee?.name}
                    </Link>
                  </td>
                  <td>{h.department?.code || '—'}</td>
                  <td className="whitespace-nowrap">{h.issued_date || '—'}</td>
                  <td className="whitespace-nowrap">{h.returned_date || (!h.returned_date && <span className="text-blue-600 font-medium">Current</span>)}</td>
                  <td className="max-w-sm">
                    <div className="whitespace-pre-wrap">{h.remarks || '—'}</div>
                    <VerificationBadge show={h.needs_verification} />
                  </td>
                  <td className="whitespace-nowrap text-xs space-x-2">
                    <Link href={`/print/handover/${h.id}`} target="_blank" className="text-brand-600 hover:underline">
                      Handover
                    </Link>
                    {h.returned_date && (
                      <Link href={`/print/return/${h.id}`} target="_blank" className="text-brand-600 hover:underline">
                        Return
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {(!history || history.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-6">
                    No assignment history recorded for this asset yet.
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
      <dt className="w-40 shrink-0 text-slate-500">{label}</dt>
      <dd className={`text-slate-900 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value || <span className="text-slate-300">—</span>}</dd>
    </div>
  );
}
