
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RoleGuard from '../../components/RoleGuard';
import RoleNavigation from '../../components/RoleNavigation';

type Appointment = {
  MaLich: number;
  MaYC: number;
  MaNV: number | null;
  NhomYeuCau: string;
  LoaiCongViec: string;
  NgayHen: string;
  NgayHoanTat: string | null;
  DiaDiem: string | null;
  PhiDuKien: number;
  PhiThucTe: number;
  KhachDongYPhi: boolean;
  TrangThai: string;
  KetQua: string | null;
  TieuDe: string;
  TrangThaiYeuCau: string;
  TenKhachHang: string;
  TenNhanVien: string | null;
};

type AppointmentResponse = {
  success: boolean;
  data: Appointment[];
};

const nextStatuses: Record<string, string> = {
  'Chờ xác nhận': 'Đã xác nhận',
  'Đã xác nhận': 'Đang thực hiện',
  'Đang thực hiện': 'Hoàn tất',
};

const cardStyle =
  'rounded-2xl border border-[#dce7d8] bg-white p-6';

function formatDate(value: string | null) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Chưa cập nhật';
  }

  return date.toLocaleString('vi-VN');
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString('vi-VN') + ' đ';
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf0e9] py-4 last:border-0">
      <span className="text-sm text-gray-500">
        {label}
      </span>
      <span className="max-w-[65%] text-right text-sm font-semibold text-[#315b3d]">
        {value}
      </span>
    </div>
  );
}

