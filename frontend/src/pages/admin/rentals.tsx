import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RoleGuard from '../../components/RoleGuard';
import RoleNavigation from '../../components/RoleNavigation';
import { api } from '../../api/client';

type RentalOrder = {
  MaDT: number;
  MaKH: number;
  TenKhachHang: string;
  MaHopDong: string;
  NgayBatDau: string;
  NgayKetThuc: string;
  NgayTao: string;
  GoiThue: string;
  TrangThai: string;
  TrangThaiCoc: string;
  TienCocDuKien: number;
  TienCocDaThu: number;
  PhiGoiGoc: number;
  GiamGiaGoi: number;
  PhiVanChuyen: number;
  PhiKhac: number;
  TenNguoiNhan: string;
  SDT: string;
  TinhThanh: string;
  DiaChiChiTiet: string;
  SoLuongCay: number;
  TienThue: number;
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

type RentalPayment = {
  MaTT: number;
  LoaiThanhToan: string;
  SoTien: number;
  PhuongThuc: string;
  MaGiaoDich: string | null;
  TrangThai: string;
  ThoiGian: string;
};

type RentalDetail = {
  order: RentalOrder & {
    QuanHuyen: string | null;
    PhuongXa: string | null;
    GhiChu: string | null;
  };
  items: RentalItem[];
  payments: RentalPayment[];
};

function money(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function date(value: string | null | undefined) {
  if (!value) return 'Chưa có';

  return new Date(value).toLocaleDateString('vi-VN');
}

function statusClass(status: string) {
  if (status === 'Đã trả' || status === 'Đã thu') {
    return 'bg-green-100 text-green-800';
  }

  if (status === 'Đã hủy' || status === 'Đang tranh chấp') {
    return 'bg-red-100 text-red-700';
  }

  if (status === 'Đang thuê' || status === 'Đã xác nhận') {
    return 'bg-blue-100 text-blue-800';
  }

  return 'bg-amber-100 text-amber-800';
}

function Status({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(value)}`}
    >
      {value}
    </span>
  );
}

export function RentalManager() {
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tất cả');

  async function loadOrders() {
    setLoading(true);
    setError('');

    try {
      const response = await api<{
        success: boolean;
        data: RentalOrder[];
      }>('/rentals');

      setOrders(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không tải được danh sách đơn thuê',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);


  const filtered = orders.filter((order) => {
    const keyword = search.toLowerCase().trim();

    const matchSearch =
      !keyword ||
      String(order.MaDT).includes(keyword) ||
      order.TenKhachHang.toLowerCase().includes(keyword) ||
      order.MaHopDong.toLowerCase().includes(keyword);

    const matchStatus =
      filter === 'Tất cả' || order.TrangThai === filter;

    return matchSearch && matchStatus;
  });

  const waitingCount = orders.filter(
    (order) => order.TrangThai === 'Chờ xác nhận',
  ).length;

  const activeCount = orders.filter(
    (order) => order.TrangThai === 'Đang thuê',
  ).length;

  const returnedCount = orders.filter(
    (order) => order.TrangThai === 'Đã trả',
  ).length;

  return (
    <main className="min-h-screen bg-[#f8faf5] px-5 py-10 text-[#294530]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#799575]">
              QUẢN LÝ KINH DOANH
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Quản lý đơn thuê cây
            </h1>

            <p className="mt-3 text-sm text-gray-500">
              Theo dõi đơn thuê, tiền cọc, sản phẩm và giao dịch.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="rounded-xl bg-[#315b3d] px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            Làm mới danh sách
          </button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Tổng đơn thuê', value: orders.length },
            { label: 'Chờ xác nhận', value: waitingCount },
            { label: 'Đang thuê', value: activeCount },
            { label: 'Đã trả', value: returnedCount },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#dce7d8] bg-white p-6"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-[#315b3d]">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#dce7d8] bg-white p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã đơn, khách hàng, hợp đồng..."
              className="w-full rounded-xl border border-[#d2dfce] px-4 py-3 outline-none focus:border-[#72946e]"
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-[#d2dfce] bg-white px-4 py-3"
            >
              {[
                'Tất cả',
                'Chờ xác nhận',
                'Đã xác nhận',
                'Đang thuê',
                'Chờ trả cây',
                'Đang tranh chấp',
                'Đã trả',
                'Đã hủy',
              ].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
              {error}
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-[#eef4e9] text-[#315b3d]">
                <tr>
                  <th className="p-4">Mã đơn</th>
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Thời gian thuê</th>
                  <th className="p-4">Gói thuê</th>
                  <th className="p-4">Số cây</th>
                  <th className="p-4">Tiền thuê</th>
                  <th className="p-4">Tiền cọc</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.MaDT}
                    className="border-b border-[#edf1e9] hover:bg-[#fafcf8]"
                  >
                    <td className="p-4 font-semibold">
                      #{order.MaDT}
                    </td>

                    <td className="p-4">
                      <p className="font-medium">
                        {order.TenKhachHang}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {order.SDT}
                      </p>
                    </td>

                    <td className="p-4">
                      {date(order.NgayBatDau)}
                      <span className="mx-2">→</span>
                      {date(order.NgayKetThuc)}
                    </td>

                    <td className="p-4">{order.GoiThue}</td>
                    <td className="p-4">{order.SoLuongCay}</td>
                    <td className="p-4">{money(order.TienThue)}</td>

                    <td className="p-4">
                      <p>{money(order.TienCocDuKien)}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Đã thu: {money(order.TienCocDaThu)}
                      </p>
                      <p className="mt-1 text-xs">
                        {order.TrangThaiCoc}
                      </p>
                    </td>

                    <td className="p-4">
                      <Status value={order.TrangThai} />
                    </td>

                    <td className="p-4">
                      
<Link
  href={`/admin/rentals-detail?id=${order.MaDT}`}
  className="inline-flex rounded-lg bg-[#315b3d] px-4 py-2 font-medium text-white"
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
            <p className="py-10 text-center text-gray-500">
              Đang tải đơn thuê...
            </p>
          )}

          {!loading && filtered.length === 0 && (
            <p className="py-10 text-center text-gray-500">
              Không tìm thấy đơn thuê phù hợp.
            </p>
          )}
        </div>

      </div>
    </main>
  );
}


export default function AdminRentalsPage() {
  return (
    <RoleGuard allowedRoles={['Quản trị viên']}>
      <Head>
        <title>Quản lý đơn thuê | NHAI&apos;s Green</title>
      </Head>

      <Header />

      <div className="flex min-h-screen bg-[#f8faf5]">
        <RoleNavigation role="admin" />

        <div className="min-w-0 flex-1">
          <RentalManager />
        </div>
      </div>

      <Footer />
    </RoleGuard>
  );
}

