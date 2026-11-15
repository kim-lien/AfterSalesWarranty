
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { api, getUser } from '../../api/client';

type Account = {
  MaNguoiDung?: number;
  TenVaiTro?: string;
};

type Order = {
  MaDon: number;
  LoaiDon: 'Mua' | 'Thuê';
  NgayTao: string;
  TrangThai: string;
  TrangThaiThanhToan: string;
  PhuongThucThanhToan: string | null;
  NgayGiaoThucTe: string | null;
  NgayGiaoDuKien: string | null;
  GhiChu: string | null;
  PhiVanChuyen: number;
  TongTien: number;
  DaThanhToan: number;
  SoSanPham: number;
  SanPham: string;
  GoiThue: string | null;
  NgayBatDauThue: string | null;
  NgayKetThucThue: string | null;
  TrangThaiCoc: string | null;
  TrangThaiQuyetToan: string | null;
};


type Filter = 'Tất cả' | 'Mua' | 'Thuê';

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });
}

function formatDate(value: string | null) {
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
      'Đã giao',
      'Đã trả',
      'Đã thanh toán',
      'Đã xác nhận',
    ].includes(status)
  ) {
    return 'bg-green-50 text-green-700';
  }

  if (
    ['Đã hủy', 'Thất bại'].includes(status)
  ) {
    return 'bg-red-50 text-red-700';
  }

  if (
    ['Đang giao', 'Đang thuê', 'Đang chuẩn bị'].includes(
      status,
    )
  ) {
    return 'bg-blue-50 text-blue-700';
  }

  return 'bg-amber-50 text-amber-700';
}

