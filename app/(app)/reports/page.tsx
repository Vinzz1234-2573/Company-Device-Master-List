import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/badge';
import { ExportButtons } from '@/components/export-buttons';
import { PageHeader } from '@/components/page-header';
import { ReportsIcon } from '@/components/icons';
import type { Asset, AssetStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

const REPORTS = [
  { key: 'register', label: 'Asset Register' },
  { key: 'employee', label: 'Employee Asset Report' },
  { key: 'department', label: 'Department Asset Report' },
  { key: 'unassigned', label: 'Unassigned Asset Report' },
  { key: 'returned', label: 'Returned Asset Report' },
  { key: 'missing', label: 'Missing / Lost Asset Report' },
  { key: 'maintenance', label: 'Maintenance Report' },
  { key: 'clearance', label: 'Employee Clearance Report' },
  { key: 'donations', label: 'Donation in Kind Report' },
] as const;

type ReportKey = (typeof REPORTS)[number]['key'];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { type?: string; employee?: string; department?: string };
}) {
  const supabase = createClient();
  const type: ReportKey = (REPORTS.find(r => r.key === searchParams.type)?.key || 'register') as ReportKey;

  const { data: employees } = await supabase.from('employees').select('id, name').order('name');
  const { data: departments } = await supabase.from('departments').select('id, code, name').order('name');

  let rows: Record<string, unknown>[] = [];
  let columns: { key: string; label: string }[] = [];

  if (type === 'register') {
    const { data } = await supabase.from('assets').select('*, department:departments(code)').order('asset_code');
    rows = data || [];
    columns = [
      { key: 'asset_code', label: 'Asset Code' },
      { key: 'asset_type', label: 'Type' },
      { key: 'brand', label: 'Brand' },
      { key: 'model', label: 'Model' },
      { key: 'serial_no', label: 'Serial No.' },
      { key: 'status', label: 'Status' },
      { key: 'department', label: 'Dept' },
    ];
  } else if (type === 'employee') {
    if (searchParams.employee) {
      const { data } = await supabase
        .from('asset_assignments')
        .select('*, asset:assets(asset_code, asset_type, serial_no, status)')
        .eq('employee_id', searchParams.employee)
        .order('issued_date', { ascending: false });
      rows = data || [];
    }
    columns = [
      { key: 'asset', label: 'Asset' },
      { key: 'issued_date', label: 'Issued' },
      { key: 'returned_date', label: 'Returned' },
      { key: 'remarks', label: 'Remarks' },
    ];
  } else if (type === 'department') {
    if (searchParams.department) {
      const { data } = await supabase.from('assets').select('*').eq('department_id', searchParams.department).order('asset_code');
      rows = data || [];
    }
    columns = [
      { key: 'asset_code', label: 'Asset Code' },
      { key: 'asset_type', label: 'Type' },
      { key: 'serial_no', label: 'Serial No.' },
      { key: 'status', label: 'Status' },
    ];
  } else if (type === 'unassigned') {
    const { data } = await supabase.from('assets').select('*').eq('status', 'available').order('asset_code');
    rows = data || [];
    columns = [
      { key: 'asset_code', label: 'Asset Code' },
      { key: 'asset_type', label: 'Type' },
      { key: 'serial_no', label: 'Serial No.' },
      { key: 'location', label: 'Location' },
    ];
  } else if (type === 'returned') {
    const { data } = await supabase
      .from('asset_assignments')
      .select('*, asset:assets(asset_code, asset_type, serial_no), employee:employees(name)')
      .not('returned_date', 'is', null)
      .order('returned_date', { ascending: false })
      .limit(200);
    rows = data || [];
    columns = [
      { key: 'asset', label: 'Asset' },
      { key: 'employee', label: 'Employee' },
      { key: 'returned_date', label: 'Returned' },
      { key: 'return_condition', label: 'Condition' },
    ];
  } else if (type === 'missing') {
    const { data } = await supabase.from('assets').select('*').in('status', ['lost', 'damaged']).order('asset_code');
    rows = data || [];
    columns = [
      { key: 'asset_code', label: 'Asset Code' },
      { key: 'asset_type', label: 'Type' },
      { key: 'serial_no', label: 'Serial No.' },
      { key: 'status', label: 'Status' },
      { key: 'remarks', label: 'Remarks' },
    ];
  } else if (type === 'maintenance') {
    const { data } = await supabase.from('assets').select('*').eq('status', 'under_maintenance').order('asset_code');
    rows = data || [];
    columns = [
      { key: 'asset_code', label: 'Asset Code' },
      { key: 'asset_type', label: 'Type' },
      { key: 'serial_no', label: 'Serial No.' },
      { key: 'remarks', label: 'Remarks' },
    ];
  } else if (type === 'donations') {
    const { data } = await supabase
      .from('assets')
      .select('*, department:departments(code)')
      .eq('acquisition_type', 'donation_in_kind')
      .order('donation_received_date', { ascending: false, nullsFirst: false });
    rows = data || [];
    columns = [
      { key: 'asset_code', label: 'Asset Code' },
      { key: 'asset_type', label: 'Type' },
      { key: 'description', label: 'Description' },
      { key: 'quantity', label: 'Qty' },
      { key: 'donor_name', label: 'Donor' },
      { key: 'donation_value', label: 'Est. Value (RM)' },
      { key: 'donation_received_date', label: 'Date Received' },
      { key: 'department', label: 'Dept' },
    ];
  } else if (type === 'clearance') {
    const { data } = await supabase
      .from('asset_assignments')
      .select('*, asset:assets(asset_code, asset_type, serial_no), employee:employees!inner(id, name, employment_status)')
      .is('returned_date', null)
      .eq('employee.employment_status', 'resigned');
    rows = data || [];
    columns = [
      { key: 'employee', label: 'Employee' },
      { key: 'asset', label: 'Asset' },
      { key: 'issued_date', label: 'Issued' },
    ];
  }

  return (
    <div className="space-y-4">
      <PageHeader icon={ReportsIcon} eyebrow="Insights" title="Reports" subtitle="Generate and export ready-made reports for audits and reviews." />

      <div className="flex flex-wrap gap-2">
        {REPORTS.map(r => (
          <Link
            key={r.key}
            href={`/reports?type=${r.key}`}
            className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              type === r.key ? 'bg-brand-600 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      {type === 'employee' && (
        <form className="card p-4 flex flex-wrap items-end gap-3" method="get">
          <input type="hidden" name="type" value="employee" />
          <div className="flex-1 min-w-[16rem]">
            <label className="label">Employee</label>
            <select name="employee" defaultValue={searchParams.employee || ''} className="input">
              <option value="">Select employee…</option>
              {(employees || []).map(e => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Generate
          </button>
        </form>
      )}

      {type === 'department' && (
        <form className="card p-4 flex flex-wrap items-end gap-3" method="get">
          <input type="hidden" name="type" value="department" />
          <div className="flex-1 min-w-[16rem]">
            <label className="label">Department</label>
            <select name="department" defaultValue={searchParams.department || ''} className="input">
              <option value="">Select department…</option>
              {(departments || []).map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Generate
          </button>
        </form>
      )}

      <div className="flex justify-end">
        <ExportButtons rows={rows} filename={`report-${type}`} />
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map(c => (
                  <td key={c.key} data-label={c.label}>
                    {renderCell(row, c.key)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center text-slate-400 py-8">
                  {type === 'employee' || type === 'department' ? 'Choose a selection above to generate this report.' : 'No records found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderCell(row: Record<string, unknown>, key: string) {
  const value = row[key];
  if (key === 'status') return <StatusBadge status={value as AssetStatus} />;
  if (key === 'donation_value' && typeof value === 'number') return `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
  if (key === 'department' && value && typeof value === 'object') return (value as { code?: string }).code || '—';
  if (key === 'asset' && value && typeof value === 'object') {
    const a = value as Partial<Asset>;
    return `${a.asset_code || ''} — ${a.asset_type || ''}`.trim();
  }
  if (key === 'employee' && value && typeof value === 'object') return (value as { name?: string }).name || '—';
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}
