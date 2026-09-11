'use client';

import { useFormState } from 'react-dom';
import { SubmitButton } from '@/components/submit-button';
import type { ActionState } from '@/lib/actions/assets';

export function ResolveForm({ action }: { action: (state: ActionState, formData: FormData) => Promise<ActionState> }) {
  const [state, formAction] = useFormState(action, { error: null });

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-2">
      <input name="note" className="input flex-1 min-w-[10rem]" placeholder="Verification note (optional)" />
      <SubmitButton className="btn-secondary">Resolve</SubmitButton>
      {state?.error && <p className="text-sm text-red-600 w-full">{state.error}</p>}
    </form>
  );
}
