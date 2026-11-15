
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../../api/client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RoleGuard from '../../components/RoleGuard';
import RoleNavigation from '../../components/RoleNavigation';
import RentalAssignment from '../../components/RentalAssignment';

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

type RentalPayment = {
  MaTT: number;
  LoaiThanhToan: string;
  SoTien: number;
  PhuongThuc: string;
  TrangThai: string;
  MaGiaoDich: string | null;
  ThoiGian: string | null;
};

type RentalOrder = {
  MaDT: number;
  MaKH: number;
  MaHopDong: string;
  TenKhachHang: string;
  TenNguoiNhan: string;
  SDT: string;
  DiaChiChiTiet: string;
  PhuongXa: string | null;
  QuanHuyen: string | null;
  TinhThanh: string;
  GoiThue: string;
  XacNhanGoiCaoCap: boolean | number;
  PhiGoiGoc: number;
  GiamGiaGoi: number;
  PhiVanChuyen: number;
  PhiKhac: number;
  NgayTao: string;
  NgayBatDau: string;
  NgayKetThuc: string;
  NgayGiaoThucTe: string | null;
  NgayTraThucTe: string | null;
  TrangThai: string;
  TrangThaiCoc: string;
  TrangThaiQuyetToan: string;
  TienCocDuKien: number;
  TienCocDaThu: number;
  GhiChu: string | null;
};

type RentalDetail = {
  order: RentalOrder;
  items: RentalItem[];
  payments: RentalPayment[];
};

type RentalDetailResponse = {
  success: boolean;
  data: RentalDetail;
};

const transitions: Record<string, string> = {
  'Chờ xác nhận': 'Đã xác nhận',
  'Đã xác nhận': 'Đang thuê',
  'Đang thuê': 'Chờ trả cây',
  'Chờ trả cây': 'Đã trả',
};

const steps = [
  'Chờ xác nhận',
  'Đã xác nhận',
  'Đang thuê',
  'Chờ trả cây',
  'Đã trả',
];

const sectionClass =
  'rounded-2xl border border-[#dce7d8] bg-white p-6';

function money(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Chưa có';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Không xác định';
  }

  return date.toLocaleString('vi-VN');
}

