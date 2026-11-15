import WarrantyPanel from './WarrantyPanel';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { api, getUser } from '../api/client';
import TicketImages from './TicketImages';

type Role = 'admin' | 'staff';

type SupportDetailsProps = {
  role: Role;
};

type Ticket = {
  MaYC: number;
  MaBH: number | null;
ConQuyenLoi: boolean | number | null;
MaChinhSach: number | null;
  TieuDe: string;
  MoTa: string | null;
  NhomYeuCau: string;
  LoaiYeuCau: string;
  TrangThai: string;
  MucDo: string;
  TenKhachHang?: string;
  TenKenh?: string;
  MaNVXuLy: number | null;
  MaKenhTiepNhan: number;
  HanPhanHoi: string | null;
  HanXuLy: string | null;
  QuaHanPhanHoi: boolean | null;
  QuaHanXuLy: boolean | null;
  NgayTao: string;
};

type Message = {
  MaTuongTac: number;
  NoiDung: string;
  HoTen: string | null;
  TenKenh: string;
  ThoiGian: string;
};

type StatusHistory = {
  MaLSTS: number;
  TrangThaiCu: string | null;
  TrangThaiMoi: string;
  HoTen: string;
  LyDo: string | null;
  ThoiGian: string;
};

type TicketDetail = {
  ticket: Ticket;
  messages: Message[];
  history: StatusHistory[];
};

type Employee = {
  MaNV: number;
  HoTen: string;
};

type Channel = {
  MaKenh: number;
  TenKenh: string;
};

const statuses = [
  'Mới tạo',
  'Đã tiếp nhận',
  'Đang xác minh',
  'Đang xử lý',
  'Chờ khách hàng',
  'Đã xử lý',
  'Đã đóng',
  'Từ chối',
  'Đã hủy',
];

const inputStyle =
  'w-full rounded-xl border border-[#d6e1d3] bg-white px-4 py-3 outline-none focus:border-[#315b3d]';

const buttonStyle =
  'rounded-xl bg-[#315b3d] px-5 py-3 font-medium text-white hover:bg-[#25452e] disabled:cursor-not-allowed disabled:opacity-50';

function formatDate(value?: string | null) {
  if (!value) return 'Chưa xác định';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Chưa xác định'
    : date.toLocaleString('vi-VN');
}

