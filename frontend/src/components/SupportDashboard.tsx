
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { api, getUser, logout, LoginUser } from '../api/client';
import Link from 'next/link';
import { uploadTicketPhoto } from './TicketImages';

type Ticket = {
  MaYC: number;
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

type Channel = {
  MaKenh: number;
  TenKenh: string;
};

type Employee = {
  MaNV: number;
  HoTen: string;
};

type OrderItem = {
  LoaiDon: string;
  MaDon: number;
  MaChiTiet: number;
  TenSP: string;
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

type DashboardStats = {
  TongYeuCau: number;
  MoiTao: number;
  DangXuLy: number;
  DaDong: number;
  QuaHanPhanHoi: number;
  QuaHanXuLy: number;
};

const statuses = [
  'Đã tiếp nhận',
  'Đang xác minh',
  'Đang xử lý',
  'Chờ khách hàng',
  'Đã xử lý',
  'Đã đóng',
  'Từ chối',
];

const priorities = ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp'];

const inputStyle =
  'w-full rounded-lg border border-[#d6e1d3] bg-white px-4 py-3 outline-none focus:border-[#315b3d]';

const buttonStyle =
  'rounded-lg bg-[#315b3d] px-5 py-3 font-medium text-white hover:bg-[#25452e] disabled:opacity-50';

function formatDate(value?: string | null) {
  if (!value) return 'Chưa xác định';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Chưa xác định'
    : date.toLocaleString('vi-VN');
}

type ServicePolicy = {
  MaChinhSach: number;
  TenDichVu: string;
  NhomDichVu: string;
  HinhThuc: string;
  GoiApDung: string;
  SoNgayToiDa: number;
  PhiMacDinh: number;
  MoTaDieuKien: string | null;
};

export default function SupportDashboard() {
  const router = useRouter();
  const role = router.pathname.startsWith('/admin')
  ? 'admin'
  : router.pathname.startsWith('/staff')
    ? 'staff'
    : 'customer';
  const [user, setUser] = useState<LoginUser | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedOrder, setSelectedOrder] = useState('');
  const [group, setGroup] = useState('Hậu mãi');
  const [priority, setPriority] = useState('Trung bình');
  const [channelId, setChannelId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
const [policies, setPolicies] = useState<ServicePolicy[]>([]);
const [selectedPolicy, setSelectedPolicy] = useState('');
const [loadingPolicies, setLoadingPolicies] = useState(false);

  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

  const isAdmin = user?.TenVaiTro === 'Quản trị viên';
  const isStaff = user?.TenVaiTro === 'Nhân viên';
  const isCustomer = user?.TenVaiTro === 'Khách hàng';

  useEffect(() => {
    
const order =
  selectedOrder !== ''
    ? orders[Number(selectedOrder)]
    : undefined;

setPolicies([]);
setSelectedPolicy('');

if (!isCustomer || !order) {
  setLoadingPolicies(false);
  return;
}

const loaiDon = order.LoaiDon;
const maDon = order.MaDon;
const maChiTiet = order.MaChiTiet;


    let cancelled = false;

    async function loadPolicies() {
      setLoadingPolicies(true);

      try {
        
const params = new URLSearchParams({
  loaiDon,
  maDon: String(maDon),
  maChiTiet: String(maChiTiet),
  nhomYeuCau: group,
});


        const result = await api<{
          success: boolean;
          data: ServicePolicy[];
        }>(`/support/policies?${params.toString()}`);

        if (!cancelled) {
          setPolicies(result.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Không thể tải danh sách dịch vụ.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPolicies(false);
        }
      }
    }

    void loadPolicies();

    return () => {
      cancelled = true;
    };
  }, [selectedOrder, group, orders, isCustomer]);

  const loadData = useCallback(async (currentUser: LoginUser) => {
    const [ticketResult, channelResult] = await Promise.all([
      api<Ticket[]>('/support/tickets'),
      api<Channel[]>('/support/channels'),
    ]);

    setTickets(ticketResult);
    setChannels(channelResult);

    if (currentUser.TenVaiTro === 'Khách hàng') {
      const orderResult = await api<OrderItem[]>('/support/orders');
      setOrders(orderResult);
      setStats(null);
    } else {
      const statResult = await api<DashboardStats>(
        '/support/dashboard',
      );
      setStats(statResult);
    }

    if (currentUser.TenVaiTro === 'Quản trị viên') {
      const employeeResult = await api<Employee[]>(
        '/support/employees',
      );

    }
  }, []);

  useEffect(() => {
    const currentUser = getUser();
    const token = sessionStorage.getItem('token');

    if (!currentUser || !token) {
      router.replace('/login');
      return;
    }

    setUser(currentUser);
    setLoading(true);

    loadData(currentUser)
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : 'Không thể tải dữ liệu',
        );
      })
      .finally(() => setLoading(false));
  }, [loadData, router]);

  
async function performAction(
  action: () => Promise<unknown>,
) {
  if (!user || busy) return;

  setBusy(true);
  setError('');
  setSuccess('');

  try {
    await action();
    await loadData(user);
    setSuccess('Thao tác đã được thực hiện thành công.');
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Có lỗi xảy ra',
    );
  } finally {
    setBusy(false);
  }
}


