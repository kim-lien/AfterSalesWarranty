
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { api } from '../../api/client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RoleGuard from '../../components/RoleGuard';
import RoleNavigation from '../../components/RoleNavigation';

type Appointment = {
  MaLich: number;
  MaYC: number;
  LoaiCongViec: string;
  NgayHen: string;
  NgayHoanTat: string | null;
  DiaDiem: string | null;
  TrangThai: string;
  KetQua: string | null;
  NhomYeuCau: string;
  TieuDe: string;
  TenKhachHang: string;
  TenNhanVien: string | null;
  PhiDuKien: number;
  PhiThucTe: number;
  KhachDongYPhi: boolean;
};

type AppointmentResponse = {
  success: boolean;
  data: Appointment[];
};

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleString('vi-VN')
    : 'Chưa cập nhật';
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString('vi-VN') + ' đ';
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-3 border-b border-[#edf0e9] py-4 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-[#315b3d]">
        {value}
      </span>
    </div>
  );
}

export default function AdminAppointmentDetailPage() {
  const router = useRouter();

  const id =
    typeof router.query.id === 'string'
      ? Number(router.query.id)
      : NaN;

  const [appointment, setAppointment] =
    useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError('Mã lịch hẹn không hợp lệ');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api<AppointmentResponse>(
        '/support/appointments',
      );

      const found = response.data.find(
        (item) => Number(item.MaLich) === id,
      );

      if (!found) {
        setAppointment(null);
        setError('Không tìm thấy lịch hẹn');
      } else {
        setAppointment(found);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải lịch hẹn',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (router.isReady) {
      void load();
    }
  }, [router.isReady, load]);

  return (
    <RoleGuard allowedRoles={['Quản trị viên']}>
      <Head>
        <title>Chi tiết lịch hẹn | NHAI&apos;s Green</title>
      </Head>

      <Header />

      <div className="flex min-h-screen items-stretch bg-[#f8faf5]">
        <RoleNavigation role="admin" />

        <main className="min-w-0 flex-1 px-5 py-8 text-[#294530]">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <Link
                  href="/admin/appointments"
                  className="text-sm font-semibold text-[#648665]"
                >
                  ← Quay lại lịch hẹn
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
                onClick={() => void load()}
                className="h-fit rounded-xl border border-[#d5e2d0] bg-white px-5 py-3 font-semibold"
              >
                Làm mới
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-4 text-red-700"
              >
                {error}
              </p>
            )}

            {loading ? (
              <div className="rounded-2xl bg-white p-6">
                Đang tải lịch hẹn...
              </div>
            ) : appointment ? (
              <>
                <section className="rounded-2xl border border-[#dce7d8] bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {appointment.NhomYeuCau}
                      </p>

                      <h2 className="mt-2 text-2xl font-bold text-[#315b3d]">
                        {appointment.LoaiCongViec}
                      </h2>
                    </div>

                    <span className="rounded-full bg-[#edf3e9] px-4 py-2 font-semibold">
                      {appointment.TrangThai}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-x-8 md:grid-cols-2">
                    <Row
                      label="Khách hàng"
                      value={appointment.TenKhachHang}
                    />
                    <Row
                      label="Nhân viên phụ trách"
                      value={
                        appointment.TenNhanVien ||
                        'Chưa phân công'
                      }
                    />
                    <Row
                      label="Ngày hẹn"
                      value={formatDate(appointment.NgayHen)}
                    />
                    <Row
                      label="Ngày hoàn tất"
                      value={formatDate(
                        appointment.NgayHoanTat,
                      )}
                    />
                    <Row
                      label="Địa điểm"
                      value={
                        appointment.DiaDiem ||
                        'Chưa cập nhật'
                      }
                    />
                    <Row
                      label="Yêu cầu"
                      value={`#${appointment.MaYC}`}
                    />
                    <Row
                      label="Phí dự kiến"
                      value={formatMoney(
                        appointment.PhiDuKien,
                      )}
                    />
                    <Row
                      label="Phí thực tế"
                      value={formatMoney(
                        appointment.PhiThucTe,
                      )}
                    />
                    <Row
                      label="Khách xác nhận phí"
                      value={
                        appointment.KhachDongYPhi
                          ? 'Đã đồng ý'
                          : 'Chưa xác nhận'
                      }
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-[#dce7d8] bg-white p-6">
                  <h2 className="text-xl font-bold text-[#315b3d]">
                    Kết quả thực hiện
                  </h2>

                  <p className="mt-4 whitespace-pre-wrap leading-7">
                    {appointment.KetQua ||
                      'Chưa có kết quả'}
                  </p>
                </section>

                <div>
                  <Link
                    href={`/admin/supportdetail?id=${appointment.MaYC}`}
                    className="inline-flex rounded-xl bg-[#315b3d] px-6 py-3 font-semibold text-white"
                  >
                    Xem yêu cầu liên quan
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </main>
      </div>

      <Footer />
    </RoleGuard>
  );
}
