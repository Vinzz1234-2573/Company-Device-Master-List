'use client';

import Link from 'next/link';
import { useFormState } from 'react-dom';
import { useState } from 'react';
import { SubmitButton } from '@/components/submit-button';
import { GiftIcon, PaperclipIcon } from '@/components/icons';
import type { Asset, AcquisitionType, Department } from '@/lib/types';
import type { ActionState } from '@/lib/actions/assets';

const ASSET_TYPE_SUGGESTIONS = [
  'Laptop', 'Laptop Adapter', 'Desktop / PC', 'Monitor', 'Monitor Adapter', 'Handphone', 'Handphone Charger',
  'Simcard', 'Keyboard', 'Mouse', 'Printer', 'Camera', 'Camera Accessory', 'Tablet', 'HDMI Cable', 'Router',
  'Wifi Modem', 'Other',
];

export function AssetForm({
  action,
  asset,
  departments,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  asset?: Asset;
  departments: Department[];
}) {
  const [state, formAction] = useFormState(action, { error: null });
  const [confirmDup, setConfirmDup] = useState(false);
  const [acquisitionType, setAcquisitionType] = useState<AcquisitionType>(asset?.acquisition_type || 'purchased');
  const isDonation = acquisitionType === 'donation_in_kind';
  const cancelHref = asset ? `/assets/${asset.id}` : '/assets';

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-5 pb-20 sm:pb-5">
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <div className="form-section">
            <h2 className="form-section-title">Identification</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Asset Type *</label>
                <input name="asset_type" list="asset-types" defaultValue={asset?.asset_type} required className="input" placeholder="e.g. Laptop" />
                <datalist id="asset-types">
                  {ASSET_TYPE_SUGGESTIONS.map(t => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="label">Brand</label>
                <input name="brand" defaultValue={asset?.brand || ''} className="input" placeholder="e.g. Dell, Apple" />
              </div>
              <div>
                <label className="label">Model</label>
                <input name="model" defaultValue={asset?.model || ''} className="input" />
              </div>
              <div>
                <label className="label">Condition</label>
                <input name="condition" defaultValue={asset?.condition || ''} className="input" placeholder="e.g. Good, Fair, Needs repair" />
              </div>
              <div>
                <label className="label">Serial Number</label>
                <input name="serial_no" defaultValue={asset?.serial_no || ''} className="input" placeholder="Leave blank if not applicable" />
              </div>
              <div>
                <label className="label">IMEI</label>
                <input name="imei" defaultValue={asset?.imei || ''} className="input" placeholder="For phones / SIM devices" />
              </div>
              <div>
                <label className="label">SIM Number</label>
                <input name="sim_number" defaultValue={asset?.sim_number || ''} className="input" />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input name="phone_number" defaultValue={asset?.phone_number || ''} className="input" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="form-section-title">Notes</h2>
            <div>
              <label className="label">Description</label>
              <textarea name="description" defaultValue={asset?.description || ''} rows={2} className="input" placeholder="What is this item, and any distinguishing details" />
            </div>
            <div>
              <label className="label">Remarks</label>
              <textarea name="remarks" defaultValue={asset?.remarks || ''} rows={2} className="input" placeholder="Optional — anything else worth noting" />
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          <div className="form-section">
            <h2 className="form-section-title">Acquisition</h2>
            <div className="flex gap-2">
              <label
                className={`flex-1 cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-colors ${
                  !isDonation ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="acquisition_type"
                  value="purchased"
                  checked={!isDonation}
                  onChange={() => setAcquisitionType('purchased')}
                  className="sr-only"
                />
                Purchased
              </label>
              <label
                className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-colors ${
                  isDonation ? 'border-gold-500 bg-gold-50 text-gold-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="acquisition_type"
                  value="donation_in_kind"
                  checked={isDonation}
                  onChange={() => setAcquisitionType('donation_in_kind')}
                  className="sr-only"
                />
                <GiftIcon className="h-4 w-4" />
                Donation
              </label>
            </div>
            {!isDonation && (
              <>
                <input type="hidden" name="quantity" value={1} />
                <p className="help-text">A non-cash donation? Switch to "Donation" to record the donor and value instead.</p>
              </>
            )}

            {isDonation && (
              <div className="space-y-4 rounded-xl border border-gold-200 bg-gold-50/40 p-3">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold-700">
                  <GiftIcon className="h-3.5 w-3.5" /> Donation Details
                </p>
                <div>
                  <label className="label">Donor Name *</label>
                  <input name="donor_name" defaultValue={asset?.donor_name || ''} required={isDonation} className="input" placeholder="Who gave this?" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Quantity *</label>
                    <input type="number" name="quantity" min={1} step={1} defaultValue={asset?.quantity || 1} required={isDonation} className="input" />
                  </div>
                  <div>
                    <label className="label">Value (RM)</label>
                    <input
                      type="number"
                      name="donation_value"
                      min={0}
                      step="0.01"
                      defaultValue={asset?.donation_value ?? ''}
                      className="input"
                      placeholder="1500.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Date Received</label>
                  <input type="date" name="donation_received_date" defaultValue={asset?.donation_received_date || ''} className="input" />
                </div>
                <div>
                  <label className="label flex items-center gap-1.5">
                    <PaperclipIcon className="h-3.5 w-3.5" /> Supporting Documents
                  </label>
                  <input
                    type="file"
                    name="supporting_documents"
                    multiple
                    className="input file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
                  />
                  <p className="help-text">
                    Donation letter, delivery order, photos, etc. Max 10MB per file.
                    {asset && ' Existing documents are managed below on the asset page.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <h2 className="form-section-title">Location &amp; Ownership</h2>
            <div>
              <label className="label">Location</label>
              <input name="location" defaultValue={asset?.location || ''} className="input" placeholder="e.g. HQ Store Room" />
            </div>
            <div>
              <label className="label">Department</label>
              <select name="department_id" defaultValue={asset?.department_id || ''} className="input">
                <option value="">— None —</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {state?.error?.includes('Potential duplicate') && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 space-y-2">
          <p>{state.error}</p>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={confirmDup} onChange={e => setConfirmDup(e.target.checked)} />
            I confirm this is a different, distinct physical asset.
          </label>
        </div>
      )}
      {state?.error && !state.error.includes('Potential duplicate') && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <input type="hidden" name="override_duplicate" value={confirmDup ? 'on' : ''} />

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="flex items-center gap-3 sm:max-w-none">
          <SubmitButton>{asset ? 'Save Changes' : 'Add Asset'}</SubmitButton>
          <Link href={cancelHref} className="btn-secondary">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
