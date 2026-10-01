import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdmin } from '@/lib/current-user';
import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/kpi-card';
import { DonutChart } from '@/components/donut-chart';
import { BarList } from '@/components/bar-list';
import { TrendChart, type TrendPoint } from '@/components/trend-chart';
import { TypeBrandFilter } from '@/components/type-brand-filter';
import { getAssetCatalog } from '@/lib/catalog';
import {
  DashboardIcon,
  AssetsIcon,
  EmployeesIcon,
  AssignmentsIcon,
  ReportsIcon,
  DepartmentsIcon,
  BellIcon,
  TagIcon,
  FolderIcon,
  ClockIcon,
  GiftIcon,
  FilterIcon,
  CoinIcon,
  AlertCircleIcon,
  InfoIcon,
} from '@/components/icons';
import type { AssetStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<AssetStatus, string> = {
  available: 'Available',
  assigned: 'In Use',
  under_maintenance: 'Under Maintenance',
  lost: 'Lost / Missing',
  damaged: 'Damaged',
  retired: 'Retired',
  disposed: 'Disposed',
  pending_verification: 'Pending Verification',
};

const STATUS_COLORS: Record<AssetStatus, string> = {
  assigned: '#3b82f6',
  available: '#10b981',
  under_maintenance: '#f59e0b',
  damaged: '#f43f5e',
  lost: '#ef4444',
  retired: '#94a3b8',
  disposed: '#64748b',
  pending_verification: '#a855f7',
};

const STATUS_ORDER: AssetStatus[] = [
  'assigned',
  'available',
  'under_maintenance',
  'damaged',
  'lost',
  'retired',
  'disposed',
  'pending_verification',
];

const TREND_PERIODS = [
  { key: '7d', label: '7D', days: 7, granularity: 'day' as const },
  { key: '30d', label: '30D', days: 30, granularity: 'day' as const },
  { key: '3m', label: '3M', days: 90, granularity: 'week' as const },
  { key: '6m', label: '6M', days: 180, granularity: 'week' as const },
  { key: '1y', label: '1Y', days: 365, granularity: 'month' as const },
];

const TREND_SERIES = [
  { key: 'added', label: 'Added', color: '#3b82f6' },
  { key: 'assigned', label: 'Assigned', color: '#10b981' },
  { key: 'returned', label: 'Returned', color: '#f59e0b' },
  { key: 'disposed', label: 'Disposed', color: '#64748b' },
];

const ACTIVITY_LABELS: Record<string, { title: string; detail: string }> = {
  asset_created: { title: 'Asset added', detail: 'A new asset record was created' },
  asset_edited: { title: 'Asset updated', detail: 'Asset information was modified' },
  asset_assigned: { title: 'Asset assigned', detail: 'Asset was assigned to an employee' },
  asset_returned: { title: 'Asset returned', detail: 'Asset was returned' },
  asset_status_changed: { title: 'Asset status changed', detail: 'Asset status was updated' },
  asset_document_uploaded: { title: 'Document uploaded', detail: 'A supporting document was added' },
  asset_document_deleted: { title: 'Document removed', detail: 'A supporting document was deleted' },
  department_created: { title: 'Department added', detail: 'A new department was created' },
  department_edited: { title: 'Department renamed', detail: 'Department name was updated' },
  department_reactivated: { title: 'Department reactivated', detail: 'Department was marked active again' },
  department_deactivated: { title: 'Department deactivated', detail: 'Department was marked inactive' },
  employee_created: { title: 'Employee added', detail: 'A new employee record was created' },
  employee_edited: { title: 'Employee updated', detail: 'Employee information was modified' },
  employee_status_changed: { title: 'Employee status changed', detail: 'Employment status was updated' },
  user_created: { title: 'User created', detail: 'A new system user was created' },
  user_role_changed: { title: 'User role changed', detail: "A user's role was updated" },
  verification_resolved: { title: 'Verification completed', detail: 'A flagged record was reviewed' },
};

type Filters = {
  status: string;
  type: string;
  brand: string;
  department: string;
  acquisition: string;
  location: string;
  from: string;
  to: string;
};

function buildAssetsHref(filters: Filters, overrides: Partial<Filters & { status: string }>) {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, String(value));
  }
  const qs = params.toString();
  return `/assets${qs ? `?${qs}` : ''}`;
}

