
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RoleGuard from '../../components/RoleGuard';
import RoleNavigation from '../../components/RoleNavigation';

type Rental = {
  MaDT: number;
  MaKH: number;
  MaNV: number | null;
  MaHopDong: string | null;
  TenKhachHang: string;
  TenNguoiNhan: string;
  SDT: string;
  DiaChiChiTiet: string;
  PhuongXa: string | null;
  QuanHuyen: string | null;
  TinhThanh: string | null;
  NgayTao: string;
  NgayBatDau: string;
  NgayKetThuc: string;
  NgayGiaoThucTe: string | null;
  NgayTraThucTe: string | null;
  GoiThue: string;
  TrangThai: string;
  TrangThaiCoc: string;
  TrangThaiQuyetToan: string | null;
  TienCocDuKien: number;
  TienCocDaThu: number;
  PhiGoiGoc: number;
  GiamGiaGoi: number;
  PhiVanChuyen: number;
  PhiKhac: number;
  GhiChu: string | null;
};

type RentalItem = {
  MaCTDT: number;
  MaSP: number;
  TenSP: string;
  HinhAnh: string | null;
  SoLuong: number;
  GiaThueTheoNgay: number;
  GiaTriCayKhiGiao: number;
  TienCoc: number;
  TinhTrangKhiGiao: string | null;
  TinhTrangKhiTra: string | null;
};

type Payment = {
  MaTT: number;
  LoaiThanhToan: string;
  SoTien: number;
  PhuongThuc: string;
  MaGiaoDich: string | null;
  TrangThai: string;
  ThoiGian: string | null;
};

type RentalDetailResponse = {
  success: boolean;
  data: {
    order: Rental;
    items: RentalItem[];
    payments: Payment[];
  };
};

const steps = [
  'Chờ xác nhận',
  'Đã xác nhận',
  'Đang thuê',
  'Chờ trả cây',
  'Đã trả',
];

const nextStatuses: Record<string, string> = {
  'Chờ xác nhận': 'Đã xác nhận',
  'Đã xác nhận': 'Đang thuê',
  'Đang thuê': 'Chờ trả cây',
  'Chờ trả cây': 'Đã trả',
};

const cardStyle =
  'rounded-2xl border border-[#dce7d8] bg-white p-6';

function formatMoney(value: number | null | undefined) {
  return Number(value || 0).toLocaleString('vi-VN') + ' đ';
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Chưa có';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Không xác định';
  }

  return date.toLocaleString('vi-VN');
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf1ea] py-3 last:border-0">
      <span className="text-sm text-gray-500">
        {label}
      </span>

      <span className="text-right text-sm font-semibold text-[#315b3d]">
        {value}
      </span>
    </div>
  );
}

