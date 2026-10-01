import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { resolveAssetVerification, resolveAssignmentVerification } from '@/lib/actions/verification';
import { PageHeader } from '@/components/page-header';
import { VerificationIcon } from '@/components/icons';
import { ResolveForm } from './resolve-form';

export const dynamic = 'force-dynamic';

export default async function VerificationPage() {
  const supabase = createClient();

  type AssignmentVerificationRow = {
    id: string;
    verification_reason: string | null;
    asset: { id?: string; asset_code: string; asset_type: string } | null;
    employee: { id: string; name: string } | null;
  };
  type ClearanceRow = {
    id: string;
    issued_date: string | null;
    asset: { id: string; asset_code: string; asset_type: string } | null;
    employee: { id: string; name: string; employment_status: string } | null;
  };

  const [{ data: assets }, { data: assignments }, { data: clearance }] = await Promise.all([
    supabase.from('assets').select('*').eq('needs_verification', true).order('asset_code'),
    supabase
      .from('asset_assignments')
      .select('*, asset:assets(asset_code, asset_type), employee:employees(id, name)')
      .eq('needs_verification', true)
      .returns<AssignmentVerificationRow[]>(),
    supabase
      .from('asset_assignments')
      .select('id, issued_date, asset:assets(id, asset_code, asset_type), employee:employees!inner(id, name, employment_status)')
      .is('returned_date', null)
      .eq('employee.employment_status', 'resigned')
      .returns<ClearanceRow[]>(),
  ]);

  const total = (assets?.length || 0) + (assignments?.length || 0) + (clearance?.length || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={VerificationIcon}
        eyebrow="Data Quality"
        title="Data Verification"
        subtitle={`${total} record${total === 1 ? '' : 's'} awaiting review`}
      />

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Assets ({assets?.length || 0})
        </h2>
        <div className="space-y-3">
          {(assets || []).map(a => (
            <div key={a.id} className="border border-slate-200 rounded-md p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/assets/${a.id}`} className="font-medium text-brand-600 hover:underline">
                    {a.asset_code} — {a.asset_type}
                  </Link>
                  <p className="text-sm text-slate-600">{a.verification_reason}</p>
                </div>
                <Link href={`/assets/${a.id}/edit`} className="btn-secondary shrink-0">
                  Correct
                </Link>
              </div>
              <ResolveForm action={resolveAssetVerification.bind(null, a.id)} />
            </div>
          ))}
          {(!assets || assets.length === 0) && <p className="text-sm text-slate-400">No asset records need verification.</p>}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Assignment History ({assignments?.length || 0})
        </h2>
        <div className="space-y-3">
          {(assignments || []).map(a => (
            <div key={a.id} className="border border-slate-200 rounded-md p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/assets/${a.asset?.id ?? ''}`} className="font-medium text-brand-600 hover:underline">
                    {a.asset?.asset_code} — {a.asset?.asset_type}
                  </Link>
                  <p className="text-sm text-slate-600">
                    Employee: {a.employee?.name} · {a.verification_reason}
                  </p>
                </div>
              </div>
              <ResolveForm action={resolveAssignmentVerification.bind(null, a.id)} />
            </div>
          ))}
          {(!assignments || assignments.length === 0) && <p className="text-sm text-slate-400">No assignment records need verification.</p>}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Returned Asset Still Assigned — Resigned Employees ({clearance?.length || 0})
        </h2>
        <div className="space-y-2">
          {(clearance || []).map(c => (
            <div key={c.id} className="border border-slate-200 rounded-md p-3 flex items-center justify-between">
              <div className="text-sm">
                <Link href={`/employees/${c.employee?.id}`} className="font-medium text-brand-600 hover:underline">
                  {c.employee?.name}
                </Link>{' '}
                still holds{' '}
                <Link href={`/assets/${c.asset?.id}`} className="font-medium text-brand-600 hover:underline">
                  {c.asset?.asset_code} — {c.asset?.asset_type}
                </Link>{' '}
                (issued {c.issued_date || 'unknown date'})
              </div>
              <Link href={`/assets/${c.asset?.id}/return`} className="btn-secondary">
                Return Asset
              </Link>
            </div>
          ))}
          {(!clearance || clearance.length === 0) && <p className="text-sm text-slate-400">No outstanding assets from resigned employees.</p>}
        </div>
      </section>
    </div>
  );
}