function buildDashboardHref(filters: Filters, trend: string, overrides: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, trend, ...overrides })) {
    if (value) params.set(key, String(value));
  }
  const qs = params.toString();
  return `/dashboard${qs ? `?${qs}` : ''}`;
}

function formatActivityTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString('en-MY', { hour: 'numeric', minute: '2-digit' });
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay) return `Today · ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })} · ${time}`;
}

function bucketKey(date: Date, granularity: 'day' | 'week' | 'month') {
  if (granularity === 'month') return `${date.getFullYear()}-${date.getMonth()}`;
  if (granularity === 'week') {
    const d = new Date(date);
    const diffToMonday = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - diffToMonday);
    return d.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function bucketLabel(date: Date, granularity: 'day' | 'week' | 'month') {
  if (granularity === 'month') return date.toLocaleDateString('en-MY', { month: 'short' });
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: {
    status?: string;
    type?: string;
    brand?: string;
    department?: string;
    acquisition?: string;
    location?: string;
    from?: string;
    to?: string;
    trend?: string;
  };
}) {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  const admin = isAdmin(profile);

  const f: Filters = {
    status: searchParams.status || '',
    type: searchParams.type || '',
    brand: searchParams.brand || '',
    department: searchParams.department || '',
    acquisition: searchParams.acquisition || '',
    location: searchParams.location || '',
    from: searchParams.from || '',
    to: searchParams.to || '',
  };
  const hasFilters = Object.values(f).some(Boolean);
  const period = TREND_PERIODS.find(p => p.key === searchParams.trend) || TREND_PERIODS[1];

  let assetsQuery = supabase
    .from('assets')
    .select('id, status, asset_type, brand, department_id, acquisition_type, donation_value, location, created_at');
  if (f.status) assetsQuery = assetsQuery.eq('status', f.status as AssetStatus);
  if (f.type) assetsQuery = assetsQuery.eq('asset_type', f.type);
  if (f.brand) assetsQuery = assetsQuery.eq('brand', f.brand);
  if (f.department) assetsQuery = assetsQuery.eq('department_id', f.department);
  if (f.acquisition) assetsQuery = assetsQuery.eq('acquisition_type', f.acquisition);
  if (f.location) assetsQuery = assetsQuery.eq('location', f.location);
  if (f.from) assetsQuery = assetsQuery.gte('created_at', f.from);
  if (f.to) assetsQuery = assetsQuery.lte('created_at', `${f.to}T23:59:59`);

  const trendStart = new Date();
  trendStart.setHours(0, 0, 0, 0);
  trendStart.setDate(trendStart.getDate() - period.days + 1);

  const [
    { data: filteredAssets },
    { data: assignedAssetIdRows },
    { data: departments },
    catalog,
    { data: locationRows },
    { data: recentLogs },
    { data: outstanding },
    { count: verifyAssets },
    { count: verifyAssignments },
    { data: trendLogs },
  ] = await Promise.all([
    assetsQuery,
    supabase.from('asset_assignments').select('asset_id'),
    supabase.from('departments').select('id, code, name'),
    getAssetCatalog(supabase),
    supabase.from('assets').select('location').not('location', 'is', null),
    supabase
      .from('audit_logs')
      .select('id, action, entity_type, user_email, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('asset_assignments')
      .select('id, asset_id, employee:employees!inner(id, name, employment_status), assets!inner(asset_code, asset_type, description)')
      .is('returned_date', null)
      .eq('employee.employment_status', 'resigned'),
    supabase.from('assets').select('id', { count: 'exact', head: true }).eq('needs_verification', true),
    supabase.from('asset_assignments').select('id', { count: 'exact', head: true }).eq('needs_verification', true),
    supabase
      .from('audit_logs')
      .select('action, created_at, new_value')
      .in('action', ['asset_created', 'asset_assigned', 'asset_returned', 'asset_status_changed'])
      .gte('created_at', trendStart.toISOString()),
  ]);

  const total = filteredAssets?.length || 0;
  const everAssignedIds = new Set((assignedAssetIdRows || []).map(r => r.asset_id));
  const distinctLocations = [...new Set((locationRows || []).map(l => l.location).filter(Boolean))].sort() as string[];
  const deptNameById = new Map((departments || []).map(d => [d.id, d.name]));
  const deptCodeById = new Map((departments || []).map(d => [d.id, d.code]));

  const byStatus: Record<AssetStatus, number> = {
    available: 0,
    assigned: 0,
    under_maintenance: 0,
    lost: 0,
    damaged: 0,
    retired: 0,
    disposed: 0,
    pending_verification: 0,
  };
  const buckets = { inUse: 0, available: 0, inStock: 0 };
  const typeCounts = new Map<string, number>();
  const deptCounts = new Map<string, number>();
  let donationValueTotal = 0;
  let donationValueInUse = 0;
  let donationValueAvailable = 0;
  const valueByType = new Map<string, number>();
  const valueByDept = new Map<string, number>();

  for (const asset of filteredAssets || []) {
    const status = asset.status as AssetStatus;
    byStatus[status]++;
    typeCounts.set(asset.asset_type, (typeCounts.get(asset.asset_type) || 0) + 1);
    const deptKey = asset.department_id || 'none';
    deptCounts.set(deptKey, (deptCounts.get(deptKey) || 0) + 1);

    if (status === 'assigned') buckets.inUse++;
    else if (status === 'available') {
      if (everAssignedIds.has(asset.id)) buckets.available++;
      else buckets.inStock++;
    }

    const value = Number(asset.donation_value) || 0;
    if (asset.acquisition_type === 'donation_in_kind' && value > 0) {
      donationValueTotal += value;
      if (status === 'assigned') donationValueInUse += value;
      if (status === 'available') donationValueAvailable += value;
      valueByType.set(asset.asset_type, (valueByType.get(asset.asset_type) || 0) + value);
      valueByDept.set(deptKey, (valueByDept.get(deptKey) || 0) + value);
    }
  }

  const topTypes = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topDepts = [...deptCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const attentionCount = outstanding?.length || 0;
  const verificationCount = (verifyAssets || 0) + (verifyAssignments || 0);

  const rm = (n: number) => `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  // ---- trend chart buckets ----
  const bucketOrder: string[] = [];
  const bucketMap = new Map<string, TrendPoint>();
  const step = new Date(trendStart);
  const incrementDays = period.granularity === 'month' ? 1 : period.granularity === 'week' ? 7 : 1;
  const seen = new Set<string>();
  while (step <= new Date()) {
    const key = bucketKey(step, period.granularity);
    if (!seen.has(key)) {
      seen.add(key);
      bucketOrder.push(key);
      bucketMap.set(key, { label: bucketLabel(step, period.granularity), values: { added: 0, assigned: 0, returned: 0, disposed: 0 } });
    }
    step.setDate(step.getDate() + incrementDays);
  }

  for (const log of trendLogs || []) {
    const d = new Date(log.created_at);
    const key = bucketKey(d, period.granularity);
    const bucket = bucketMap.get(key);
    if (!bucket) continue;
    if (log.action === 'asset_created') bucket.values.added++;
    else if (log.action === 'asset_assigned') bucket.values.assigned++;
    else if (log.action === 'asset_returned') bucket.values.returned++;
    else if (log.action === 'asset_status_changed' && (log.new_value as { status?: string } | null)?.status === 'disposed') bucket.values.disposed++;
  }
  const trendPoints = bucketOrder.map(k => bucketMap.get(k)!);

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        icon={DashboardIcon}
        eyebrow="Overview"
        title="Asset Overview"
        subtitle="Monitor company assets, assignments, availability and data quality."
        actions={
          admin && (
            <>
              <Link href="/assets/new" className="btn-primary">
                + Add Asset
              </Link>
              <Link href="/employees/new" className="btn-secondary">
                + Add Employee
              </Link>
            </>
          )
        }
      />

      {/* Dashboard filters */}
      <section className="form-section">
        <h2 className="form-section-title">
          <FilterIcon className="h-4 w-4 text-slate-400" /> Dashboard Filters
        </h2>
        <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 items-end" method="get">
          <div>
            <label className="label">Status</label>
            <select name="status" defaultValue={f.status} className="input">
              <option value="">All statuses</option>
              {STATUS_ORDER.map(s => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <TypeBrandFilter catalog={catalog} defaultType={f.type} defaultBrand={f.brand} />
          <div>
            <label className="label">Department</label>
            <select name="department" defaultValue={f.department} className="input">
              <option value="">All departments</option>
              {(departments || []).map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <select name="location" defaultValue={f.location} className="input">
              <option value="">All locations</option>
              {distinctLocations.map(l => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Donation Type</label>
            <select name="acquisition" defaultValue={f.acquisition} className="input">
              <option value="">All</option>
              <option value="purchased">Purchased</option>
              <option value="donation_in_kind">Donation in Kind</option>
            </select>
          </div>
          <div>
            <label className="label">Added From</label>
            <input type="date" name="from" defaultValue={f.from} className="input" />
          </div>
          <div>
            <label className="label">Added To</label>
            <input type="date" name="to" defaultValue={f.to} className="input" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary w-full">
              Apply
            </button>
            {hasFilters && (
              <Link href="/dashboard" className="btn-secondary">
                Reset
              </Link>
            )}
          </div>
        </form>
      </section>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <KpiCard icon={AssetsIcon} label="Total Assets" value={total} sub="All recorded assets" tone="default" href={buildAssetsHref(f, {})} />
        <KpiCard
          icon={AssignmentsIcon}
          label="In Use"
          value={buckets.inUse}
          sub={total > 0 ? `${Math.round((buckets.inUse / total) * 100)}% of total` : 'No assets yet'}
          tone="blue"
          href={buildAssetsHref(f, { status: 'assigned' })}
        />
        <KpiCard
          icon={AssetsIcon}
          label="Available"
          value={buckets.available}
          sub="Ready to reassign"
          tone="emerald"
          href={buildAssetsHref(f, { status: 'available' })}
        />
        <KpiCard
          icon={FolderIcon}
          label="In Stock"
          value={buckets.inStock}
          sub="New / unused inventory"
          tone="amber"
          href={buildAssetsHref(f, { status: 'available' })}
        />
        <KpiCard
          icon={AlertCircleIcon}
          label="Attention Required"
          value={attentionCount}
          sub="Resigned staff still holding assets"
          tone="red"
          href="/employees?filter=resigned-outstanding"
        />
        <KpiCard
          icon={InfoIcon}
          label="Verification"
          value={verificationCount}
          sub="Records to review"
          tone="purple"
          href="/verification"
        />
      </div>

      {/* Asset Health + Asset Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-5">
          <h2 className="section-title">
            <DashboardIcon className="h-4 w-4 text-slate-400" /> Asset Health
          </h2>
          <DonutChart
            total={total}
            centerLabel="assets"
            segments={STATUS_ORDER.filter(s => byStatus[s] > 0).map(s => ({
              label: STATUS_LABELS[s],
              value: byStatus[s],
              color: STATUS_COLORS[s],
              href: buildAssetsHref(f, { status: s }),
            }))}
          />
        </section>

        <section className="card p-5">
          <h2 className="section-title">
            <TagIcon className="h-4 w-4 text-slate-400" /> Asset Categories
          </h2>
          <BarList items={topTypes.map(([type, count]) => ({ label: type, value: count, href: buildAssetsHref(f, { type }) }))} />
          <Link href="/assets" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
            View All Categories →
          </Link>
        </section>
      </div>

      {/* Departments + Asset Activity trend */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-5">
          <h2 className="section-title">
            <DepartmentsIcon className="h-4 w-4 text-slate-400" /> Assets by Department
          </h2>
          <BarList
            colorClass="bg-gold-500"
            items={topDepts.map(([id, count]) => ({
              label: id === 'none' ? 'No Department' : `${deptNameById.get(id) || id} (${deptCodeById.get(id) || ''})`,
              value: count,
              href: id === 'none' ? undefined : buildAssetsHref(f, { department: id }),
            }))}
          />
          <Link href="/departments" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
            View All Departments →
          </Link>
        </section>

        <section className="card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="section-title mb-0">
              <ClockIcon className="h-4 w-4 text-slate-400" /> Asset Activity
            </h2>
            <div className="flex gap-1">
              {TREND_PERIODS.map(p => (
                <Link
                  key={p.key}
                  href={buildDashboardHref(f, p.key, {})}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    p.key === period.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
          <TrendChart points={trendPoints} series={TREND_SERIES} />
        </section>
      </div>

      {/* Asset Value (only if real donation value data exists) */}
      {donationValueTotal > 0 && (
        <section className="card p-5">
          <h2 className="section-title">
            <CoinIcon className="h-4 w-4 text-slate-400" /> Asset Value
          </h2>
          <p className="help-text mb-4 -mt-2">Based on recorded estimated value of Donation in Kind assets.</p>
          <div className="grid sm:grid-cols-3 gap-4 mb-5">
            <div className="rounded-xl border border-slate-200 p-4">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">Total Value</span>
              <strong className="block text-2xl font-bold text-slate-900 mt-1">{rm(donationValueTotal)}</strong>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">Value In Use</span>
              <strong className="block text-2xl font-bold text-slate-900 mt-1">{rm(donationValueInUse)}</strong>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">Available Value</span>
              <strong className="block text-2xl font-bold text-slate-900 mt-1">{rm(donationValueAvailable)}</strong>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">By Category</h3>
              <BarList
                colorClass="bg-gold-500"
                items={[...valueByType.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([type, value]) => ({ label: `${type} — ${rm(value)}`, value, href: buildAssetsHref(f, { type, acquisition: 'donation_in_kind' }) }))}
              />
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">By Department</h3>
              <BarList
                colorClass="bg-gold-500"
                items={[...valueByDept.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([id, value]) => ({
                    label: `${id === 'none' ? 'No Department' : deptNameById.get(id) || id} — ${rm(value)}`,
                    value,
                    href: id === 'none' ? undefined : buildAssetsHref(f, { department: id, acquisition: 'donation_in_kind' }),
                  }))}
              />
            </div>
          </div>
        </section>
      )}

      {/* Requires Attention + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-5">
          <h2 className="section-title">
            <BellIcon className="h-4 w-4 text-slate-400" /> Requires Attention
          </h2>
          <div className="space-y-3">
            {attentionCount > 0 && (
              <Link
                href="/employees?filter=resigned-outstanding"
                className="block rounded-xl border border-red-200 bg-red-50 p-3 transition-colors hover:bg-red-100"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
                  <AlertCircleIcon className="h-4 w-4" /> {attentionCount} asset{attentionCount === 1 ? '' : 's'} assigned to resigned employees
                </p>
                <p className="mt-1 text-xs text-red-700">These assets may need to be returned and reassigned. Review assets →</p>
              </Link>
            )}
            {verificationCount > 0 && (
              <Link href="/verification" className="block rounded-xl border border-amber-200 bg-amber-50 p-3 transition-colors hover:bg-amber-100">
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <InfoIcon className="h-4 w-4" /> {verificationCount} record{verificationCount === 1 ? '' : 's'} require verification
                </p>
                <p className="mt-1 text-xs text-amber-700">Some asset or assignment information needs review. Review verification →</p>
              </Link>
            )}
            {attentionCount === 0 && verificationCount === 0 && <p className="text-sm text-slate-400">Nothing needs your attention right now.</p>}
          </div>
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title mb-0">
              <ClockIcon className="h-4 w-4 text-slate-400" /> Recent Activity
            </h2>
            <Link href="/audit-logs" className="text-sm font-medium text-brand-600 hover:underline">
              View All Activity →
            </Link>
          </div>
          <ul className="space-y-3">
            {(recentLogs || []).map(log => {
              const friendly = ACTIVITY_LABELS[log.action] || { title: log.action.replace(/_/g, ' '), detail: '' };
              return (
                <li key={log.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{friendly.title}</p>
                    {friendly.detail && <p className="text-xs text-slate-500">{friendly.detail}</p>}
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs text-slate-400">{formatActivityTime(log.created_at)}</span>
                </li>
              );
            })}
            {(!recentLogs || recentLogs.length === 0) && <li className="text-sm text-slate-400">No activity recorded yet.</li>}
          </ul>
        </section>
      </div>

      {/* Quick Actions */}
      {admin && (
        <section className="card p-5">
          <h2 className="section-title">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction href="/assets/new" icon={AssetsIcon} label="+ Add Asset" desc="Create a new asset record." />
            <QuickAction href="/employees/new" icon={EmployeesIcon} label="+ Add Employee" desc="Register a new employee." />
            <QuickAction href="/assets/new?acquisition=donation_in_kind" icon={GiftIcon} label="+ Donation in Kind" desc="Record a non-cash donation." />
            <QuickAction href={buildAssetsHref(f, { status: 'available' })} icon={AssignmentsIcon} label="Assign Asset" desc="Issue equipment to staff." />
            <QuickAction href="/reports" icon={ReportsIcon} label="View Reports" desc="Open ready-made reports." />
          </div>
        </section>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  desc,
}: {
  href: string;
  icon: (p: { className?: string }) => JSX.Element;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm"
    >
      <span className="icon-chip h-9 w-9 shrink-0 rounded-lg">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="block text-xs text-slate-500">{desc}</span>
      </span>
    </Link>
  );
}
