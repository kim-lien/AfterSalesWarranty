
import Head from 'next/head';
import Link from 'next/link';
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '../../api/client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RoleGuard from '../../components/RoleGuard';
import RoleNavigation from '../../components/RoleNavigation';

type Employee = {
  MaNV: number;
  HoTen: string;
  Email: string | null;
};
type Appointment = {
  MaLich: number;
  MaYC: number;
  MaNV: number | null;
  LoaiCongViec: string;
  NgayHen: string;
  NgayHoanTat: string | null;
  DiaDiem: string | null;
  TrangThai: string;
  KetQua: string | null;
  TieuDe: string;
  NhomYeuCau: string;
  TenKhachHang: string;
  TenNhanVien: string | null;
};

type Ticket = {
  MaYC: number;
  TieuDe: string;
  NhomYeuCau: string;
  TrangThai: string;
  MaNVXuLy: number | null;
  TenKhachHang: string;
};

type AppointmentResponse = {
  success: boolean;
  data: Appointment[];
};

const jobsByGroup: Record<string, string[]> = {
  'Bảo hành': [
    'Kiểm tra',
    'Sửa chữa',
    'Thay cây',
    'Chăm sóc',
  ],
  'Hậu mãi': [
    'Tư vấn',
    'Chăm sóc',
    'Kiểm tra',
    'Bón phân',
    'Tưới nước',
    'Cắt tỉa',
    'Trồng cây',
    'Thay đất',
  ],
};

const inputClass =
  'w-full rounded-xl border border-[#d5e2d0] bg-white px-4 py-3 text-sm outline-none focus:border-[#315b3d]';

function formatDate(value: string | null) {
  if (!value) return 'Chưa có';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Chưa có'
    : date.toLocaleString('vi-VN');
}

