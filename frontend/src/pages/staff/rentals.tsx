
import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RoleGuard from '../../components/RoleGuard';
import RoleNavigation from '../../components/RoleNavigation';

type Rental = {
  MaDT: number;
  MaKH: number;
  TenKhachHang: string;
  MaHopDong: string | null;
  NgayTao: string;
  NgayBatDau: string;
  NgayKetThuc: string;
  GoiThue: string;
  TrangThai: string;
  TrangThaiCoc: string;
  TienCocDuKien: number;
  TienCocDaThu: number;
  SoLuongCay: number;
  TienThue: number;
  SDT: string | null;
};

type RentalResponse = {
  success: boolean;
  total: number;
  data: Rental[];
};

const statuses = [
  'Tất cả',
  'Chờ xác nhận',
  'Đã xác nhận',
  'Đang thuê',
  'Chờ trả cây',
  'Đang tranh chấp',
  'Đã trả',
  'Đã hủy',
];

function formatMoney(value: number | null | undefined) {
  return Number(value || 0).toLocaleString('vi-VN') + ' đ';
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Chưa có';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Chưa có';
  }

  return date.toLocaleDateString('vi-VN');
}

function statusStyle(status: string) {
  if (['Đã trả', 'Đã xác nhận'].includes(status)) {
    return 'bg-green-100 text-green-800';
  }

  if (status === 'Đang thuê') {
    return 'bg-blue-100 text-blue-800';
  }

  if (status === 'Chờ xác nhận') {
    return 'bg-amber-100 text-amber-800';
  }

  if (status === 'Đang tranh chấp') {
    return 'bg-red-100 text-red-700';
  }

  return 'bg-gray-100 text-gray-700';
}

export default function StaffRentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('Tất cả');

  const loadRentals = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api<RentalResponse>('/rentals');

      setRentals(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải danh sách đơn thuê.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRentals();
  }, [loadRentals]);

  const filteredRentals = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return rentals.filter((rental) => {
      const matchStatus =
        status === 'Tất cả' ||
        rental.TrangThai === status;

      const matchSearch =
        !search ||
        String(rental.MaDT).includes(search) ||
        (rental.TenKhachHang || '')
          .toLowerCase()
          .includes(search) ||
        (rental.MaHopDong || '')
          .toLowerCase()
          .includes(search);

      return matchStatus && matchSearch;
    });
  }, [rentals, keyword, status]);

  const totalPending = rentals.filter(
    (item) => item.TrangThai === 'Chờ xác nhận',
  ).length;

  const totalRenting = rentals.filter(
    (item) => item.TrangThai === 'Đang thuê',
  ).length;

  const totalReturning = rentals.filter(
    (item) => item.TrangThai === 'Chờ trả cây',
  ).length;

  return (
    <RoleGuard allowedRoles={['Nhân viên']}>
      <Head>
        <title>Xử lý đơn thuê | NHAI&apos;s Green</title>
      </Head>

      <Header />

      <div className="flex min-h-screen items-stretch bg-[#f8faf5]">
        <RoleNavigation role="staff" />

        <main className="min-w-0 flex-1 px-5 py-8 text-[#294530]">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#81977b]">
                  NHAI&apos;s Green
                </p>

                <h1 className="mt-3 text-3xl font-bold text-[#315b3d]">
                  Xử lý đơn thuê
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  Theo dõi và xử lý các đơn thuê cây được phân công.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadRentals()}
                disabled={loading}
                className="rounded-xl border border-[#c8d9c2] bg-white px-5 py-3 font-semibold text-[#315b3d] hover:bg-[#edf4e9] disabled:opacity-50"
              >
                Làm mới danh sách
              </button>
            </div>

            <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: 'Tổng đơn thuê',
                  count: rentals.length,
                },
                {
                  title: 'Chờ xác nhận',
                  count: totalPending,
                },
                {
                  title: 'Đang thuê',
                  count: totalRenting,
                },
                {
                  title: 'Chờ trả cây',
                  count: totalReturning,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[#dce7d8] bg-white p-5"
                >
                  <p className="text-sm text-gray-500">
                    {item.title}
                  </p>

                  <p className="mt-3 text-3xl font-bold text-[#315b3d]">
                    {item.count}
                  </p>
                </div>
              ))}
            </div>

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
              >
                {error}
              </div>
            )}

            <section className="rounded-2xl border border-[#dce7d8] bg-white p-5">
              <div className="mb-5 flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) =>
                    setKeyword(event.target.value)
                  }
                  placeholder="Tìm mã đơn, khách hàng, hợp đồng..."
                  className="min-w-0 flex-1 rounded-xl border border-[#d6e2d1] px-4 py-3 outline-none focus:border-[#315b3d]"
                />

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                  className="rounded-xl border border-[#d6e2d1] bg-white px-4 py-3 outline-none focus:border-[#315b3d]"
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-[#edf3e9] text-[#315b3d]">
                    <tr>
                      <th className="p-4">Mã đơn</th>
                      <th className="p-4">Khách hàng</th>
                      <th className="p-4">Thời gian thuê</th>
                      <th className="p-4">Gói thuê</th>
                      <th className="p-4">Số cây</th>
                      <th className="p-4">Tiền cọc</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRentals.map((rental) => (
                      <tr
                        key={rental.MaDT}
                        className="border-t border-[#e5ece1] hover:bg-[#f9fbf7]"
                      >
                        <td className="p-4">
                          <p className="font-bold text-[#315b3d]">
                            #{rental.MaDT}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {formatDate(rental.NgayTao)}
                          </p>
                        </td>

                        <td className="p-4">
                          <p className="font-semibold">
                            {rental.TenKhachHang}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {rental.SDT || 'Chưa có số điện thoại'}
                          </p>
                        </td>

                        <td className="p-4">
                          <p>{formatDate(rental.NgayBatDau)}</p>
                          <p className="mt-1 text-gray-500">
                            đến {formatDate(rental.NgayKetThuc)}
                          </p>
                        </td>

                        <td className="p-4">
                          {rental.GoiThue}
                        </td>

                        <td className="p-4">
                          {rental.SoLuongCay}
                        </td>

                        <td className="p-4">
                          <p className="font-semibold">
                            {formatMoney(rental.TienCocDuKien)}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Đã thu: {formatMoney(rental.TienCocDaThu)}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {rental.TrangThaiCoc}
                          </p>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-block rounded-full px-3 py-2 text-xs font-semibold ${statusStyle(rental.TrangThai)}`}
                          >
                            {rental.TrangThai}
                          </span>
                        </td>

                        <td className="p-4">
                          <Link
                            href={`/staff/rentals-detail?id=${rental.MaDT}`}
                            className="inline-block whitespace-nowrap rounded-lg bg-[#315b3d] px-4 py-2 font-semibold text-white hover:bg-[#26472f]"
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
                  Đang tải danh sách đơn thuê...
                </p>
              )}

              {!loading && filteredRentals.length === 0 && (
                <div className="py-12 text-center">
                  <h2 className="text-lg font-semibold text-[#315b3d]">
                    Chưa có đơn thuê
                  </h2>

                  <p className="mt-2 text-gray-500">
                    Không có đơn thuê phù hợp hoặc chưa được phân công.
                  </p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </RoleGuard>
  );
}
