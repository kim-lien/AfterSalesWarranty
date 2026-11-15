
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getUser } from '../../api/client';

type OrderConfirmation = {
  maDH: number | null;
  maDTs: number[];
  trangThai: string;
  trangThaiThanhToan: string;
  paymentMethod: string;
};

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const user = getUser() as { MaNguoiDung?: number } | null;

    if (user?.MaNguoiDung) {
      const raw = sessionStorage.getItem(
        `nhai-last-order-${user.MaNguoiDung}`,
      );

      if (raw) {
        try {
          setOrder(JSON.parse(raw));
        } catch {
          setOrder(null);
        }
      }
    }

    setLoaded(true);
  }, []);

  return (
    <>
      <Head>
        <title>Xác nhận đơn hàng | NHAI&apos;s Green</title>
      </Head>

      <div className="min-h-screen bg-[#f8faf5] text-[#294530]">
        <Header />

        <main className="mx-auto max-w-3xl px-5 py-20">
          {!loaded ? (
            <p>Đang tải thông tin...</p>
          ) : !order ? (
            <div className="rounded-2xl bg-white p-10 text-center">
              <h1 className="text-2xl font-semibold">
                Không có thông tin đơn vừa đặt
              </h1>

              <Link
                href="/products"
                className="mt-7 inline-block rounded-full bg-[#315b3d] px-7 py-3 text-white"
              >
                Xem sản phẩm
              </Link>
            </div>
          ) : (
            <div className="rounded-3xl border border-[#dce7d8] bg-white p-10 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e6f2e1] text-4xl text-[#315b3d]">
                ✓
              </div>

              <h1 className="mt-7 text-3xl font-semibold">
                Đã tiếp nhận đơn hàng!
              </h1>

              <p className="mt-5 leading-8 text-gray-600">
                NHAI&apos;s Green đã ghi nhận yêu cầu đặt hàng
                của bạn trên hệ thống.
              </p>

              {order.maDH !== null && (
                <p className="mt-5 font-semibold">
                  Đơn mua: #{order.maDH}
                </p>
              )}

              {order.maDTs?.length > 0 && (
                <p className="mt-3 font-semibold">
                  Đơn thuê: {order.maDTs.map((id) => `#${id}`).join(', ')}
                </p>
              )}

              <div className="mt-8 rounded-2xl bg-[#f1f6ee] p-6 text-left text-sm leading-8">
                <p>
                  <strong>Trạng thái:</strong> {order.trangThai}
                </p>

                <p>
                  <strong>Thanh toán:</strong>{' '}
                  {order.trangThaiThanhToan}
                </p>

                <p>
                  <strong>Phương thức:</strong>{' '}
                  {order.paymentMethod}
                </p>
              </div>

              {order.paymentMethod === 'Chuyển khoản' ? (
                <p className="mt-6 text-sm leading-7 text-[#6b795f]">
                  Đơn đang chờ hướng dẫn và xác minh chuyển khoản.
                  Không chuyển tiền vào tài khoản chưa được cửa hàng
                  xác nhận chính thức.
                </p>
              ) : (
                <p className="mt-6 text-sm leading-7 text-[#6b795f]">
                  Đơn đang chờ Admin hoặc nhân viên xác nhận.
                  Thanh toán sẽ được xử lý theo quy trình giao nhận.
                </p>
              )}

              <div className="mt-9 flex flex-wrap justify-center gap-4">
                <Link
                  href="/"
                  className="rounded-full bg-[#315b3d] px-7 py-3 font-semibold text-white"
                >
                  Về trang chủ
                </Link>

                <Link
                  href="/products"
                  className="rounded-full border border-[#b7cbb0] px-7 py-3 font-semibold"
                >
                  Tiếp tục mua sắm
                </Link>

<Link
  href="/customer/my-orders"
  className="inline-flex items-center justify-center rounded-full bg-[#315b3d] px-7 py-3.5 font-semibold text-white hover:bg-[#25472f]"
>
  Xem đơn hàng của tôi
</Link>

              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
