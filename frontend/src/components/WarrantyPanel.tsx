
import { useCallback, useEffect, useState } from 'react';
import { api, getUser } from '../api/client';

type WarrantyTicket = {
  MaYC: number;
  NhomYeuCau: string;
  MaBH: number | null;
  ConQuyenLoi: boolean | number | null;
  MocBatDau: string | null;
  MocHetHan: string | null;
  NgayBatDauBaoHanh: string | null;
  NgayHetHanBaoHanh: string | null;
  TrangThaiBaoHanh: string | null;
  NguyenNhan: string | null;
  KetQuaKiemTra: string | null;
  HuongXuLy: string | null;
  MaNVXacMinh: number | null;
  NgayXacMinh: string | null;
};

type TicketResponse = {
  ticket: WarrantyTicket;
};

type Props = {
  maYC: number;
};

const inputClass =
  'w-full rounded-xl border border-[#d6e1d3] bg-white px-4 py-3 outline-none focus:border-[#315b3d]';

const solutions = [
  'Sửa chữa',
  'Chăm sóc',
  'Thay cây',
  'Hoàn tiền',
];

function formatDate(value: string | null) {
  if (!value) return 'Chưa xác định';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Chưa xác định'
    : date.toLocaleString('vi-VN');
}

export default function WarrantyPanel({ maYC }: Props) {
  const [ticket, setTicket] = useState<WarrantyTicket | null>(null);
  const [nguyenNhan, setNguyenNhan] = useState('');
  const [ketQua, setKetQua] = useState('');
  const [huongXuLy, setHuongXuLy] = useState('Chăm sóc');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');


const [canManage, setCanManage] = useState(false);

useEffect(() => {
  const user = getUser();

  setCanManage(
    user?.TenVaiTro === 'Quản trị viên' ||
    user?.TenVaiTro === 'Nhân viên',
  );
}, []);


  const loadWarranty = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api<TicketResponse>(
        `/support/tickets/${maYC}`,
      );

      const data = result.ticket;

      setTicket(data);
      setNguyenNhan(data.NguyenNhan ?? '');
      setKetQua(data.KetQuaKiemTra ?? '');
      setHuongXuLy(data.HuongXuLy ?? 'Chăm sóc');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải phiếu bảo hành',
      );
    } finally {
      setLoading(false);
    }
  }, [maYC]);

  useEffect(() => {
    void loadWarranty();
  }, [loadWarranty]);

  const hasRights =
    ticket?.ConQuyenLoi === true ||
    ticket?.ConQuyenLoi === 1;

  const isFinished =
    ticket?.TrangThaiBaoHanh === 'Hoàn tất';

  const isRejected =
    ticket?.TrangThaiBaoHanh === 'Từ chối';

  
const canInspect =
  Boolean(ticket?.MaBH) &&
  !isFinished &&
  !isRejected &&
  canManage;

const canProcess =
  canInspect &&
  hasRights &&
  Boolean(ticket?.MocBatDau);


async function saveInspection() {
  setError('');
  setMessage('');

  if (!canInspect) {
    setError('Bạn không có quyền kiểm tra phiếu này');
    return;
  }

  if (!nguyenNhan.trim()) {
    setError('Vui lòng nhập nguyên nhân hư hỏng');
    return;
  }

  if (nguyenNhan.trim().length > 500) {
    setError('Nguyên nhân không được vượt quá 500 ký tự');
    return;
  }

  if (!ketQua.trim()) {
    setError('Vui lòng nhập kết quả kiểm tra');
    return;
  }

  setSaving(true);

  try {
    const result = await api<{
      success: boolean;
      message: string;
    }>(`/support/tickets/${maYC}/warranty/inspect`, {
      method: 'PATCH',
      body: JSON.stringify({
        nguyenNhan: nguyenNhan.trim(),
        ketQuaKiemTra: ketQua.trim(),
        huongXuLy,
      }),
    });

    await loadWarranty();
    setMessage(result.message);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Không thể lưu kết quả kiểm tra',
    );
  } finally {
    setSaving(false);
  }
}