export default function SupportDetails({
  role,
}: SupportDetailsProps) {
  const router = useRouter();

  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [employeeId, setEmployeeId] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');

  const [message, setMessage] = useState('');
  const [messageChannel, setMessageChannel] = useState('');

  const id =
    typeof router.query.id === 'string'
      ? Number(router.query.id)
      : 0;

  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';

  const backUrl = `/${role}/support`;

  const loadDetail = useCallback(async (ticketId: number) => {
    const result = await api<TicketDetail>(
      `/support/tickets/${ticketId}`,
    );

    setDetail(result);

    setEmployeeId(
      result.ticket.MaNVXuLy !== null
        ? String(result.ticket.MaNVXuLy)
        : '',
    );

    setNewStatus(result.ticket.TrangThai);

    setMessageChannel(
      String(result.ticket.MaKenhTiepNhan),
    );
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    const currentUser = getUser();
    const token = sessionStorage.getItem('token');

    if (!currentUser || !token) {
      router.replace('/login');
      return;
    }

    if (
      (role === 'admin' && currentUser.TenVaiTro !== 'Quản trị viên') ||
      (role === 'staff' && currentUser.TenVaiTro !== 'Nhân viên')
    ) {
      setError('Bạn không có quyền truy cập trang này.');
      setLoading(false);
      return;
    }

    if (!Number.isInteger(id) || id <= 0) {
      setError('Mã yêu cầu không hợp lệ.');
      setLoading(false);
      return;
    }

    let active = true;

    async function loadPage() {
      setLoading(true);
      setError('');

      try {
        const requests: [
          Promise<TicketDetail>,
          Promise<Channel[]>,
          Promise<Employee[]> | Promise<null>,
        ] = [
          api<TicketDetail>(`/support/tickets/${id}`),
          api<Channel[]>('/support/channels'),
          isAdmin
            ? api<Employee[]>('/support/employees')
            : Promise.resolve(null),
        ];

        const [ticketResult, channelResult, employeeResult] =
          await Promise.all(requests);

        if (!active) return;

        setDetail(ticketResult);
        setChannels(channelResult);
        setEmployees(employeeResult ?? []);

        setEmployeeId(
          ticketResult.ticket.MaNVXuLy !== null
            ? String(ticketResult.ticket.MaNVXuLy)
            : '',
        );

        setNewStatus(ticketResult.ticket.TrangThai);
        setMessageChannel(
          String(ticketResult.ticket.MaKenhTiepNhan),
        );
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Không thể tải chi tiết yêu cầu.',
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [router.isReady, router, id, role, isAdmin]);

  async function performAction(
    action: () => Promise<unknown>,
    successMessage: string,
  ) {
    if (!detail || busy) return;

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      await action();
      await loadDetail(detail.ticket.MaYC);
      setSuccess(successMessage);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể thực hiện thao tác.',
      );
    } finally {
      setBusy(false);
    }
  }

  function handleCreateWarranty() {
    if (!detail || busy) return;

    const ticket = detail.ticket;

    if (
      ticket.NhomYeuCau !== 'Bảo hành' ||
      ticket.MaBH ||
      !ticket.ConQuyenLoi
    ) {
      return;
    }

    if (
      !window.confirm(
        `Bạn có muốn lập phiếu bảo hành cho yêu cầu #${ticket.MaYC}?`,
      )
    ) {
      return;
    }

    void performAction(
      () =>
        api(
          `/support/tickets/${ticket.MaYC}/warranty`,
          {
            method: 'POST',
          },
        ),
      'Đã lập phiếu bảo hành thành công.',
    );
  }

  function handleAssign() {
    if (!isAdmin || !detail || !employeeId) return;

    performAction(
      () =>
        api(`/support/tickets/${detail.ticket.MaYC}/assign`, {
          method: 'PATCH',
          body: JSON.stringify({
            maNV: Number(employeeId),
          }),
        }),
      'Đã phân công nhân viên xử lý.',
    );
  }

  function handleStatus() {
    if (!detail || !newStatus || newStatus === detail.ticket.TrangThai) {
      return;
    }

    performAction(
      () =>
        api(`/support/tickets/${detail.ticket.MaYC}/status`, {
          method: 'PATCH',
          body: JSON.stringify({
            trangThai: newStatus,
            lyDo: reason.trim(),
          }),
        }),
      'Đã cập nhật trạng thái yêu cầu.',
    );
  }

  function handleMessage() {
    if (!detail || !message.trim() || !messageChannel) return;

    performAction(
      async () => {
        await api(
          `/support/tickets/${detail.ticket.MaYC}/messages`,
          {
            method: 'POST',
            body: JSON.stringify({
              maKenh: Number(messageChannel),
              noiDung: message.trim(),
            }),
          },
        );

        setMessage('');
      },
      'Đã lưu nội dung tương tác.',
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f8faf5]">
        <p className="text-[#315b3d]">
          Đang tải chi tiết yêu cầu...
        </p>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="min-h-[60vh] bg-[#f8faf5] px-5 py-10">
        <div className="mx-auto max-w-6xl rounded-2xl border border-[#dce7d8] bg-white p-8">
          <h1 className="text-2xl font-bold text-[#315b3d]">
            Không thể hiển thị yêu cầu
          </h1>

          <p className="mt-4 text-red-600">
            {error || 'Không tìm thấy dữ liệu yêu cầu.'}
          </p>

          <Link
            href={backUrl}
            className="mt-6 inline-block rounded-xl bg-[#315b3d] px-5 py-3 text-white"
          >
            Quay lại danh sách
          </Link>
        </div>
      </main>
    );
  }

  const ticket = detail.ticket;

  return (
    <main className="min-h-screen bg-[#f8faf5] px-4 py-8 text-[#27392d] md:px-7">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href={backUrl}
          className="inline-block font-medium text-[#315b3d] hover:underline"
        >
          ← Quay lại danh sách yêu cầu
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#829a7c]">
              NHAI&apos;S GREEN / HẬU MÃI
            </p>

            <h1 className="mt-3 text-3xl font-bold text-[#315b3d]">
              Yêu cầu #{ticket.MaYC}
            </h1>

            <p className="mt-2 text-lg">
              {ticket.TieuDe}
            </p>
          </div>

          <span className="rounded-full bg-[#e3eee0] px-4 py-2 font-semibold text-[#315b3d]">
            {ticket.TrangThai}
          </span>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            {success}
          </div>
        )}

        <section className="rounded-2xl border border-[#dce7d8] bg-white p-6">
          <h2 className="text-xl font-bold text-[#315b3d]">
            Thông tin yêu cầu
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Khách hàng</p>
              <p className="mt-2 font-medium">
                {ticket.TenKhachHang ?? 'Chưa có thông tin'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Nhóm yêu cầu</p>
              <p className="mt-2 font-medium">
                {ticket.NhomYeuCau}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Loại yêu cầu</p>
              <p className="mt-2 font-medium">
                {ticket.LoaiYeuCau}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Mức độ ưu tiên</p>
              <p className="mt-2 font-medium">
                {ticket.MucDo}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Kênh tiếp nhận</p>
              <p className="mt-2 font-medium">
                {ticket.TenKenh ?? 'Chưa có thông tin'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Ngày tạo</p>
              <p className="mt-2 font-medium">
                {formatDate(ticket.NgayTao)}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-[#e8eee5] pt-5">
            <h3 className="font-semibold text-[#315b3d]">
              Nội dung yêu cầu
            </h3>

            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-600">
              {ticket.MoTa || 'Không có mô tả.'}
            </p>
          </div>
        </section>


{ticket.NhomYeuCau === 'Bảo hành' && (
  <>
    {!ticket.MaBH && (
      <section className="rounded-2xl border border-[#dce7d8] bg-white p-6">
        <h2 className="text-xl font-bold text-[#315b3d]">
          Lập phiếu bảo hành
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Kiểm tra quyền lợi trước khi tiếp nhận bảo hành.
        </p>

        <div className="mt-5 rounded-xl bg-[#f3f7f0] p-5">
          <p className="text-sm text-gray-500">
            Chính sách áp dụng
          </p>

          <p className="mt-2 font-semibold">
            {ticket.MaChinhSach
              ? `Chính sách #${ticket.MaChinhSach}`
              : 'Chưa có chính sách'}
          </p>

          <p
            className={`mt-3 font-semibold ${
              ticket.ConQuyenLoi
                ? 'text-green-700'
                : 'text-red-600'
            }`}
          >
            {ticket.ConQuyenLoi
              ? 'Đủ điều kiện bảo hành'
              : 'Chưa đủ điều kiện bảo hành'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateWarranty}
          disabled={
            busy ||
            !ticket.ConQuyenLoi ||
            !ticket.MaChinhSach
          }
          className={`${buttonStyle} mt-5`}
        >
          {busy
            ? 'Đang lập phiếu...'
            : 'Lập phiếu bảo hành'}
        </button>
      </section>
    )}

    <WarrantyPanel
  key={`${ticket.MaYC}-${ticket.MaBH ?? 0}`}
  maYC={ticket.MaYC}
/>
  </>
)}

{detail?.ticket?.MaYC && (
  <TicketImages
    ticketId={Number(detail.ticket.MaYC)}
    allowUpload={
      !['Đã đóng', 'Từ chối', 'Đã hủy'].includes(
        detail.ticket.TrangThai,
      )
    }
  />
)}


        <section className="rounded-2xl border border-[#dce7d8] bg-white p-6">
          <h2 className="text-xl font-bold text-[#315b3d]">
            Theo dõi SLA
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-xl bg-[#f3f7f0] p-5">
              <p className="font-semibold">Thời hạn phản hồi</p>

              <p className="mt-3 text-gray-700">
                {formatDate(ticket.HanPhanHoi)}
              </p>

              <p
                className={`mt-3 font-semibold ${
                  ticket.QuaHanPhanHoi
                    ? 'text-red-600'
                    : 'text-green-700'
                }`}
              >
                {ticket.HanPhanHoi === null
                  ? 'Chưa thiết lập SLA'
                  : ticket.QuaHanPhanHoi === null
                    ? 'Chưa xác định'
                    : ticket.QuaHanPhanHoi
                      ? 'Đã quá hạn phản hồi'
                      : 'Chưa quá hạn phản hồi'}
              </p>
            </div>

            <div className="rounded-xl bg-[#f3f7f0] p-5">
              <p className="font-semibold">Thời hạn xử lý</p>

              <p className="mt-3 text-gray-700">
                {formatDate(ticket.HanXuLy)}
              </p>

              <p
                className={`mt-3 font-semibold ${
                  ticket.QuaHanXuLy
                    ? 'text-red-600'
                    : 'text-green-700'
                }`}
              >
                {ticket.HanXuLy === null
                  ? 'Chưa thiết lập SLA'
                  : ticket.QuaHanXuLy === null
                    ? 'Chưa xác định'
                    : ticket.QuaHanXuLy
                      ? 'Đã quá hạn xử lý'
                      : 'Chưa quá hạn xử lý'}
              </p>
            </div>
          </div>
        </section>

        {isAdmin && (
          <section className="rounded-2xl border border-[#dce7d8] bg-white p-6">
            <h2 className="text-xl font-bold text-[#315b3d]">
              Phân công nhân viên xử lý
            </h2>

            <div className="mt-5 flex flex-col gap-3 md:flex-row">
              <select
                className={inputStyle}
                value={employeeId}
                onChange={(event) =>
                  setEmployeeId(event.target.value)
                }
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

              <button
                type="button"
                disabled={busy || !employeeId}
                onClick={handleAssign}
                className={`${buttonStyle} shrink-0`}
              >
                {busy ? 'Đang xử lý...' : 'Phân công'}
              </button>
            </div>
          </section>
        )}

        {(isAdmin || isStaff) && (
          <section className="rounded-2xl border border-[#dce7d8] bg-white p-6">
            <h2 className="text-xl font-bold text-[#315b3d]">
              Cập nhật tiến độ xử lý
            </h2>

            <div className="mt-5 space-y-4">
              <select
                className={inputStyle}
                value={newStatus}
                onChange={(event) =>
                  setNewStatus(event.target.value)
                }
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <textarea
                rows={3}
                className={inputStyle}
                placeholder="Lý do hoặc nội dung xử lý"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
              />

              <button
                type="button"
                disabled={
                  busy ||
                  !newStatus ||
                  newStatus === ticket.TrangThai
                }
                onClick={handleStatus}
                className={buttonStyle}
              >
                {busy ? 'Đang lưu...' : 'Lưu trạng thái'}
              </button>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-[#dce7d8] bg-white p-6">
          <h2 className="text-xl font-bold text-[#315b3d]">
            Lịch sử trao đổi đa kênh
          </h2>

          <div className="mt-5 space-y-3">
            {detail.messages.length === 0 ? (
              <p className="text-gray-500">
                Chưa có nội dung trao đổi.
              </p>
            ) : (
              detail.messages.map((item) => (
                <div
                  key={item.MaTuongTac}
                  className="rounded-xl bg-[#f3f7f0] p-4"
                >
                  <p className="text-sm text-gray-500">
                    {item.HoTen ?? 'Người gửi bên ngoài'}
                    {' · '}
                    {item.TenKenh}
                    {' · '}
                    {formatDate(item.ThoiGian)}
                  </p>

                  <p className="mt-3 whitespace-pre-wrap leading-7">
                    {item.NoiDung}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 space-y-4 border-t border-[#e8eee5] pt-5">
            <h3 className="font-semibold text-[#315b3d]">
              Ghi nhận nội dung tương tác
            </h3>

            <select
              value={messageChannel}
              onChange={(event) =>
                setMessageChannel(event.target.value)
              }
              className={inputStyle}
            >
              <option value="">Chọn kênh tương tác</option>

              {channels.map((channel) => (
                <option
                  key={channel.MaKenh}
                  value={channel.MaKenh}
                >
                  {channel.TenKenh}
                </option>
              ))}
            </select>

            <textarea
              rows={4}
              className={inputStyle}
              placeholder="Nhập nội dung trao đổi"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
            />

            <button
              type="button"
              disabled={
                busy ||
                !message.trim() ||
                !messageChannel
              }
              onClick={handleMessage}
              className={buttonStyle}
            >
              {busy ? 'Đang lưu...' : 'Lưu tương tác'}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-[#dce7d8] bg-white p-6">
          <h2 className="text-xl font-bold text-[#315b3d]">
            Lịch sử thay đổi trạng thái
          </h2>

          <div className="mt-5 space-y-4">
            {detail.history.length === 0 ? (
              <p className="text-gray-500">
                Chưa có lịch sử thay đổi trạng thái.
              </p>
            ) : (
              detail.history.map((item) => (
                <div
                  key={item.MaLSTS}
                  className="border-l-2 border-[#315b3d] pl-4"
                >
                  <p className="font-semibold">
                    {item.TrangThaiCu ?? 'Khởi tạo'}
                    {' → '}
                    {item.TrangThaiMoi}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    {item.HoTen}
                    {' · '}
                    {formatDate(item.ThoiGian)}
                  </p>

                  {item.LyDo && (
                    <p className="mt-2 whitespace-pre-wrap text-gray-700">
                      {item.LyDo}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
