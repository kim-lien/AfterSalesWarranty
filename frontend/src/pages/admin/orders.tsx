
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import RoleGuard from '../../components/RoleGuard';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RoleNavigation from '../../components/RoleNavigation';

type Order = {
  MaDH: number;
  TenKhachHang: string;
  TrangThai: string;
  TrangThaiThanhToan: string;
  NgayDat: string;
  NgayGiaoThucTe: string | null;
};

const steps = [
  'Chờ xác nhận',
  'Đã xác nhận',
  'Đang chuẩn bị',
  'Đang giao',
  'Đã giao',
];

export function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadOrders() {
    try {
      setError('');
      setOrders(await api<Order[]>('/orders'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function advance(order: Order) {
    const index = steps.indexOf(order.TrangThai);
    const next = steps[index + 1];

    if (!next) return;

    if (
      !window.confirm(
        `Xác nhận chuyển đơn #${order.MaDH} sang "${next}"?`,
      )
    ) {
      return;
    }

    setBusyId(order.MaDH);
    setError('');
    setNotice('');

    try {
      await api(`/orders/${order.MaDH}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ trangThai: next }),
      });
      setNotice(`Đã cập nhật đơn #${order.MaDH}.`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <Head>
        <title>Quản lý đơn hàng | NHAI&apos;s Green</title>
      </Head>

      <main className="min-h-screen bg-[#f5f7f0] p-5 text-[#2c4230]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#315b3d]">
                NHAI&apos;s Green
              </h1>
              <p className="mt-2 text-gray-500">
                Quản lý đơn mua và tiến độ giao cây
              </p>
            </div>
            <Link
              href="/admin/support"
              className="rounded-lg border border-[#cbdac7] bg-white px-5 py-3"
            >
              Quay lại hậu mãi
            </Link>
          </div>

          {error && (
            <p className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </p>
          )}

          {notice && (
            <p className="mb-5 rounded-lg bg-green-50 p-4 text-green-800">
              {notice}
            </p>
          )}

          <div className="overflow-x-auto rounded-2xl border border-[#e1e8dd] bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#edf3e9]">
                <tr>
                  <th className="p-4">Mã đơn</th>
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Thanh toán</th>
                  <th className="p-4">Ngày giao</th>
                  <th className="p-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const index = steps.indexOf(order.TrangThai);
                  const next = steps[index + 1];

                  return (
                    <tr key={order.MaDH} className="border-t">
                      <td className="p-4 font-semibold">#{order.MaDH}</td>
                      <td className="p-4">{order.TenKhachHang}</td>
                      <td className="p-4">{order.TrangThai}</td>
                      <td className="p-4">{order.TrangThaiThanhToan}</td>
                      <td className="p-4">
                        {order.NgayGiaoThucTe
                          ? new Date(order.NgayGiaoThucTe).toLocaleString('vi-VN')
                          : 'Chưa giao'}
                      </td>
                      <td className="p-4">
                        {next ? (
                          <button
                            type="button"
                            disabled={busyId !== null}
                            onClick={() => advance(order)}
                            className="rounded-lg bg-[#315b3d] px-4 py-2 text-white disabled:opacity-50"
                          >
                            {busyId === order.MaDH
                              ? 'Đang lưu...'
                              : `Chuyển sang ${next}`}
                          </button>
                        ) : (
                          <span className="text-gray-500">
                            {order.TrangThai === 'Đã giao'
                              ? 'Hoàn thành'
                              : 'Không có thao tác'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!loading && orders.length === 0 && (
              <p className="p-10 text-center text-gray-500">
                Chưa có đơn mua.
              </p>
            )}

            {loading && (
              <p className="p-10 text-center text-gray-500">
                Đang tải đơn hàng...
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <RoleGuard allowedRoles={['Quản trị viên']}>
      <Header />

      <div className="flex min-h-screen bg-[#f5f7f0]">
        <RoleNavigation role="admin" />

        <div className="min-w-0 flex-1">
          <OrderManager />
        </div>
      </div>

      <Footer />
    </RoleGuard>
  );
}


