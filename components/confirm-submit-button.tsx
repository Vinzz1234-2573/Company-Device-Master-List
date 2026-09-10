'use client';

import { useFormStatus } from 'react-dom';

export function ConfirmSubmitButton({
  confirmMessage,
  className = 'btn-danger',
  children,
}: {
  confirmMessage: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={e => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {pending ? 'Working…' : children}
    </button>
  );
}