export default function StaffRentalDetailPage() {
  const router = useRouter();

  const id =
    typeof router.query.id === 'string'
      ? Number(router.query.id)
      : NaN;

  const [detail, setDetail] = useState<
    RentalDetailResponse['data'] | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadDetail = useCallback(async () => {
    if (!Number.isSafeInteger(id) || id <= 0) {
      setLoading(false);
      setError('Mã đơn thuê không hợp lệ.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api<RentalDetailResponse>(
        `/rentals/${id}`,
      );

      setDetail(response.data);
    } catch (err) {
      setDetail(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải thông tin đơn thuê.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (router.isReady) {
      void loadDetail();
    }
  }, [router.isReady, loadDetail]);

  const order = detail?.order;
  const nextStatus = order
    ? nextStatuses[order.TrangThai]
    : undefined;

  const requiredPayments =
    detail?.payments.filter((payment) =>
      ['Đặt cọc', 'Tiền thuê', 'Dịch vụ'].includes(
        payment.LoaiThanhToan,
      ),
    ) || [];

  const allPaymentsConfirmed =
    requiredPayments.length > 0 &&
    requiredPayments.every(
      (payment) => payment.TrangThai === 'Đã thanh toán',
    );

  const depositConfirmed = Boolean(
    order &&
      order.TrangThaiCoc === 'Đã thu' &&
      Number(order.TienCocDaThu) >=
        Number(order.TienCocDuKien),
  );

  const canHandOver =
    allPaymentsConfirmed && depositConfirmed;

  const canAdvance = Boolean(
    nextStatus &&
      (nextStatus !== 'Đang thuê' || canHandOver),
  );

  const currentStep = order
    ? steps.indexOf(order.TrangThai)
    : -1;

  const totalPaid =
    detail?.payments
      .filter(
        (payment) =>
          payment.TrangThai === 'Đã thanh toán' &&
          !['Hoàn tiền', 'Hoàn cọc'].includes(
            payment.LoaiThanhToan,
          ),
      )
      .reduce(
        (sum, payment) => sum + Number(payment.SoTien),
        0,
      ) || 0;

  async function updateStatus() {
    if (!order || !nextStatus || saving || !canAdvance) {
      return;
    }

    const confirmed = window.confirm(
      `Xác nhận chuyển đơn thuê #${order.MaDT} sang trạng thái "${nextStatus}"?`,
    );

    if (!confirmed) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await api(`/rentals/${order.MaDT}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          trangThai: nextStatus,
        }),
      });

      await loadDetail();

      setMessage(
        `Đã cập nhật đơn thuê #${order.MaDT} sang "${nextStatus}".`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể cập nhật trạng thái đơn thuê.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <RoleGuard allowedRoles={['Nhân viên']}>
      <Head>
        <title>
          Chi tiết đơn thuê | NHAI&apos;s Green
        </title>
      </Head>

      <Header />

      <div className="flex min-h-screen items-stretch bg-[#f8faf5]">
        <RoleNavigation role="staff" />

        <main className="min-w-0 flex-1 px-5 py-8 text-[#294530]">
          <div className="mx-auto max-w-6xl">
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link
                  href="/staff/rentals"
                  className="text-sm font-semibold text-[#648665] hover:underline"
                >
                  ← Quay lại danh sách đơn thuê
                </Link>

                <h1 className="mt-4 text-3xl font-bold text-[#315b3d]">
                  Chi tiết đơn thuê
                  {order ? ` #${order.MaDT}` : ''}
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  Thông tin hợp đồng, giao dịch và tiến độ xử lý.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadDetail()}
                disabled={loading || saving}
                className="rounded-xl border border-[#c9dbc4] bg-white px-5 py-3 font-semibold text-[#315b3d] disabled:opacity-50"
              >
                Làm mới
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
              >
                {error}
              </div>
            )}

            {message && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
                {message}
              </div>
            )}

            {loading ? (
              <div className={cardStyle}>
                Đang tải chi tiết đơn thuê...
              </div>
            ) : !order || !detail ? (
              <div className={cardStyle}>
                Không tìm thấy đơn thuê hoặc bạn chưa được phân công.
              </div>
            ) : (
              <div className="space-y-6">
                <section className={cardStyle}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Mã hợp đồng
                      </p>

                      <h2 className="mt-2 break-all text-xl font-bold text-[#315b3d]">
                        {order.MaHopDong || `Đơn thuê #${order.MaDT}`}
                      </h2>

                      <p className="mt-2 text-sm text-gray-500">
                        Ngày tạo: {formatDate(order.NgayTao)}
                      </p>
                    </div>

                    <span className="rounded-full bg-[#eaf3e6] px-4 py-2 text-sm font-semibold text-[#315b3d]">
                      {order.TrangThai}
                    </span>
                  </div>

                  <div className="mt-7 border-t border-[#e3ebe0] pt-6">
                    <h3 className="mb-5 text-lg font-bold">
                      Tiến độ đơn thuê
                    </h3>

                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
                      {steps.map((step, index) => {
                        const completed =
                          currentStep >= 0 &&
                          index <= currentStep;

                        return (
                          <div
                            key={step}
                            className={`rounded-xl border p-4 text-center ${
                              completed
                                ? 'border-[#b9d4b1] bg-[#eaf3e6] text-[#315b3d]'
                                : 'border-[#e1e6e0] bg-[#f7f8f9] text-gray-400'
                            }`}
                          >
                            <div
                              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                completed
                                  ? 'bg-[#315b3d] text-white'
                                  : 'bg-gray-200 text-gray-500'
                              }`}
                            >
                              {completed ? '✓' : index + 1}
                            </div>

                            <p className="mt-3 text-sm font-semibold">
                              {step}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {order.TrangThai === 'Đang tranh chấp' && (
                      <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                        Đơn thuê đang trong quá trình giải quyết tranh chấp.
                      </p>
                    )}
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className={cardStyle}>
                    <h2 className="mb-4 text-xl font-bold text-[#315b3d]">
                      Thông tin khách hàng
                    </h2>

                    <InfoRow
                      label="Khách hàng"
                      value={order.TenKhachHang}
                    />

                    <InfoRow
                      label="Người nhận cây"
                      value={order.TenNguoiNhan}
                    />

                    <InfoRow
                      label="Số điện thoại"
                      value={order.SDT || 'Chưa có'}
                    />

                    <div className="mt-5">
                      <p className="text-sm text-gray-500">
                        Địa chỉ giao cây
                      </p>

                      <p className="mt-2 font-semibold leading-7">
                        {[
                          order.DiaChiChiTiet,
                          order.PhuongXa,
                          order.QuanHuyen,
                          order.TinhThanh,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </section>

                  <section className={cardStyle}>
                    <h2 className="mb-4 text-xl font-bold text-[#315b3d]">
                      Thông tin thuê cây
                    </h2>

                    <InfoRow
                      label="Gói thuê"
                      value={order.GoiThue}
                    />

                    <InfoRow
                      label="Ngày bắt đầu"
                      value={formatDate(order.NgayBatDau)}
                    />

                    <InfoRow
                      label="Ngày kết thúc"
                      value={formatDate(order.NgayKetThuc)}
                    />

                    <InfoRow
                      label="Ngày bàn giao"
                      value={formatDate(order.NgayGiaoThucTe)}
                    />

                    <InfoRow
                      label="Ngày nhận lại"
                      value={formatDate(order.NgayTraThucTe)}
                    />

                    <InfoRow
                      label="Trạng thái quyết toán"
                      value={
                        order.TrangThaiQuyetToan ||
                        'Chưa quyết toán'
                      }
                    />
                  </section>
                </div>

                <section className={cardStyle}>
                  <h2 className="mb-5 text-xl font-bold text-[#315b3d]">
                    Danh sách cây thuê
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-sm">
                      <thead className="bg-[#edf3e9]">
                        <tr>
                          <th className="p-4">Sản phẩm</th>
                          <th className="p-4">Số lượng</th>
                          <th className="p-4">Giá thuê/ngày</th>
                          <th className="p-4">Tiền cọc</th>
                          <th className="p-4">Tình trạng cây</th>
                        </tr>
                      </thead>

                      <tbody>
                        {detail.items.map((item) => (
                          <tr
                            key={item.MaCTDT}
                            className="border-t border-[#e5ece1]"
                          >
                            <td className="p-4 font-semibold">
                              {item.TenSP}
                            </td>

                            <td className="p-4">
                              {item.SoLuong}
                            </td>

                            <td className="p-4">
                              {formatMoney(item.GiaThueTheoNgay)}
                            </td>

                            <td className="p-4">
                              {formatMoney(item.TienCoc)}
                            </td>

                            <td className="p-4">
                              <p>
                                Giao:{' '}
                                {item.TinhTrangKhiGiao ||
                                  'Chưa ghi nhận'}
                              </p>

                              <p className="mt-2">
                                Trả:{' '}
                                {item.TinhTrangKhiTra ||
                                  'Chưa ghi nhận'}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className={cardStyle}>
                    <h2 className="mb-4 text-xl font-bold text-[#315b3d]">
                      Chi phí đơn thuê
                    </h2>

                    <InfoRow
                      label="Phí gói dịch vụ"
                      value={formatMoney(order.PhiGoiGoc)}
                    />

                    <InfoRow
                      label="Giảm phí gói"
                      value={`-${formatMoney(order.GiamGiaGoi)}`}
                    />

                    <InfoRow
                      label="Tiền cọc dự kiến"
                      value={formatMoney(order.TienCocDuKien)}
                    />

                    <InfoRow
                      label="Phí vận chuyển"
                      value={formatMoney(order.PhiVanChuyen)}
                    />

                    <InfoRow
                      label="Phí khác"
                      value={formatMoney(order.PhiKhac)}
                    />
                  </section>

                  <section className={cardStyle}>
                    <h2 className="mb-4 text-xl font-bold text-[#315b3d]">
                      Thanh toán và tiền cọc
                    </h2>

                    <InfoRow
                      label="Trạng thái cọc"
                      value={order.TrangThaiCoc}
                    />

                    <InfoRow
                      label="Cọc dự kiến"
                      value={formatMoney(order.TienCocDuKien)}
                    />

                    <InfoRow
                      label="Cọc đã thu"
                      value={formatMoney(order.TienCocDaThu)}
                    />

                    <InfoRow
                      label="Tổng khoản thu đã xác nhận"
                      value={formatMoney(totalPaid)}
                    />

                    <InfoRow
                      label="Thanh toán cần thiết"
                      value={
                        allPaymentsConfirmed
                          ? 'Đã xác nhận'
                          : 'Chưa hoàn tất'
                      }
                    />

                    <InfoRow
                      label="Điều kiện bàn giao"
                      value={
                        canHandOver
                          ? 'Đã đáp ứng'
                          : 'Chưa đáp ứng'
                      }
                    />
                  </section>
                </div>

                <section className={cardStyle}>
                  <h2 className="mb-5 text-xl font-bold text-[#315b3d]">
                    Lịch sử thanh toán
                  </h2>

                  {detail.payments.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Chưa có giao dịch thanh toán.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {detail.payments.map((payment) => (
                        <div
                          key={payment.MaTT}
                          className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[#dce7d8] p-4"
                        >
                          <div>
                            <p className="font-bold text-[#315b3d]">
                              Giao dịch #{payment.MaTT}
                            </p>

                            <p className="mt-2 text-sm">
                              {payment.LoaiThanhToan}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {payment.PhuongThuc}
                            </p>

                            {payment.MaGiaoDich && (
                              <p className="mt-1 text-xs text-gray-500">
                                Mã giao dịch: {payment.MaGiaoDich}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-[#315b3d]">
                              {formatMoney(payment.SoTien)}
                            </p>

                            <p className="mt-2 text-sm">
                              {payment.TrangThai}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {formatDate(payment.ThoiGian)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className={cardStyle}>
                  <h2 className="text-xl font-bold text-[#315b3d]">
                    Xử lý đơn thuê
                  </h2>

                  <p className="mt-3 text-sm text-gray-500">
                    Trạng thái hiện tại
                  </p>

                  <p className="mt-2 text-lg font-bold text-[#315b3d]">
                    {order.TrangThai}
                  </p>

                  {nextStatus === 'Đang thuê' &&
                    !canHandOver && (
                      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        Cần xác nhận đầy đủ tiền cọc và các khoản
                        thanh toán trước khi bàn giao cây.
                      </div>
                    )}

                  {nextStatus && (
                    <div className="mt-5">
                      <p className="mb-4 text-sm">
                        Trạng thái tiếp theo:{' '}
                        <strong>{nextStatus}</strong>
                      </p>

                      <button
                        type="button"
                        disabled={saving || !canAdvance}
                        onClick={() => void updateStatus()}
                        className="rounded-xl bg-[#315b3d] px-6 py-3 font-semibold text-white hover:bg-[#26472f] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving
                          ? 'Đang cập nhật...'
                          : `Chuyển sang ${nextStatus}`}
                      </button>
                    </div>
                  )}

                  {!nextStatus && (
                    <p className="mt-5 text-sm text-gray-500">
                      Đơn thuê không có bước chuyển trạng thái
                      tiếp theo trong quy trình thông thường.
                    </p>
                  )}

                  {order.TrangThai === 'Đã trả' &&
                    order.TrangThaiQuyetToan !==
                      'Đã quyết toán' && (
                      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        Đã ghi nhận trả cây. Hồ sơ còn cần
                        hoàn tất quyết toán và xử lý tiền cọc.
                      </div>
                    )}
                </section>
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </RoleGuard>
  );
}