export default function AdminAppointmentsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
const [selectedEmployee, setSelectedEmployee] = useState('');
  const [appointments, setAppointments] = useState<
    Appointment[]
  >([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tất cả');

  const [maYC, setMaYC] = useState('');
  const [loaiCongViec, setLoaiCongViec] = useState('');
  const [ngayHen, setNgayHen] = useState('');
  const [diaDiem, setDiaDiem] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [appointmentResult, ticketResult, employeeResult] =
  await Promise.all([
    api<AppointmentResponse>('/support/appointments'),
    api<Ticket[]>('/support/tickets'),
    api<Employee[]>('/support/employees'),
  ]);

setEmployees(
  Array.isArray(employeeResult) ? employeeResult : [],
);

      setAppointments(
        Array.isArray(appointmentResult.data)
          ? appointmentResult.data
          : [],
      );

      setTickets(
        Array.isArray(ticketResult)
          ? ticketResult
          : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải lịch hẹn.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const availableTickets = useMemo(() => {
    return tickets.filter(
      (ticket) =>
        ['Bảo hành', 'Hậu mãi'].includes(
          ticket.NhomYeuCau,
        ) &&
        !['Đã đóng', 'Từ chối', 'Đã hủy'].includes(
  ticket.TrangThai,
)
    );
  }, [tickets]);

  const selectedTicket = availableTickets.find(
    (ticket) => ticket.MaYC === Number(maYC),
  );

  const availableJobs = selectedTicket
    ? jobsByGroup[selectedTicket.NhomYeuCau] || []
    : [];

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchGroup =
        filter === 'Tất cả' ||
        appointment.NhomYeuCau === filter;

      const matchSearch =
        !keyword ||
        String(appointment.MaLich).includes(keyword) ||
        String(appointment.MaYC).includes(keyword) ||
        (appointment.TenKhachHang || '')
          .toLowerCase()
          .includes(keyword) ||
        (appointment.LoaiCongViec || '')
          .toLowerCase()
          .includes(keyword);

      return matchGroup && matchSearch;
    });
  }, [appointments, search, filter]);

  async function createAppointment(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedTicket || !selectedEmployee || !loaiCongViec || !ngayHen) {
      setError('Vui lòng nhập đầy đủ thông tin lịch hẹn.');
      return;
    }

    const date = new Date(ngayHen);

    if (
      Number.isNaN(date.getTime()) ||
      date.getTime() <= Date.now()
    ) {
      setError('Ngày hẹn phải ở trong tương lai.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await api(
        `/support/tickets/${selectedTicket.MaYC}/appointments`,
        {
          method: 'POST',
          body: JSON.stringify({
            maNV: Number(selectedEmployee),
            loaiCongViec,
            ngayHen: date.toISOString(),
            diaDiem: diaDiem.trim(),
          }),
        },
      );

      setNotice('Đã tạo lịch hẹn thành công.');
      setMaYC('');
      setLoaiCongViec('');
      setNgayHen('');
      setDiaDiem('');
      setSelectedEmployee('');

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tạo lịch hẹn.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <RoleGuard allowedRoles={['Quản trị viên']}>
      <Head>
        <title>Quản lý lịch hẹn | NHAI&apos;s Green</title>
      </Head>

      <Header />

      <div className="flex min-h-screen items-stretch bg-[#f8faf5]">
        <RoleNavigation role="admin" />

        <main className="min-w-0 flex-1 px-5 py-8 text-[#294530]">
          <div className="mx-auto max-w-7xl space-y-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#829a7c]">
                  NHAI&apos;s Green
                </p>

                <h1 className="mt-3 text-3xl font-bold text-[#315b3d]">
                  Quản lý lịch hẹn
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  Lịch bảo hành và chăm sóc khách hàng
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadData()}
                className="rounded-xl border border-[#cbdac7] bg-white px-5 py-3 font-semibold"
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

            {notice && (
              <p className="rounded-xl bg-green-50 p-4 text-green-800">
                {notice}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Tổng lịch hẹn', appointments.length],
                [
                  'Lịch bảo hành',
                  appointments.filter(
                    (item) => item.NhomYeuCau === 'Bảo hành',
                  ).length,
                ],
                [
                  'Lịch hậu mãi',
                  appointments.filter(
                    (item) => item.NhomYeuCau === 'Hậu mãi',
                  ).length,
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl border border-[#dce7d8] bg-white p-5"
                >
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="mt-3 text-3xl font-bold text-[#315b3d]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <section className="rounded-2xl border border-[#dce7d8] bg-white p-6">
              <h2 className="text-xl font-bold text-[#315b3d]">
                Tạo lịch hẹn
              </h2>

              <form
                onSubmit={createAppointment}
                className="mt-6 grid gap-5 md:grid-cols-2"
              >
                <div>
                  <label className="mb-2 block font-semibold">
                    Yêu cầu khách hàng
                  </label>

                  <select
                    required
                    value={maYC}
                    onChange={(event) => {
                      setMaYC(event.target.value);
                      setLoaiCongViec('');
                    }}
                    className={inputClass}
                  >
                    <option value="">Chọn yêu cầu</option>

                    {availableTickets.map((ticket) => (
                      <option
                        key={ticket.MaYC}
                        value={ticket.MaYC}
                      >
                        #{ticket.MaYC} – {ticket.NhomYeuCau}
                        {' – '}
                        {ticket.TenKhachHang}
                      </option>
                    ))}
                  </select>

                  {!loading && availableTickets.length === 0 && (
                    <p className="mt-2 text-sm text-amber-700">
                      Chưa có yêu cầu đang xử lý được phân công.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block font-semibold">
                    Công việc
                  </label>

                  <select
                    required
                    value={loaiCongViec}
                    disabled={!selectedTicket}
                    onChange={(event) =>
                      setLoaiCongViec(event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">Chọn công việc</option>

                    {availableJobs.map((job) => (
                      <option key={job} value={job}>
                        {job}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
  <label className="mb-2 block font-semibold">
    Nhân viên thực hiện
  </label>

  <select
    required
    value={selectedEmployee}
    onChange={(event) =>
      setSelectedEmployee(event.target.value)
    }
    className={inputClass}
  >
    <option value="">Chọn nhân viên</option>

    {employees.map((employee) => (
      <option
        key={employee.MaNV}
        value={employee.MaNV}
      >
        {employee.HoTen}
      </option>
    ))}
  </select>
</div>

                <div>
                  <label className="mb-2 block font-semibold">
                    Ngày và giờ hẹn
                  </label>

                  <input
                    type="datetime-local"
                    required
                    value={ngayHen}
                    onChange={(event) =>
                      setNgayHen(event.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold">
                    Địa điểm
                  </label>

                  <input
                    type="text"
                    value={diaDiem}
                    maxLength={500}
                    onChange={(event) =>
                      setDiaDiem(event.target.value)
                    }
                    placeholder="Địa chỉ khách hàng hoặc cửa hàng"
                    className={inputClass}
                  />
                </div>

                {selectedTicket && (
                  <p className="md:col-span-2 text-sm text-gray-600">
                    Nhóm yêu cầu:{' '}
                    <strong>
                      {selectedTicket.NhomYeuCau}
                    </strong>
                    {' · '}
                   
                  </p>
                )}

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={saving || !selectedTicket}
                    className="rounded-xl bg-[#315b3d] px-6 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? 'Đang tạo...' : 'Tạo lịch hẹn'}
                  </button>
                </div>
              </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#dce7d8] bg-white">
              <div className="flex flex-wrap gap-3 border-b p-5">
                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Tìm mã lịch, khách hàng, công việc..."
                  className={`${inputClass} min-w-0 flex-1`}
                />

                <select
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value)
                  }
                  className="rounded-xl border border-[#d5e2d0] bg-white px-4 py-3"
                >
                  <option value="Tất cả">Tất cả lịch hẹn</option>
                  <option value="Bảo hành">Bảo hành</option>
                  <option value="Hậu mãi">Hậu mãi</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-[#edf3e9] text-[#315b3d]">
                    <tr>
                      <th className="p-4">Mã lịch</th>
                      <th className="p-4">Khách hàng</th>
                      <th className="p-4">Nhóm yêu cầu</th>
                      <th className="p-4">Công việc</th>
                      <th className="p-4">Nhân viên</th>
                      <th className="p-4">Ngày hẹn</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.MaLich} className="border-t">
                        <td className="p-4 font-semibold">
                          #{item.MaLich}
                        </td>
                        <td className="p-4">
                          {item.TenKhachHang}
                        </td>
                        <td className="p-4">
                          {item.NhomYeuCau}
                        </td>
                        <td className="p-4">
                          {item.LoaiCongViec}
                        </td>
                        <td className="p-4">
                          {item.TenNhanVien || 'Chưa phân công'}
                        </td>
                        <td className="p-4">
                          {formatDate(item.NgayHen)}
                        </td>
                        <td className="p-4">
                          {item.TrangThai}
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/admin/appointments-detail?id=${item.MaLich}`}
                            className="rounded-lg bg-[#315b3d] px-4 py-2 font-semibold text-white"
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
                <p className="p-8 text-center text-gray-500">
                  Đang tải lịch hẹn...
                </p>
              )}

              {!loading && filtered.length === 0 && (
                <p className="p-8 text-center text-gray-500">
                  Chưa có lịch hẹn
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