export default function StaffAppointmentDetailPage() {
  const router = useRouter();

  const maLich =
    typeof router.query.id === 'string'
      ? Number(router.query.id)
      : NaN;

  const [appointment, setAppointment] =
    useState<Appointment | null>(null);
  const [ketQua, setKetQua] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadAppointment = useCallback(async () => {
    if (!Number.isSafeInteger(maLich) || maLich <= 0) {
      setLoading(false);
      setError('Mã lịch hẹn không hợp lệ.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api<AppointmentResponse>(
        '/support/appointments',
      );

      const found = (result.data || []).find(
        (item) => Number(item.MaLich) === maLich,
      );

      if (!found) {
        setAppointment(null);
        setError('Không tìm thấy lịch hẹn.');
        return;
      }

      setAppointment(found);
      setKetQua(found.KetQua || '');
    } catch (err) {
      setAppointment(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải lịch hẹn.',
      );
    } finally {
      setLoading(false);
    }
  }, [maLich]);

  useEffect(() => {
    if (router.isReady) {
      void loadAppointment();
    }
  }, [router.isReady, loadAppointment]);

  const isWarranty = appointment?.NhomYeuCau === 'Bảo hành';

  const nextStatus = appointment
    ? nextStatuses[appointment.TrangThai]
    : undefined;

  const ticketFinished = appointment
    ? ['Đã đóng', 'Từ chối', 'Đã hủy'].includes(
        appointment.TrangThaiYeuCau,
      )
    : false;

  const canCancel =
    !ticketFinished &&
    (appointment?.TrangThai === 'Chờ xác nhận' ||
      appointment?.TrangThai === 'Đã xác nhận');

  const canComplete =
    !!appointment &&
    appointment.TrangThai === 'Đang thực hiện' &&
    !ticketFinished &&
    !!ketQua.trim() &&
    new Date(appointment.NgayHen).getTime() <= Date.now();

  async function updateStatus(trangThai: string) {
    if (!appointment || saving || ticketFinished) {
      return;
    }

    const allowed = [
      nextStatuses[appointment.TrangThai],
      ...(canCancel ? ['Đã hủy'] : []),
    ].includes(trangThai);

    if (!allowed) {
      setError('Không thể cập nhật trạng thái này.');
      return;
    }

    if (trangThai === 'Hoàn tất' && !canComplete) {
      setError(
        'Vui lòng nhập kết quả và kiểm tra thời gian hẹn.',
      );
      return;
    }

    const confirmed = window.confirm(
      `Xác nhận chuyển lịch #${appointment.MaLich} sang "${trangThai}"?`,
    );

    if (!confirmed) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await api(
        `/support/appointments/${appointment.MaLich}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            trangThai,
            ketQua:
              trangThai === 'Hoàn tất'
                ? ketQua.trim()
                : '',
          }),
        },
      );

      await loadAppointment();
      setNotice('Đã cập nhật lịch hẹn thành công.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể cập nhật lịch hẹn.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <RoleGuard allowedRoles={['Nhân viên']}>
      <Head>
        <title>Chi tiết lịch hẹn | NHAI&apos;s Green</title>
      </Head>

      <Header />

      <div className="flex min-h-screen items-stretch bg-[#f8faf5]">
        <RoleNavigation role="staff" />

        <main className="min-w-0 flex-1 px-5 py-8 text-[#294530]">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link
                  href="/staff/appointments"
                  className="text-sm font-semibold text-[#648665] hover:underline"
                >
                  ← Quay lại danh sách lịch hẹn
                </Link>

                <h1 className="mt-4 text-3xl font-bold text-[#315b3d]">
                  Chi tiết lịch hẹn
                  {appointment
                    ? ` #${appointment.MaLich}`
                    : ''}
                </h1>
              </div>

              <button
                type="button"
                onClick={() => void loadAppointment()}
                disabled={loading || saving}
                className="rounded-xl border border-[#cbdac7] bg-white px-5 py-3 font-semibold disabled:opacity-50"
              >
                Làm mới
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
              >
                {error}
              </p>
            )}

            {notice && (
              <p className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
                {notice}
              </p>
            )}

            {loading ? (
              <section className={cardStyle}>
                Đang tải lịch hẹn...
              </section>
            ) : !appointment ? (
              <section className={cardStyle}>
                Không có thông tin lịch hẹn.
              </section>
            ) : (
              <>
                <section className={cardStyle}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#698269]">
                        {isWarranty
                          ? 'Lịch bảo hành'
                          : 'Lịch hậu mãi'}
                      </p>

                      <h2 className="mt-2 text-2xl font-bold text-[#315b3d]">
                        {appointment.LoaiCongViec}
                      </h2>
                    </div>

                    <span className="rounded-full bg-[#edf3e9] px-4 py-2 text-sm font-semibold text-[#315b3d]">
                      {appointment.TrangThai}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-x-8 md:grid-cols-2">
                    <DetailRow
                      label="Khách hàng"
                      value={appointment.TenKhachHang}
                    />

                    <DetailRow
                      label="Ngày hẹn"
                      value={formatDate(appointment.NgayHen)}
                    />

                    <DetailRow
                      label="Nhân viên phụ trách"
                      value={
                        appointment.TenNhanVien ||
                        'Chưa cập nhật'
                      }
                    />

                    <DetailRow
                      label="Địa điểm"
                      value={
                        appointment.DiaDiem ||
                        'Chưa cập nhật'
                      }
                    />

                    <DetailRow
                      label="Ngày hoàn tất"
                      value={formatDate(
                        appointment.NgayHoanTat,
                      )}
                    />

                    <DetailRow
                      label="Yêu cầu liên quan"
                      value={
                        <Link
                          href={`/staff/supportdetail?id=${appointment.MaYC}`}
                          className="hover:underline"
                        >
                          #{appointment.MaYC} – {appointment.TieuDe}
                        </Link>
                      }
                    />
                  </div>
                </section>

                <section className={cardStyle}>
                  <h2 className="text-xl font-bold text-[#315b3d]">
                    Thông tin chi phí
                  </h2>

                  <div className="mt-4 grid gap-x-8 md:grid-cols-2">
                    <DetailRow
                      label="Phí dự kiến"
                      value={formatMoney(
                        appointment.PhiDuKien,
                      )}
                    />

                    <DetailRow
                      label="Phí thực tế"
                      value={formatMoney(
                        appointment.PhiThucTe,
                      )}
                    />

                    <DetailRow
                      label="Xác nhận chi phí"
                      value={
                        appointment.KhachDongYPhi
                          ? 'Đã đồng ý'
                          : 'Chưa xác nhận'
                      }
                    />
                  </div>
                </section>

                <section className={cardStyle}>
                  <h2 className="text-xl font-bold text-[#315b3d]">
                    {isWarranty
                      ? 'Kết quả kiểm tra và sửa chữa'
                      : 'Kết quả tư vấn và chăm sóc'}
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    {isWarranty
                      ? 'Ghi tình trạng cây và công việc đã thực hiện tại buổi hẹn.'
                      : 'Ghi nội dung tư vấn hoặc công việc chăm sóc đã thực hiện.'}
                  </p>

                  <textarea
                    value={ketQua}
                    onChange={(event) =>
                      setKetQua(event.target.value)
                    }
                    disabled={
                      appointment.TrangThai !==
                        'Đang thực hiện' ||
                      ticketFinished ||
                      saving
                    }
                    rows={6}
                    maxLength={3000}
                    placeholder={
                      isWarranty
                        ? 'Tình trạng cây, nguyên nhân, công việc sửa chữa hoặc thay thế...'
                        : 'Nội dung tư vấn, chăm sóc và tình trạng cây sau khi thực hiện...'
                    }
                    className="mt-5 w-full rounded-xl border border-[#d6e2d1] bg-white px-4 py-3 outline-none focus:border-[#315b3d] disabled:bg-gray-50"
                  />

                  {appointment.TrangThai === 'Hoàn tất' && (
                    <p className="mt-3 text-sm font-medium text-green-700">
                      Đã ghi nhận kết quả thực hiện.
                    </p>
                  )}
                </section>

                <section className={cardStyle}>
                  <h2 className="text-xl font-bold text-[#315b3d]">
                    Cập nhật tiến độ
                  </h2>

                  <p className="mt-3 text-sm">
                    Trạng thái hiện tại:{' '}
                    <strong>{appointment.TrangThai}</strong>
                  </p>

                  {ticketFinished ? (
                    <p className="mt-5 text-sm text-gray-500">
                      Yêu cầu liên quan đã kết thúc.
                    </p>
                  ) : (
                    <div className="mt-5 flex flex-wrap gap-3">
                      {nextStatus && (
                        <button
                          type="button"
                          onClick={() =>
                            void updateStatus(nextStatus)
                          }
                          disabled={
                            saving ||
                            (nextStatus === 'Hoàn tất' &&
                              !canComplete)
                          }
                          className="rounded-xl bg-[#315b3d] px-6 py-3 font-semibold text-white hover:bg-[#27482f] disabled:opacity-50"
                        >
                          {saving
                            ? 'Đang cập nhật...'
                            : nextStatus === 'Hoàn tất'
                              ? 'Hoàn tất lịch hẹn'
                              : `Chuyển sang ${nextStatus}`}
                        </button>
                      )}

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() =>
                            void updateStatus('Đã hủy')
                          }
                          disabled={saving}
                          className="rounded-xl border border-red-200 bg-white px-6 py-3 font-semibold text-red-700 disabled:opacity-50"
                        >
                          Hủy lịch hẹn
                        </button>
                      )}
                    </div>
                  )}
                </section>

                {isWarranty && (
                  <div className="text-right">
                    <Link
                      href={`/staff/supportdetail?id=${appointment.MaYC}`}
                      className="inline-flex rounded-xl border border-[#315b3d] bg-white px-5 py-3 font-semibold text-[#315b3d] hover:bg-[#edf4e9]"
                    >
                      Xem hồ sơ bảo hành
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </RoleGuard>
  );
}
