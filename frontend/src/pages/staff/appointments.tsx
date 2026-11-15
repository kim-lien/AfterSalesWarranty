
import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  TrangThai: string;
  KetQua: string | null;
  TieuDe: string;
  TenKhachHang: string;
  TenNhanVien: string | null;
};

type AppointmentResponse = {
  success: boolean;
  total: number;
  data: Appointment[];
};

const statuses = [
  'Tất cả',
  'Chờ xác nhận',
  'Đã xác nhận',
  'Đang thực hiện',
  'Hoàn tất',
  'Đã hủy',
];

function formatDate(value: string | null) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Chưa cập nhật';
  }

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getStatusClass(status: string) {
  switch (status) {
    case 'Chờ xác nhận':
      return 'bg-amber-50 text-amber-700';
    case 'Đã xác nhận':
      return 'bg-sky-50 text-sky-700';
    case 'Đang thực hiện':
      return 'bg-blue-50 text-blue-700';
    case 'Hoàn tất':
      return 'bg-green-50 text-green-700';
    case 'Đã hủy':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getGroupClass(group: string) {
  return group === 'Bảo hành'
    ? 'bg-[#fff1e6] text-[#a8642b]'
    : 'bg-[#eaf3e7] text-[#315b3d]';
}

export default function StaffAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [group, setGroup] = useState('Tất cả');
  const [status, setStatus] = useState('Tất cả');

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api<AppointmentResponse>(
        '/support/appointments',
      );

      setAppointments(
        Array.isArray(response.data) ? response.data : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải danh sách lịch hẹn.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const filtered = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return appointments.filter((item) => {
      const matchGroup =
        group === 'Tất cả' || item.NhomYeuCau === group;

      const matchStatus =
        status === 'Tất cả' || item.TrangThai === status;

      const matchSearch =
        !search ||
        String(item.MaLich).includes(search) ||
        String(item.MaYC).includes(search) ||
        (item.TenKhachHang || '').toLowerCase().includes(search) ||
        (item.LoaiCongViec || '').toLowerCase().includes(search) ||
        (item.TieuDe || '').toLowerCase().includes(search);

      return matchGroup && matchStatus && matchSearch;
    });
  }, [appointments, keyword, group, status]);

  const statistics = [
    {
      label: 'Tổng lịch hẹn',
      value: appointments.length,
    },
    {
      label: 'Lịch bảo hành',
      value: appointments.filter(
        (item) => item.NhomYeuCau === 'Bảo hành',
      ).length,
    },
    {
      label: 'Lịch hậu mãi',
      value: appointments.filter(
        (item) => item.NhomYeuCau === 'Hậu mãi',
      ).length,
    },
    {
      label: 'Đang thực hiện',
      value: appointments.filter(
        (item) => item.TrangThai === 'Đang thực hiện',
      ).length,
    },
  ];

  return (
    <RoleGuard allowedRoles={['Nhân viên']}>
      <Head>
        <title>Lịch hẹn | NHAI&apos;s Green</title>
      </Head>

      <Header />

      <div className="flex min-h-screen items-stretch bg-[#f8faf5]">
        <RoleNavigation role="staff" />

        <main className="min-w-0 flex-1 px-5 py-8 text-[#294530]">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#315b3d]">
                  Lịch hẹn
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  Lịch bảo hành và hậu mãi được phân công
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadAppointments()}
                disabled={loading}
                className="rounded-xl border border-[#cadac5] bg-white px-5 py-3 text-sm font-semibold text-[#315b3d] hover:bg-[#edf4e9] disabled:opacity-50"
              >
                Làm mới
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statistics.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#dce7d8] bg-white p-5"
                >
                  <p className="text-sm text-gray-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-bold text-[#315b3d]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <section className="overflow-hidden rounded-2xl border border-[#dce7d8] bg-white">
              <div className="grid gap-3 border-b border-[#edf0e9] p-5 lg:grid-cols-[1fr_190px_190px]">
                <input
                  type="search"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tìm mã lịch, khách hàng, công việc..."
                  className="w-full rounded-xl border border-[#d6e2d1] px-4 py-3 text-sm outline-none focus:border-[#315b3d]"
                />

                <select
                  value={group}
                  onChange={(event) => setGroup(event.target.value)}
                  className="rounded-xl border border-[#d6e2d1] bg-white px-4 py-3 text-sm"
                >
                  <option value="Tất cả">Tất cả loại lịch</option>
                  <option value="Bảo hành">Bảo hành</option>
                  <option value="Hậu mãi">Hậu mãi</option>
                </select>

                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="rounded-xl border border-[#d6e2d1] bg-white px-4 py-3 text-sm"
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-[#edf3e9] text-[#315b3d]">
                    <tr>
                      <th className="p-4">Mã lịch</th>
                      <th className="p-4">Khách hàng</th>
                      <th className="p-4">Loại lịch</th>
                      <th className="p-4">Công việc</th>
                      <th className="p-4">Ngày hẹn</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((item) => (
                      <tr
                        key={item.MaLich}
                        className="border-t border-[#edf0e9] hover:bg-[#fafcf8]"
                      >
                        <td className="p-4 font-semibold">
                          #{item.MaLich}
                          <p className="mt-1 text-xs font-normal text-gray-500">
                            Yêu cầu #{item.MaYC}
                          </p>
                        </td>

                        <td className="p-4">
                          {item.TenKhachHang}
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getGroupClass(item.NhomYeuCau)}`}
                          >
                            {item.NhomYeuCau}
                          </span>
                        </td>

                        <td className="p-4">
                          <p className="font-semibold text-[#315b3d]">
                            {item.LoaiCongViec}
                          </p>
                          <p className="mt-1 max-w-56 text-xs text-gray-500">
                            {item.TieuDe}
                          </p>
                        </td>

                        <td className="whitespace-nowrap p-4">
                          {formatDate(item.NgayHen)}
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(item.TrangThai)}`}
                          >
                            {item.TrangThai}
                          </span>
                        </td>

                        <td className="p-4">
                          <Link
                            href={`/staff/appointments-detail?id=${item.MaLich}`}
                            className="inline-flex whitespace-nowrap rounded-lg bg-[#315b3d] px-4 py-2 font-semibold text-white hover:bg-[#27482f]"
                          >
                            Xem chi tiết
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {loading && (
                <p className="p-10 text-center text-sm text-gray-500">
                  Đang tải lịch hẹn...
                </p>
              )}

              {!loading && filtered.length === 0 && !error && (
                <p className="p-10 text-center text-gray-500">
                  Chưa có lịch hẹn phù hợp.
                </p>
              )}
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </RoleGuard>
  );
}
