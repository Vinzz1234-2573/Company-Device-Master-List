import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PrintButton } from '@/components/print-button';

export default async function HandoverFormPage({ params }: { params: { assignmentId: string } }) {
  const supabase = createClient();
  const { data: a } = await supabase
    .from('asset_assignments')
    .select('*, asset:assets(*), employee:employees(*), department:departments(*)')
    .eq('id', params.assignmentId)
    .single();

  if (!a) notFound();

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex justify-end mb-4">
        <PrintButton />
      </div>
      <div className="border border-slate-300 p-8 space-y-6 text-sm">
        <div className="flex flex-col items-center gap-2">
          <Image src="/gamutpro-logo.png" alt="GamutPro" width={140} height={50} />
          <h1 className="text-xl font-bold text-center">Asset Handover Form</h1>
        </div>

        <table className="w-full">
          <tbody>
            <Row label="Employee Name" value={a.employee?.name} />
            <Row label="Job Title" value={a.employee?.job_title} />
            <Row label="Department" value={a.department ? `${a.department.name} (${a.department.code})` : ''} />
            <Row label="Asset" value={`${a.asset?.asset_code} — ${a.asset?.asset_type} ${a.asset?.brand || ''} ${a.asset?.model || ''}`} />
            <Row label="Serial Number" value={a.asset?.serial_no} />
            <Row label="Date Issued" value={a.issued_date} />
            <Row label="Condition When Issued" value={a.issue_condition} />
            <Row label="Issued By" value={a.issued_by} />
            <Row label="Remarks" value={a.remarks} />
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-8 pt-12">
          <div>
            <p className="border-t border-slate-400 pt-2">Employee Acknowledgement / Signature</p>
          </div>
          <div>
            <p className="border-t border-slate-400 pt-2">IT / Admin Acknowledgement / Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-4 font-medium text-slate-500 w-48 align-top">{label}</td>
      <td className="py-2">{value || '—'}</td>
    </tr>
  );
}