async function openTicket(id: number) {
  setError('');

  try {
    const result = await api<TicketDetail>(
      `/support/tickets/${id}`,
    );


    document.getElementById('ticket-detail')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Không thể mở chi tiết yêu cầu',
    );
  }
}

  
function handleCreateTicket(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  const order = orders[Number(selectedOrder)];

  if (selectedOrder === '' || !order) {
    setError('Vui lòng chọn cây đã mua hoặc thuê.');
    return;
  }

  const websiteChannel = channels.find(
    (item) => item.TenKenh === 'Website',
  );

  if (!websiteChannel) {
    setError('Kênh Website hiện chưa khả dụng.');
    return;
  }

  if (!title.trim()) {
    setError('Vui lòng nhập tiêu đề yêu cầu.');
    return;
  }

  if (!description.trim()) {
    setError('Vui lòng mô tả tình trạng cây.');
    return;
  }

  if (!selectedPolicy) {
    setError('Vui lòng chọn dịch vụ cần hỗ trợ.');
    return;
  }

  const policyExists = policies.some(
    (item) =>
      item.MaChinhSach === Number(selectedPolicy),
  );

  if (!policyExists) {
    setError('Dịch vụ được chọn không còn khả dụng.');
    return;
  }


  if (!user || busy) return;

  setBusy(true);
  setError('');
  setSuccess('');

  void (async () => {
    let createdId = 0;

    try {
      const isRental = order.LoaiDon === 'Thuê';

      const result = await api<{
        success: boolean;
        maYC: number;
      }>('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          maKenh: websiteChannel.MaKenh,
          maChinhSach: Number(selectedPolicy),
          nhomYeuCau: group,
          loaiYeuCau: group,
          tieuDe: title.trim(),
          moTa: description.trim(),
          mucDo: priority,
          ...(isRental
            ? {
                maDT: order.MaDon,
                maCTDT: order.MaChiTiet,
              }
            : {
                maDH: order.MaDon,
                maCTDH: order.MaChiTiet,
              }),
        }),
      });

      createdId = Number(result.maYC);

      if (!Number.isSafeInteger(createdId) || createdId <= 0) {
        throw new Error(
          'Đã gửi yêu cầu nhưng chưa nhận được mã yêu cầu.',
        );
      }

      let uploaded = 0;

      for (const photo of selectedPhotos) {
        try {
          await uploadTicketPhoto(createdId, photo);
          uploaded += 1;
        } catch (uploadError) {
          const reason =
            uploadError instanceof Error
              ? uploadError.message
              : 'Không thể tải ảnh lên.';

          setError(
            `Đã tạo yêu cầu #${createdId}, nhưng mới tải được ${uploaded}/${selectedPhotos.length} ảnh. ${reason}`,
          );

          break;
        }
      }

      if (
        selectedPhotos.length === 0 ||
        uploaded === selectedPhotos.length
      ) {
        setSuccess(
          `Yêu cầu #${createdId} đã được tiếp nhận.`,
        );
        setSelectedPhotos([]);
      }

      setTitle('');
      setDescription('');

      await loadData(user);
    } catch (err) {
      setError(
        createdId > 0
          ? `Yêu cầu #${createdId} đã được tạo. Bạn có thể mở chi tiết để bổ sung ảnh.`
          : err instanceof Error
            ? err.message
            : 'Không thể gửi yêu cầu.',
      );
    } finally {
      setBusy(false);
    }
  })();
}


  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f7f0]">
        Đang tải dữ liệu hậu mãi...
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Quản lý hậu mãi | NHAI&apos;s Green</title>
      </Head>

      <div className="min-h-screen bg-[#f5f7f0] text-[#27392d]">
        

        <main className="max-w-7xl mx-auto px-5 py-8 space-y-7">
          <section>
            <h2 className="text-2xl font-bold">
              {isAdmin
                ? 'Quản trị hậu mãi'
                : isStaff
                  ? 'Xử lý yêu cầu khách hàng'
                  : 'Yêu cầu hỗ trợ của tôi'}
            </h2>

           
          </section>

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

          {stats && (
            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                ['Tổng yêu cầu', stats.TongYeuCau],
                ['Mới tạo', stats.MoiTao],
                ['Đang xử lý', stats.DangXuLy],
                ['Đã đóng', stats.DaDong],
                ['Quá hạn phản hồi', stats.QuaHanPhanHoi],
                ['Quá hạn xử lý', stats.QuaHanXuLy],
              ].map(([name, value]) => (
                <div
                  key={String(name)}
                  className="bg-white rounded-xl border border-[#e0e8dc] p-4"
                >
                  <p className="text-sm text-gray-500">{name}</p>
                  <p className="text-3xl font-bold mt-3 text-[#315b3d]">
                    {value ?? 0}
                  </p>
                </div>
              ))}
            </section>
          )}

          {isCustomer && (
            <section className="bg-white rounded-2xl border border-[#e0e8dc] p-6">
              <h3 className="text-xl font-bold mb-5">
                Gửi yêu cầu hậu mãi
              </h3>

              <form
                onSubmit={handleCreateTicket}
                className="space-y-4"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Sản phẩm đã mua hoặc thuê
                    </label>

                    <select
                      required
                      className={inputStyle}
                      value={selectedOrder}
                      onChange={(e) =>
                        setSelectedOrder(e.target.value)
                      }
                    >
                      <option value="">Chọn sản phẩm</option>
                      {orders.map((order, index) => (
                        <option
                          key={`${order.LoaiDon}-${order.MaDon}-${order.MaChiTiet}`}
                          value={index}
                        >
                          {order.LoaiDon} #{order.MaDon} – {order.TenSP}
                        </option>
                      ))}
                    </select>
                  </div>

                  
<div>
  <label
    htmlFor="ticket-group"
    className="mb-2 block text-sm font-medium"
  >
    Loại yêu cầu
  </label>

  <select
    id="ticket-group"
    className={inputStyle}
    value={group}
    onChange={(event) =>
      setGroup(event.target.value)
    }
  >
    <option value="Hậu mãi">Hậu mãi</option>
    <option value="Bảo hành">Bảo hành</option>
    <option value="Đổi trả">Đổi trả</option>
  </select>
</div>

<div>
  <label
    htmlFor="service-policy"
    className="mb-2 block text-sm font-medium"
  >
    Dịch vụ cần hỗ trợ
  </label>

  <select
    id="service-policy"
    value={selectedPolicy}
    onChange={(event) =>
      setSelectedPolicy(event.target.value)
    }
    disabled={loadingPolicies || policies.length === 0}
    className={inputStyle}
    required
  >
    <option value="">
      {loadingPolicies
        ? 'Đang tải dịch vụ...'
        : policies.length === 0
          ? 'Chưa có dịch vụ phù hợp'
          : 'Chọn dịch vụ'}
    </option>

    {policies.map((policy) => (
      <option
        key={policy.MaChinhSach}
        value={policy.MaChinhSach}
      >
        {policy.TenDichVu}
      </option>
    ))}
  </select>
</div>

{selectedPolicy && (
  <div className="rounded-xl bg-[#f1f6ee] p-4 text-sm text-[#456148] md:col-span-2">
    {policies
      .filter(
        (policy) =>
          policy.MaChinhSach === Number(selectedPolicy),
      )
      .map((policy) => (
        <div key={policy.MaChinhSach}>
          <p className="font-semibold">
            {policy.TenDichVu}
          </p>

          <p className="mt-2">
            {policy.MoTaDieuKien || 'Theo chính sách dịch vụ'}
          </p>

          <p className="mt-2">
            Thời hạn tối đa: {policy.SoNgayToiDa} ngày
          </p>

          <p className="mt-2">
            Phí theo chính sách:{' '}
            {Number(policy.PhiMacDinh).toLocaleString('vi-VN')} đ
          </p>
        </div>
      ))}
  </div>
)}


                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mức độ ưu tiên
                    </label>

                    <select
                      className={inputStyle}
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      {priorities.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <input
                  required
                  maxLength={200}
                  className={inputStyle}
                  placeholder="Tiêu đề yêu cầu"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <textarea
                  rows={4}
                  className={inputStyle}
                  placeholder="Mô tả vấn đề với cây cảnh"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

<div className="space-y-3">
  <label
    htmlFor="ticket-photos"
    className="block text-sm font-medium text-[#315b3d]"
  >
    Hình ảnh tình trạng cây
  </label>

  <input
    id="ticket-photos"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    multiple
    className={inputStyle}
    onChange={(event) => {
      const files = Array.from(
        event.target.files || [],
      );

      if (files.length > 5) {
        setError('Vui lòng chọn tối đa 5 ảnh.');
        setSelectedPhotos([]);
        event.target.value = '';
        return;
      }

      setError('');
      setSelectedPhotos(files);
    }}
  />

  <p className="text-xs text-gray-500">
    Có thể chọn tối đa 5 ảnh JPG, PNG hoặc WebP.
  </p>

  {selectedPhotos.length > 0 && (
    <div className="rounded-xl bg-[#f1f7ed] p-4">
      <p className="mb-3 text-sm font-medium text-[#315b3d]">
        Đã chọn {selectedPhotos.length} ảnh
      </p>

      <div className="space-y-2">
        {selectedPhotos.map((file, index) => (
          <p
            key={`${file.name}-${index}`}
            className="truncate text-sm text-gray-600"
          >
            {index + 1}. {file.name}
          </p>
        ))}
      </div>
    </div>
  )}
</div>


                <button
                  disabled={busy || orders.length === 0}
                  className={buttonStyle}
                >
                  {busy ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>

                {orders.length === 0 && (
                  <p className="text-sm text-amber-700">
                    Chưa tìm thấy sản phẩm thuộc đơn mua hoặc đơn thuê
                    của tài khoản này. Cần có đơn hàng hợp lệ để tạo
                    yêu cầu hậu mãi.
                  </p>
                )}
              </form>
            </section>
          )}

          <section className="bg-white rounded-2xl border border-[#e0e8dc] overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center gap-3">
              <h3 className="text-xl font-bold">
                Danh sách yêu cầu
              </h3>

              <button
                className="text-sm text-[#315b3d] font-semibold hover:underline"
                onClick={() => {
                  if (!user) return;
                  setLoading(true);
                  loadData(user)
                    .catch((err) => setError(err.message))
                    .finally(() => setLoading(false));
                }}
              >
                Làm mới
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#eef3eb]">
                  <tr>
                    <th className="p-4">Mã</th>
                    <th className="p-4">Yêu cầu</th>
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4">SLA</th>
                    <th className="p-4">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {tickets.map((ticket) => {
                    const overdue =
                      ticket.QuaHanPhanHoi ||
                      ticket.QuaHanXuLy;

                    return (
                      <tr
                        key={ticket.MaYC}
                        className="border-t border-[#edf0e9]"
                      >
                        <td className="p-4 font-semibold">
                          #{ticket.MaYC}
                        </td>

                        <td className="p-4">
                          <p className="font-medium">
                            {ticket.TieuDe}
                          </p>
                          <p className="text-gray-500 mt-1">
                            {ticket.NhomYeuCau}
                          </p>
                        </td>

                        <td className="p-4">
                          {ticket.TenKhachHang ?? '-'}
                        </td>

                        <td className="p-4">
                          {ticket.TrangThai}
                        </td>

                        <td className="p-4">
                          <span
                            className={
                              overdue
                                ? 'text-red-600 font-semibold'
                                : 'text-green-700'
                            }
                          >
                            {overdue ? 'Quá hạn' : 'Trong hạn'}
                          </span>
                        </td>

                        <td className="p-4">

<Link
  href={
    role === 'customer'
      ? `/customer/support-detail?id=${ticket.MaYC}`
      : `/${role}/supportdetail?id=${ticket.MaYC}`
  }
  className="font-semibold text-[#315b3d] hover:underline"
>
  Xem chi tiết
</Link>

                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {tickets.length === 0 && (
                <p className="p-8 text-center text-gray-500">
                  Chưa có yêu cầu hậu mãi.
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