async function verifyWarranty() {
  if (
    !ticket?.MaBH ||
    ticket.TrangThaiBaoHanh !== 'Chờ xác minh' ||
    !hasRights ||
    !canManage ||
    saving
  ) {
    return;
  }

  if (!ketQua.trim()) {
    setError('Vui lòng nhập và lưu kết quả kiểm tra trước.');
    return;
  }

  if (
    !window.confirm(
      'Xác nhận phiếu bảo hành đủ điều kiện để xử lý?',
    )
  ) {
    return;
  }

  setSaving(true);
  setError('');
  setMessage('');

  try {
    const result = await api<{
      success: boolean;
      message: string;
    }>(`/support/tickets/${maYC}/warranty`, {
      method: 'PATCH',
      body: JSON.stringify({
        ketLuan: 'Đủ điều kiện',
        ketQua: ketQua.trim(),
      }),
    });

    await loadWarranty();
    setMessage(result.message);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Không thể xác minh phiếu bảo hành',
    );
  } finally {
    setSaving(false);
  }
}

  async function saveWarranty(
    trangThai: 'Đang xử lý' | 'Hoàn tất',
  ) {
    setError('');
    setMessage('');

    if (!ticket?.MaBH) {
      setError('Yêu cầu chưa có phiếu bảo hành');
      return;
    }

    if (!nguyenNhan.trim()) {
      setError('Vui lòng nhập nguyên nhân');
      return;
    }

    if (nguyenNhan.trim().length > 500) {
      setError('Nguyên nhân không được vượt quá 500 ký tự');
      return;
    }

    if (!ketQua.trim()) {
      setError('Vui lòng nhập kết quả kiểm tra');
      return;
    }

    if (trangThai === 'Hoàn tất') {
      const confirmed = window.confirm(
        'Xác nhận đã thực hiện xong bảo hành? Yêu cầu sẽ được đóng.',
      );

      if (!confirmed) return;
    }

    setSaving(true);

    try {
      const result = await api<{
        success: boolean;
        message: string;
      }>(`/support/tickets/${maYC}/warranty/process`, {
        method: 'PATCH',
        body: JSON.stringify({
          nguyenNhan: nguyenNhan.trim(),
          ketQuaKiemTra: ketQua.trim(),
          huongXuLy,
          trangThai,
        }),
      });

      setMessage(result.message);

      await loadWarranty();

      if (trangThai === 'Hoàn tất') {
        window.location.reload();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể cập nhật phiếu bảo hành',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-[#dce7d8] bg-white p-6">
        Đang tải thông tin bảo hành...
      </section>
    );
  }

  if (!ticket || ticket.NhomYeuCau !== 'Bảo hành') {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[#dce7d8] bg-white p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#315b3d]">
          Xử lý bảo hành
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Kiểm tra quyền lợi và cập nhật kết quả bảo hành cây cảnh.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-[#f2f6ef] p-4">
          <p className="text-sm text-gray-500">
            Mã phiếu bảo hành
          </p>

          <p className="mt-2 font-semibold">
            {ticket.MaBH ? `#${ticket.MaBH}` : 'Chưa có phiếu'}
          </p>
        </div>

        <div className="rounded-xl bg-[#f2f6ef] p-4">
          <p className="text-sm text-gray-500">
            Quyền lợi bảo hành
          </p>

          <p
            className={`mt-2 font-semibold ${
              hasRights ? 'text-green-700' : 'text-red-600'
            }`}
          >
            {hasRights
              ? 'Đủ điều kiện theo chính sách'
              : 'Chưa đủ điều kiện'}
          </p>
        </div>

        <div className="rounded-xl bg-[#f2f6ef] p-4">
          <p className="text-sm text-gray-500">
            Ngày bắt đầu bảo hành
          </p>

          <p className="mt-2 font-medium">
            {formatDate(ticket.NgayBatDauBaoHanh)}
          </p>
        </div>

        <div className="rounded-xl bg-[#f2f6ef] p-4">
          <p className="text-sm text-gray-500">
            Ngày hết hạn bảo hành
          </p>

          <p className="mt-2 font-medium">
            {formatDate(ticket.NgayHetHanBaoHanh)}
          </p>
        </div>

        <div className="rounded-xl bg-[#f2f6ef] p-4">
          <p className="text-sm text-gray-500">
            Trạng thái phiếu
          </p>

          <p className="mt-2 font-semibold text-[#315b3d]">
            {ticket.TrangThaiBaoHanh ?? 'Chưa lập phiếu'}
          </p>
        </div>

        <div className="rounded-xl bg-[#f2f6ef] p-4">
          <p className="text-sm text-gray-500">
            Ngày xác minh
          </p>

          <p className="mt-2 font-medium">
            {formatDate(ticket.NgayXacMinh)}
          </p>
        </div>
      </div>

      {!hasRights && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Yêu cầu chưa đủ điều kiện bảo hành.
          Kiểm tra trạng thái giao cây và chính sách dịch vụ trước
          khi tiếp tục xử lý.
        </div>
      )}

      {!ticket.MaBH && (
        <div className="mt-4 rounded-xl bg-amber-50 p-4 text-amber-800">
          Chưa có phiếu bảo hành. Cần lập phiếu hợp lệ trước khi
          xử lý.
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          {message}
        </div>
      )}

      <div className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block font-semibold text-[#315b3d]">
            Nguyên nhân hư hỏng
          </label>

          <textarea
            className={inputClass}
            rows={3}
            maxLength={500}
            value={nguyenNhan}
            disabled={!canInspect || saving}
            onChange={(event) =>
              setNguyenNhan(event.target.value)
            }
            placeholder="Nhập nguyên nhân cây bị hư hỏng..."
          />
        </div>

        <div>
          <label className="mb-2 block font-semibold text-[#315b3d]">
            Kết quả kiểm tra
          </label>

          <textarea
            className={inputClass}
            rows={4}
            value={ketQua}
            disabled={!canInspect || saving}
            onChange={(event) =>
              setKetQua(event.target.value)
            }
            placeholder="Nhập kết quả kiểm tra cây..."
          />
        </div>

        <div>
          <label className="mb-2 block font-semibold text-[#315b3d]">
            Hướng xử lý
          </label>

          <select
            className={inputClass}
            value={huongXuLy}
            disabled={!canInspect || saving}
            onChange={(event) =>
              setHuongXuLy(event.target.value)
            }
          >
            {solutions.map((solution) => (
              <option key={solution} value={solution}>
                {solution}
              </option>
            ))}
          </select>
        </div>


{canInspect && (
  <button
    type="button"
    disabled={saving}
    onClick={() => void saveInspection()}
    className="rounded-xl bg-[#315b3d] px-6 py-3 font-semibold text-white hover:bg-[#25452e] disabled:opacity-50"
  >
    {saving ? 'Đang lưu...' : 'Lưu kết quả kiểm tra'}
  </button>
)}

{canManage &&
  hasRights &&
  ticket?.MaBH &&
  ticket.TrangThaiBaoHanh === 'Chờ xác minh' && (
    <button
      type="button"
      disabled={saving || !ketQua.trim()}
      onClick={() => void verifyWarranty()}
      className="rounded-xl border border-[#315b3d] bg-white px-6 py-3 font-semibold text-[#315b3d] hover:bg-[#edf4e8] disabled:opacity-50"
    >
      {saving
        ? 'Đang xác minh...'
        : 'Xác minh đủ điều kiện bảo hành'}
    </button>
  )}

        {canProcess && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveWarranty('Đang xử lý')}
              className="rounded-xl bg-[#315b3d] px-6 py-3 font-semibold text-white hover:bg-[#25452e] disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu tiến độ bảo hành'}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => void saveWarranty('Hoàn tất')}
              className="rounded-xl border border-[#315b3d] bg-white px-6 py-3 font-semibold text-[#315b3d] hover:bg-[#edf4e8] disabled:opacity-50"
            >
              Hoàn tất bảo hành
            </button>
          </div>
        )}

        {isFinished && (
          <p className="font-semibold text-green-700">
            Phiếu bảo hành đã hoàn tất.
          </p>
        )}

        {isRejected && (
          <p className="font-semibold text-red-600">
            Phiếu bảo hành đã bị từ chối.
          </p>
        )}
      </div>
    </section>
  );
}

