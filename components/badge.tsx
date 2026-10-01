import { GiftIcon } from '@/components/icons';
import type { AssetStatus, EmploymentStatus, UserRole } from '@/lib/types';

const STATUS_STYLES: Record<AssetStatus, string> = {
  available: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  assigned: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  under_maintenance: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  lost: 'bg-red-50 text-red-700 ring-red-600/20',
  damaged: 'bg-red-50 text-red-700 ring-red-600/20',
  retired: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  disposed: 'bg-slate-100 text-slate-500 ring-slate-500/20',
  pending_verification: 'bg-purple-50 text-purple-700 ring-purple-600/20',
};

const STATUS_LABELS: Record<AssetStatus, string> = {
  available: 'Available',
  assigned: 'Assigned',
  under_maintenance: 'Under Maintenance',
  lost: 'Lost / Missing',
  damaged: 'Damaged',
  retired: 'Retired',
  disposed: 'Disposed',
  pending_verification: 'Pending Verification',
};

export function StatusBadge({ status }: { status: AssetStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

const EMPLOYMENT_STYLES: Record<EmploymentStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  resigned: 'bg-red-50 text-red-700 ring-red-600/20',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  on_leave: 'bg-amber-50 text-amber-700 ring-amber-600/20',
};
const EMPLOYMENT_LABELS: Record<EmploymentStatus, string> = {
  active: 'Active',
  resigned: 'Resigned',
  inactive: 'Inactive',
  on_leave: 'On Leave',
};

export function EmploymentBadge({ status }: { status: EmploymentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${EMPLOYMENT_STYLES[status]}`}>
      {EMPLOYMENT_LABELS[status]}
    </span>
  );
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  staff: 'Staff',
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/20">
      {ROLE_LABELS[role]}
    </span>
  );
}

export function VerificationBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20">
      ⚠ Needs Verification
    </span>
  );
}

export function DonationBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-gold-400/10 text-gold-600 ring-1 ring-inset ring-gold-500/30">
      <GiftIcon className="h-3 w-3" /> Donation in Kind
    </span>
  );
}
