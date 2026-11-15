
import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RoleGuard from '../../components/RoleGuard';
import RoleNavigation from '../../components/RoleNavigation';
import { api } from '../../api/client';

type Payment = {
  MaTT: number;
  MaDH: number | null;
  MaDT: number | null;
  LoaiThanhToan: string;
  SoTien: number;
  PhuongThuc: string;
  MaGiaoDich: string | null;
  TrangThai: string;
  ThoiGian: string;
  GhiChu: string | null;
  TenKhachHang: string;
  Email: string;
  TrangThaiDon: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('vi-VN');
}

function StatusBadge({ value }: { value: string }) {
  const style =
    value === 'Đã thanh toán'
      ? 'bg-green-100 text-green-800'
      : value === 'Chờ thanh toán'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800';

  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${style}`}>
      {value}
    </span>
  );
}

function PaymentManager() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [filter, setFilter] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [transactionCode, setTransactionCode] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadPayments() {
    setLoading(true);

    try {
      const response = await api<{
        success: boolean;
        data: Payment[];
      }>('/payments');

      setPayments(response.data);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải danh sách thanh toán',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi-VN');

    return payments.filter((payment) => {
      const matchesStatus =
        filter === 'Tất cả' || payment.TrangThai === filter;

      const matchesSearch =
        !keyword ||
        String(payment.MaTT).includes(keyword) ||
        String(payment.MaDH ?? '').includes(keyword) ||
        String(payment.MaDT ?? '').includes(keyword) ||
        (payment.TenKhachHang ?? '')
          .toLocaleLowerCase('vi-VN')
          .includes(keyword) ||
        (payment.MaGiaoDich ?? '')
          .toLocaleLowerCase('vi-VN')
          .includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [payments, filter, search]);

  const waiting = payments.filter(
    (payment) => payment.TrangThai === 'Chờ thanh toán',
  );

  const completed = payments.filter(
    (payment) => payment.TrangThai === 'Đã thanh toán',
  );

  const waitingAmount = waiting.reduce(
    (sum, payment) => sum + Number(payment.SoTien),
    0,
  );

  function openConfirm(payment: Payment) {
    setSelected(payment);
    setTransactionCode('');
    setNote('');
    setError('');
    setNotice('');
  }

  async function confirmPayment() {
    if (!selected || busy) return;

    const needsCode = [
      'Chuyển khoản',
      'VNPay',
      'MoMo',
    ].includes(selected.PhuongThuc);

    if (needsCode && !transactionCode.trim()) {
      setError('Vui lòng nhập mã giao dịch đã đối soát.');
      return;
    }

    const confirmed = window.confirm(
      `Bạn xác nhận đã nhận ${formatMoney(selected.SoTien)} cho giao dịch #${selected.MaTT}?\n\nChỉ tiếp tục nếu tiền đã thực sự được nhận và đối soát.`,
    );

    if (!confirmed) return;

    setBusy(true);
    setError('');

    try {
      await api(`/payments/${selected.MaTT}/confirm`, {
        method: 'PATCH',
        body: JSON.stringify({
          maGiaoDich: transactionCode.trim() || undefined,
          ghiChu: note.trim() || undefined,
        }),
      });

      setNotice(
        `Đã xác nhận thanh toán #${selected.MaTT} thành công.`,
      );
      setSelected(null);
      await loadPayments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Xác nhận thanh toán thất bại',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8faf5] px-5 py-10 text-[#294530]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#829a7c]">
              NHAI&apos;S GREEN
            </p>
            <h1 className="mt-3 text-3xl font-bold">
              Quản lý thanh toán
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Theo dõi và đối soát giao dịch mua cây, thuê cây, đặt cọc.
            </p>
          </div>

          <button
            type="button"
            onClick={loadPayments}
            disabled={loading}
            className="rounded-xl bg-[#315b3d] px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            Làm mới
          </button>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Tổng giao dịch',
              value: String(payments.length),
            },
            {
              title: 'Chờ thanh toán',
              value: String(waiting.length),
            },
            {
              title: 'Tổng tiền đang chờ',
              value: formatMoney(waitingAmount),
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#dce7d8] bg-white p-6"
            >
              <p className="text-sm text-gray-500">{item.title}</p>
              <p className="mt-3 text-2xl font-bold text-[#315b3d]">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {notice && (
          <p className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            {notice}
          </p>
        )}

        {error && (
          <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        <section className="rounded-2xl border border-[#dce7d8] bg-white p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm giao dịch, đơn hàng, khách hàng..."
              className="min-w-0 flex-1 rounded-xl border border-[#dce5d7] px-5 py-3 outline-none focus:border-[#648665]"
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-[#dce5d7] bg-white px-5 py-3"
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Chờ thanh toán">Chờ thanh toán</option>
              <option value="Đã thanh toán">Đã thanh toán</option>
              <option value="Thất bại">Thất bại</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-[#edf3e9] text-[#315b3d]">
                <tr>
                  <th className="p-4">Giao dịch</th>
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Loại</th>
                  <th className="p-4">Số tiền</th>
                  <th className="p-4">Phương thức</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Thời gian</th>
                  <th className="p-4">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((payment) => (
                  <tr
                    key={payment.MaTT}
                    className="border-b border-[#eaf0e6] hover:bg-[#fafcf8]"
                  >
                    <td className="p-4">
                      <p className="font-bold">#{payment.MaTT}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {payment.MaDH !== null
                          ? `Đơn mua #${payment.MaDH}`
                          : `Đơn thuê #${payment.MaDT}`}
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="font-medium">
                        {payment.TenKhachHang || 'Chưa có'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {payment.Email}
                      </p>
                    </td>

                    <td className="p-4">{payment.LoaiThanhToan}</td>

                    <td className="p-4 font-semibold text-[#315b3d]">
                      {formatMoney(payment.SoTien)}
                    </td>

                    <td className="p-4">
                      {payment.PhuongThuc}
                      {payment.MaGiaoDich && (
                        <p className="mt-1 text-xs text-gray-500">
                          Mã: {payment.MaGiaoDich}
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      <StatusBadge value={payment.TrangThai} />
                    </td>

                    <td className="p-4 text-xs text-gray-600">
                      {formatDate(payment.ThoiGian)}
                    </td>

                    <td className="p-4">
                      {payment.TrangThai === 'Chờ thanh toán' &&
                      !['Hoàn tiền', 'Hoàn cọc'].includes(
                        payment.LoaiThanhToan,
                      ) ? (
                        <button
                          type="button"
                          onClick={() => openConfirm(payment)}
                          className="rounded-lg bg-[#315b3d] px-4 py-2 font-medium text-white"
                        >
                          Xác nhận đã thu
                        </button>
                      ) : (
                        <span className="text-gray-500">
                          {payment.TrangThai === 'Đã thanh toán'
                            ? 'Đã xác nhận'
                            : 'Không có thao tác'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && (
            <p className="p-10 text-center text-gray-500">
              Đang tải giao dịch...
            </p>
          )}

          {!loading && filtered.length === 0 && (
            <p className="p-10 text-center text-gray-500">
              Không tìm thấy giao dịch phù hợp.
            </p>
          )}
        </section>

        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-5">
            <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-xl">
              <h2 className="text-2xl font-bold text-[#315b3d]">
                Xác nhận thanh toán #{selected.MaTT}
              </h2>

              <div className="mt-5 space-y-2 text-sm">
                <p>
                  <strong>Khách hàng:</strong>{' '}
                  {selected.TenKhachHang}
                </p>
                <p>
                  <strong>Loại:</strong> {selected.LoaiThanhToan}
                </p>
                <p>
                  <strong>Phương thức:</strong> {selected.PhuongThuc}
                </p>
                <p>
                  <strong>Số tiền:</strong>{' '}
                  <span className="font-bold text-[#315b3d]">
                    {formatMoney(selected.SoTien)}
                  </span>
                </p>
              </div>

             

              <label className="mt-6 block">
                <span className="mb-2 block text-sm font-semibold">
                  Mã giao dịch đối soát
                  {['Chuyển khoản', 'VNPay', 'MoMo'].includes(
                    selected.PhuongThuc,
                  )
                    ? ' *'
                    : ''}
                </span>

                <input
                  value={transactionCode}
                  onChange={(event) =>
                    setTransactionCode(event.target.value)
                  }
                  maxLength={150}
                  placeholder="Nhập mã từ giao dịch thực tế"
                  className="w-full rounded-lg border border-[#cbdac7] px-4 py-3"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-semibold">
                  Ghi chú đối soát
                </span>

                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-lg border border-[#cbdac7] px-4 py-3"
                />
              </label>

              <div className="mt-7 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  disabled={busy}
                  className="rounded-lg border px-5 py-3"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={confirmPayment}
                  disabled={busy}
                  className="rounded-lg bg-[#315b3d] px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {busy ? 'Đang xác nhận...' : 'Xác nhận đã nhận tiền'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


export default function AdminPaymentsPage() {
  return (
    <RoleGuard allowedRoles={['Quản trị viên']}>
      <Head>
        <title>Quản lý thanh toán | NHAI&apos;s Green</title>
      </Head>

      <Header />

      <div className="flex min-h-screen bg-[#f8faf5]">
        <RoleNavigation role="admin" />

        <div className="min-w-0 flex-1">
          <PaymentManager />
        </div>
      </div>

      <Footer />
    </RoleGuard>
  );
}