function statusClass(status: string) {
  if (
    [
      'Đã xác nhận',
      'Đã trả',
      'Đã thu',
      'Đã thanh toán',
      'Đã hoàn',
    ].includes(status)
  ) {
    return 'bg-green-100 text-green-800';
  }

  if (
    [
      'Đã hủy',
      'Đang tranh chấp',
      'Thất bại',
    ].includes(status)
  ) {
    return 'bg-red-100 text-red-700';
  }

  if (
    ['Đang thuê', 'Chờ trả cây'].includes(status)
  ) {
    return 'bg-blue-100 text-blue-800';
  }

  return 'bg-amber-100 text-amber-800';
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(value)}`}
    >
      {value}
    </span>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1e9] py-3 text-sm last:border-b-0">
      <span className="text-gray-500">{label}</span>

      <span className="font-semibold text-[#294530]">
        {value}
      </span>
    </div>
  );
}

function Progress({ status }: { status: string }) {
  if (status === 'Đã hủy') {
    return (
      <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
        Đơn thuê đã được hủy.
      </p>
    );
  }

  if (status === 'Đang tranh chấp') {
    return (
      <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
        Đơn thuê đang được giải quyết tranh chấp.
      </p>
    );
  }

  const current = steps.indexOf(status);

  return (
    <div className="grid gap-3 sm:grid-cols-5">
      {steps.map((step, index) => {
        const completed = current >= index;

        return (
          <div
            key={step}
            className={`rounded-xl border p-3 text-center text-xs font-semibold ${
              completed
                ? 'border-[#b9d5b1] bg-[#eaf4e5] text-[#315b3d]'
                : 'border-[#e2e8df] bg-gray-50 text-gray-400'
            }`}
          >
            <div
              className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full ${
                completed
                  ? 'bg-[#315b3d] text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {completed ? '✓' : index + 1}
            </div>

            {step}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminRentalDetailPage() {
  const router = useRouter();

  const rawId = router.query.id;

  const id =
    typeof rawId === 'string'
      ? Number(rawId)
      : NaN;

  const [detail, setDetail] = useState<RentalDetail | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadDetail = useCallback(async () => {
    if (!Number.isSafeInteger(id) || id <= 0) {
      setDetail(null);
      setError('Mã đơn thuê không hợp lệ.');
      setLoading(false);
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

  async function updateStatus() {
    if (!detail || saving) return;

    const next = transitions[detail.order.TrangThai];

    if (!next) return;

    const confirmed = window.confirm(
      `Xác nhận chuyển đơn thuê #${id} sang trạng thái "${next}"?`,
    );

    if (!confirmed) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await api(`/rentals/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          trangThai: next,
        }),
      });

      await loadDetail();

      setNotice(`Đã cập nhật trạng thái: ${next}.`);
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

  const order = detail?.order;

  const rentalDays = order
    ? Math.max(
        0,
        Math.round(
          (
            new Date(order.NgayKetThuc).getTime() -
            new Date(order.NgayBatDau).getTime()
          ) / 86400000,
        ),
      )
    : 0;

  const rentalCost = detail
    ? detail.items.reduce(
        (total, item) =>
          total +
          Number(item.GiaThueTheoNgay) *
            Number(item.SoLuong) *
            rentalDays,
        0,
      )
    : 0;

  const packageFee = order
    ? Math.max(
        0,
        Number(order.PhiGoiGoc) -
          Number(order.GiamGiaGoi),
      )
    : 0;

  const deposit = Number(order?.TienCocDuKien ?? 0);
  const shipping = Number(order?.PhiVanChuyen ?? 0);
  const otherFee = Number(order?.PhiKhac ?? 0);

  const estimatedTotal =
    rentalCost +
    packageFee +
    deposit +
    shipping +
    otherFee;

  const chargePayments =
    detail?.payments.filter((payment) =>
      ['Đặt cọc', 'Tiền thuê', 'Dịch vụ'].includes(
        payment.LoaiThanhToan,
      ),
    ) ?? [];

  const paid = chargePayments
    .filter(
      (payment) => payment.TrangThai === 'Đã thanh toán',
    )
    .reduce(
      (total, payment) => total + Number(payment.SoTien),
      0,
    );

  const totalPaymentDue = chargePayments.reduce(
    (total, payment) => total + Number(payment.SoTien),
    0,
  );

  const remainingPayment = Math.max(
    0,
    totalPaymentDue - paid,
  );

  const nextStatus = order
    ? transitions[order.TrangThai]
    : undefined;

  const depositPaid =
    order?.TrangThaiCoc === 'Đã thu' &&
    Number(order.TienCocDaThu) >=
      Number(order.TienCocDuKien);

  const paymentsCompleted =
    chargePayments.length > 0 &&
    chargePayments.every(
      (payment) =>
        payment.TrangThai === 'Đã thanh toán',
    );

  const canDeliver =
    nextStatus !== 'Đang thuê' ||
    (depositPaid && paymentsCompleted);

  return (
    <RoleGuard allowedRoles={['Quản trị viên']}>
      <Head>
        <title>
          Chi tiết đơn thuê | NHAI&apos;s Green
        </title>
      </Head>

      <Header />

      <div className="flex min-h-screen bg-[#f8faf5]">
        <RoleNavigation role="admin" />

        <main className="min-w-0 flex-1 px-5 py-8 text-[#294530]">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Link
                  href="/admin/rentals"
                  className="text-sm font-semibold text-[#648665] hover:text-[#315b3d]"
                >
                  ← Quay lại đơn thuê
                </Link>

                <h1 className="mt-4 text-3xl font-bold text-[#315b3d]">
                  Chi tiết đơn thuê
                  {order ? ` #${order.MaDT}` : ''}
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  Thông tin đơn thuê và lịch sử giao dịch.
                </p>
              </div>

              <button
                type="button"
                disabled={loading || saving}
                onClick={() => void loadDetail()}
                className="rounded-xl border border-[#b9d0b4] bg-white px-5 py-3 font-semibold text-[#315b3d] disabled:opacity-50"
              >
                Làm mới
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
              >
                {error}
              </div>
            )}

            {notice && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                {notice}
              </div>
            )}

            {loading ? (
              <div className={sectionClass}>
                Đang tải thông tin đơn thuê...
              </div>
            ) : !detail || !order ? (
              <div className={sectionClass}>
                <p className="text-gray-500">
                  Không tìm thấy thông tin đơn thuê.
                </p>

                <Link
                  href="/admin/rentals"
                  className="mt-5 inline-block rounded-xl bg-[#315b3d] px-5 py-3 font-semibold text-white"
                >
                  Quay lại danh sách
                </Link>
              </div>
            ) : (
              <>
                <section className={sectionClass}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">
  Hợp đồng thuê cây
</p>

<p className="text-xl font-semibold text-[#315b3d]">
  Thông tin hợp đồng thuê
</p>

                      <p className="mt-2 text-sm text-gray-500">
                        Ngày đặt: {formatDate(order.NgayTao)}
                      </p>
                    </div>

                    <StatusBadge value={order.TrangThai} />
                  </div>

                  <div className="mt-7 border-t border-[#e7eee3] pt-6">
                    <h3 className="mb-5 text-lg font-bold">
                      Tiến độ đơn thuê
                    </h3>

                    <Progress status={order.TrangThai} />
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className={sectionClass}>
                    <h2 className="text-xl font-bold text-[#315b3d]">
                      Thông tin khách hàng
                    </h2>

                    <div className="mt-4">
                      <InfoRow
                        label="Khách hàng"
                        value={order.TenKhachHang}
                      />

                      <InfoRow
                        label="Mã khách hàng"
                        value={`#${order.MaKH}`}
                      />

                      <InfoRow
                        label="Người nhận"
                        value={order.TenNguoiNhan}
                      />

                      <InfoRow
                        label="Số điện thoại"
                        value={order.SDT}
                      />

                      <div className="pt-4">
                        <p className="text-sm text-gray-500">
                          Địa chỉ giao cây
                        </p>

                        <p className="mt-2 text-sm font-semibold leading-7">
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
                    </div>
                  </section>

                  <section className={sectionClass}>
                    <h2 className="text-xl font-bold text-[#315b3d]">
                      Thông tin thuê cây
                    </h2>

                    <div className="mt-4">
                      <InfoRow
                        label="Gói thuê"
                        value={order.GoiThue}
                      />

                      <InfoRow
                        label="Gói Cao cấp"
                        value={
                          Number(order.XacNhanGoiCaoCap)
                            ? 'Đã đăng ký'
                            : 'Không áp dụng'
                        }
                      />

                      <InfoRow
                        label="Thời gian thuê"
                        value={`${rentalDays} ngày`}
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
                        label="Ngày trả cây"
                        value={formatDate(order.NgayTraThucTe)}
                      />

                      <InfoRow
                        label="Trạng thái quyết toán"
                        value={order.TrangThaiQuyetToan}
                      />
                    </div>
                  </section>
                </div>

                <section className={sectionClass}>
                  <h2 className="text-xl font-bold text-[#315b3d]">
                    Danh sách cây thuê
                  </h2>

                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead className="bg-[#eef4e9] text-[#315b3d]">
                        <tr>
                          <th className="p-4">Sản phẩm</th>
                          <th className="p-4">Số lượng</th>
                          <th className="p-4">Giá/ngày</th>
                          <th className="p-4">Giá trị cây</th>
                          <th className="p-4">Tiền cọc</th>
                        </tr>
                      </thead>

                      <tbody>
                        {detail.items.map((item) => (
                          <tr
                            key={item.MaCTDT}
                            className="border-b border-[#edf1e9]"
                          >
                            <td className="p-4 font-semibold">
                              {item.TenSP}
                            </td>

                            <td className="p-4">
                              {item.SoLuong}
                            </td>

                            <td className="p-4">
                              {money(item.GiaThueTheoNgay)}
                            </td>

                            <td className="p-4">
                              {money(item.GiaTriCayKhiGiao)}
                            </td>

                            <td className="p-4">
                              {money(item.TienCoc)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className={sectionClass}>
                    <h2 className="text-xl font-bold text-[#315b3d]">
                      Chi phí đơn thuê
                    </h2>

                    <div className="mt-4">
                      <InfoRow
                        label="Tiền thuê"
                        value={money(rentalCost)}
                      />

                      <InfoRow
                        label="Phí gói dịch vụ"
                        value={money(order.PhiGoiGoc)}
                      />

                      <InfoRow
                        label="Giảm phí gói"
                        value={`-${money(order.GiamGiaGoi)}`}
                      />

                      <InfoRow
                        label="Tiền cọc"
                        value={money(deposit)}
                      />

                      <InfoRow
                        label="Phí vận chuyển"
                        value={money(shipping)}
                      />

                      <InfoRow
                        label="Phí khác"
                        value={money(otherFee)}
                      />

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#edf4e9] p-4">
                        <span className="font-bold">
                          Tổng cộng
                        </span>

                        <span className="text-xl font-bold text-[#315b3d]">
                          {money(estimatedTotal)}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className={sectionClass}>
                    <h2 className="text-xl font-bold text-[#315b3d]">
                      Thanh toán và tiền cọc
                    </h2>

                    <div className="mt-4">
                      <InfoRow
                        label="Trạng thái cọc"
                        value={
                          <StatusBadge value={order.TrangThaiCoc} />
                        }
                      />

                      <InfoRow
                        label="Cọc dự kiến"
                        value={money(order.TienCocDuKien)}
                      />

                      <InfoRow
                        label="Cọc đã thu"
                        value={money(order.TienCocDaThu)}
                      />

                      <InfoRow
                        label="Đã thanh toán"
                        value={money(paid)}
                      />

                      <InfoRow
                        label="Thanh toán còn lại"
                        value={money(remainingPayment)}
                      />

                      <Link
                        href="/admin/payments"
                        className="mt-5 inline-flex rounded-xl border border-[#315b3d] px-5 py-3 font-semibold text-[#315b3d] hover:bg-[#edf4e9]"
                      >
                        Xem quản lý thanh toán
                      </Link>
                    </div>
                  </section>
                </div>

                <section className={sectionClass}>
                  <h2 className="text-xl font-bold text-[#315b3d]">
                    Lịch sử thanh toán
                  </h2>

                  {detail.payments.length === 0 ? (
                    <p className="mt-5 text-gray-500">
                      Chưa có giao dịch thanh toán.
                    </p>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {detail.payments.map((payment) => (
                        <div
                          key={payment.MaTT}
                          className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[#e2eade] p-5"
                        >
                          <div>
                            <h3 className="font-bold">
                              Giao dịch #{payment.MaTT}
                            </h3>

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

                          <div className="space-y-2 text-right">
                            <p className="font-bold text-[#315b3d]">
                              {money(payment.SoTien)}
                            </p>

                            <StatusBadge value={payment.TrangThai} />

                            <p className="text-xs text-gray-500">
                              {formatDate(payment.ThoiGian)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {order.GhiChu && (
                  <section className={sectionClass}>
                    <h2 className="text-xl font-bold text-[#315b3d]">
                      Ghi chú đơn thuê
                    </h2>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7">
                      {order.GhiChu}
                    </p>
                  </section>
                )}
                <RentalAssignment />
                <section className={sectionClass}>
                  <h2 className="text-xl font-bold text-[#315b3d]">
                    Xử lý đơn thuê
                  </h2>

                  <div className="mt-4">
                    <InfoRow
                      label="Trạng thái hiện tại"
                      value={
                        <StatusBadge value={order.TrangThai} />
                      }
                    />
                  </div>

                  {nextStatus ? (
                    <div className="mt-5 space-y-4">
                      {nextStatus === 'Đang thuê' &&
                        !canDeliver && (
                          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            Đơn thuê chưa hoàn tất thanh toán.
                            Vui lòng kiểm tra các khoản còn lại.
                          </p>
                        )}

                      <button
                        type="button"
                        disabled={
                          saving ||
                          loading ||
                          !canDeliver
                        }
                        onClick={() => void updateStatus()}
                        className="rounded-xl bg-[#315b3d] px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving
                          ? 'Đang cập nhật...'
                          : `Xác nhận ${nextStatus.toLowerCase()}`}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-gray-500">
                      Đơn thuê không có thao tác cập nhật tiếp theo.
                    </p>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </RoleGuard>
  );
}