function Status({
  value,
}: {
  value: string;
}) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
        value,
      )}`}
    >
      {value}
    </span>
  );
}

function OrderProgress({
  order,
}: {
  order: Order;
}) {
  const cancelled = order.TrangThai === 'Đã hủy';

  const steps =
    order.LoaiDon === 'Mua'
      ? [
          'Chờ xác nhận',
          'Đã xác nhận',
          'Đang chuẩn bị',
          'Đang giao',
          'Đã giao',
        ]
      : [
          'Chờ xác nhận',
          'Đã xác nhận',
          'Đang thuê',
          'Chờ trả cây',
          'Đã trả',
        ];

  const currentIndex = steps.indexOf(order.TrangThai);

  if (cancelled) {
    return (
      <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
        Đơn hàng này đã bị hủy.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h4 className="mb-4 font-semibold text-[#315b3d]">
        Tiến độ đơn hàng
      </h4>

      <div className="grid gap-3 sm:grid-cols-5">
        {steps.map((step, index) => {
          const completed = currentIndex >= index;

          return (
            <div
              key={step}
              className={`rounded-xl border p-3 text-center text-xs font-medium ${
                completed
                  ? 'border-[#b8d4ac] bg-[#ebf4e7] text-[#315b3d]'
                  : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}
            >
              <div
                className={`mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full ${
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
    </div>
  );
}

function OrderCard({
  order,
}: {
  order: Order;
}) {
  const [expanded, setExpanded] = useState(false);

  const isPurchase = order.LoaiDon === 'Mua';
  const delivered =
    order.NgayGiaoThucTe != null &&
    order.TrangThai !== 'Đã hủy';

  return (
    <article className="overflow-hidden rounded-2xl border border-[#dce7d8] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#edf1e9] bg-[#fbfcf9] px-6 py-5">
        <div>
          <p className="text-lg font-bold text-[#315b3d]">
  {isPurchase ? 'Đơn mua cây' : 'Đơn thuê cây'}
</p>

          <p className="mt-1 text-sm text-gray-500">
            Đặt ngày {formatDate(order.NgayTao)}
          </p>
        </div>

        <Status value={order.TrangThai} />
      </div>

      <div className="space-y-5 p-6">
        <div>
          <p className="text-sm text-gray-500">
            Sản phẩm
          </p>

          <p className="mt-1 font-semibold">
            {order.SanPham || 'Chưa có chi tiết sản phẩm'}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Số lượng cây: {order.SoSanPham}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="mb-2 text-sm text-gray-500">
              Trạng thái thanh toán
            </p>
            <Status value={order.TrangThaiThanhToan} />
          </div>

          <div>
            <p className="mb-2 text-sm text-gray-500">
              Phương thức thanh toán
            </p>
            <p className="font-semibold">
              {order.PhuongThucThanhToan || 'Chưa xác định'}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm text-gray-500">
              Tổng tiền dự kiến
            </p>
            <p className="text-xl font-bold text-[#315b3d]">
              {formatMoney(order.TongTien)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-5">
          <p className="text-sm text-gray-500">
            Đã ghi nhận thanh toán:{' '}
            <strong className="text-[#315b3d]">
              {formatMoney(order.DaThanhToan)}
            </strong>
          </p>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded-xl border border-[#b9d0b4] px-5 py-2.5 text-sm font-semibold text-[#315b3d] hover:bg-[#f2f7ef]"
          >
            {expanded ? 'Thu gọn' : 'Xem chi tiết và tiến độ'}
          </button>
        </div>

        {expanded && (
          <div className="border-t pt-5">
            <OrderProgress order={order} />

            <div className="mt-7 grid gap-5 rounded-xl bg-[#f7faf4] p-5 text-sm sm:grid-cols-2">
              <div>
                <p className="text-gray-500">
                  Ngày giao dự kiến
                </p>

                <p className="mt-1 font-semibold">
                  {formatDate(order.NgayGiaoDuKien)}
                </p>
              </div>

              <div>
                <p className="text-gray-500">
                  Ngày giao thực tế
                </p>

                <p className="mt-1 font-semibold">
                  {formatDate(order.NgayGiaoThucTe)}
                </p>
              </div>

              {!isPurchase && (
                <>
                  <div>
                    <p className="text-gray-500">
                      Gói thuê
                    </p>
                    <p className="mt-1 font-semibold">
                      {order.GoiThue}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Trạng thái tiền cọc
                    </p>
                    <p className="mt-1 font-semibold">
                      {order.TrangThaiCoc}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Ngày bắt đầu thuê
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatDate(order.NgayBatDauThue)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Ngày kết thúc thuê
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatDate(order.NgayKetThucThue)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Quyết toán
                    </p>
                    <p className="mt-1 font-semibold">
                      {order.TrangThaiQuyetToan}
                    </p>
                  </div>
                </>
              )}

              {order.GhiChu && (
                <div className="sm:col-span-2">
                  <p className="text-gray-500">
                    Ghi chú
                  </p>
                  <p className="mt-1">
                    {order.GhiChu}
                  </p>
                </div>
              )}
            </div>

            {delivered ? (
              <div className="mt-5 rounded-xl border border-[#cbdcbe] bg-[#f1f7ed] p-5">
                <p className="font-semibold text-[#315b3d]">
                  Đơn hàng đã có thông tin giao cây.
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  
                </p>

                <Link
                  href="/customer/after-sales"
                  className="mt-4 inline-block rounded-xl bg-[#315b3d] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Yêu cầu bảo hành / hậu mãi
                </Link>
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-[#fff8e8] p-5 text-sm text-[#86611c]">
                Đơn hàng chưa ghi nhận giao cây thành công.
                Bạn có thể tiếp tục theo dõi tại đây.
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>('Tất cả');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCustomer, setIsCustomer] = useState(false);

  async function loadOrders() {
    setLoading(true);
    setError('');

    try {
      const result = await api<{
        success: boolean;
        data: Order[];
      }>('/checkout/my-orders');

      setOrders(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải danh sách đơn hàng',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const current = getUser() as Account | null;

    if (
      current?.MaNguoiDung &&
      current.TenVaiTro === 'Khách hàng'
    ) {
      setIsCustomer(true);
      void loadOrders();
    } else {
      setLoading(false);
    }
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'Tất cả') return orders;

    return orders.filter(
      (item) => item.LoaiDon === filter,
    );
  }, [orders, filter]);

  return (
    <>
      <Head>
        <title>Đơn hàng của tôi | NHAI&apos;s Green</title>
      </Head>

      <div className="min-h-screen bg-[#f8faf5] text-[#294530]">
        <Header />

        <main className="mx-auto max-w-6xl px-5 py-12">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
            <div>
              <Link
                href="/"
                className="text-sm text-[#688068]"
              >
                Trang chủ
              </Link>

              <h1 className="mt-4 text-3xl font-bold text-[#315b3d]">
                Đơn hàng của tôi
              </h1>

              <p className="mt-3 text-gray-500">
                Theo dõi các đơn mua và thuê cây đã đặt tại
                NHAI&apos;s Green.
              </p>
            </div>
            

            {isCustomer && (
              <button
                type="button"
                onClick={() => void loadOrders()}
                disabled={loading}
                className="rounded-xl border border-[#b9d0b4] bg-white px-5 py-3 font-semibold text-[#315b3d] disabled:opacity-50"
              >
                Làm mới trạng thái
              </button>
            )}
          </div>

          {!isCustomer && !loading ? (
            <div className="rounded-2xl bg-white p-10 text-center">
              <p>
                Vui lòng đăng nhập bằng tài khoản khách hàng.
              </p>

              <Link
                href="/login"
                className="mt-5 inline-block rounded-xl bg-[#315b3d] px-6 py-3 font-semibold text-white"
              >
                Đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap gap-3">
                {(['Tất cả', 'Mua', 'Thuê'] as Filter[]).map(
                  (option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFilter(option)}
                      className={`rounded-full px-5 py-2.5 text-sm font-semibold ${
                        filter === option
                          ? 'bg-[#315b3d] text-white'
                          : 'border border-[#cbdcc6] bg-white text-[#315b3d]'
                      }`}
                    >
                      {option === 'Tất cả'
                        ? 'Tất cả đơn hàng'
                        : `Đơn ${option.toLowerCase()}`}
                    </button>
                  ),
                )}
              </div>

              {error && (
                <p
                  role="alert"
                  className="mb-6 rounded-xl bg-red-50 p-5 text-red-700"
                >
                  {error}
                </p>
              )}

              {loading ? (
                <p className="rounded-2xl bg-white p-10 text-center">
                  Đang tải đơn hàng...
                </p>
              ) : error ? null : filtered.length === 0 ? (
                <div className="rounded-2xl bg-white p-12 text-center">
                  <h2 className="text-xl font-semibold">
                    Chưa có đơn hàng
                  </h2>

                  <p className="mt-3 text-gray-500">
                    Các đơn đã đặt sẽ xuất hiện tại đây.
                  </p>

                  <Link
                    href="/products"
                    className="mt-6 inline-block rounded-xl bg-[#315b3d] px-6 py-3 text-white"
                  >
                    Xem sản phẩm
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm text-gray-500">
                    Có {filtered.length} đơn hàng.
                  </p>

                  {filtered.map((order) => (
                    <OrderCard
                      key={`${order.LoaiDon}-${order.MaDon}`}
                      order={order}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
