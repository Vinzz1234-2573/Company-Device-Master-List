'use client';

import { useFormState } from 'react-dom';
import { uploadAssetDocument } from '@/lib/actions/assets';
import { SubmitButton } from '@/components/submit-button';

export function DocumentUploadForm({ assetId }: { assetId: string }) {
  const action = uploadAssetDocument.bind(null, assetId);
  const [state, formAction] = useFormState(action, { error: null });

  return (
    <form action={formAction} encType="multipart/form-data" className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[14rem]">
        <label className="label">Add a supporting document</label>
        <input
          type="file"
          name="file"
          required
          className="input file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
      </div>
      <SubmitButton className="btn-secondary">Upload</SubmitButton>
      {state?.error && <p className="text-sm text-red-600 w-full">{state.error}</p>}
    </form>
  );
}
