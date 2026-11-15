
import { useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '../api/client';

type Props = {
  ticketId: number;
  eligible: boolean;
  hasWarranty: boolean;
};

export default function CreateWarrantyButton({
  ticketId,
  eligible,
  hasWarranty,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function createWarranty() {
    if (!eligible || hasWarranty || saving) return;

    if (
      !window.confirm(
        'Xác nhận lập phiếu bảo hành cho yêu cầu này?',
      )
    ) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api(
        `/support/tickets/${ticketId}/warranty`,
        { method: 'POST' },
      );

      router.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể lập phiếu bảo hành.',
      );
      setSaving(false);
    }
  }

  if (hasWarranty) {
    return null;
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        disabled={!eligible || saving}
        onClick={() => void createWarranty()}
        className="rounded-xl bg-[#315b3d] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving
          ? 'Đang lập phiếu...'
          : 'Lập phiếu bảo hành'}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
