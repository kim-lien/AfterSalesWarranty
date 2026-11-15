
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getUser } from '../../api/client';
import { api } from '../../api/client';
import { getCart, saveCart } from '../../lib/cart';
import {
  CartItem,
  cartItemDeposit,
  cartItemTotal,
  formatMoney,
} from '../../lib/cart';

type Account = {
  MaNguoiDung?: number;
  TenVaiTro?: string;
};

type Delivery = {
  tenNguoiNhan: string;
  soDienThoai: string;
  tinhThanh: string;
  quanHuyen: string;
  phuongXa: string;
  diaChiChiTiet: string;
  hinhThucNhan: string;
  ghiChu: string;
  phuongThucThanhToan?: 'Chuyển khoản' | 'Thanh toán khi nhận';
};

type CheckoutData = {
  userId: number;
  maDiaChi: number;
  cart: CartItem[];
  delivery: Delivery;
  savedAt: number;
};

export default function PaymentPage() {
  const router = useRouter();

  const [data, setData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<'Chuyển khoản' | 'Thanh toán khi nhận hàng'>(
    'Chuyển khoản',
  );

  const [message, setMessage] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    const account = getUser() as Account | null;

    if (
      !account?.MaNguoiDung ||
      account.TenVaiTro !== 'Khách hàng'
    ) {
      router.replace('/login');
      return;
    }

    const raw = sessionStorage.getItem(
      `nhai-checkout-${account.MaNguoiDung}`,
    );

    if (!raw) {
      router.replace('/customer/checkout');
      return;
    }

    try {
      const parsed = JSON.parse(raw) as CheckoutData;

      if (
        parsed.userId !== account.MaNguoiDung ||
        !Array.isArray(parsed.cart) ||
        parsed.cart.length === 0 ||
        !parsed.delivery?.tenNguoiNhan ||
        !parsed.delivery?.soDienThoai
      ) {
        router.replace('/customer/checkout');
        return;
      }

      setData(parsed);

setMethod(
  parsed.delivery.phuongThucThanhToan === 'Thanh toán khi nhận'
    ? 'Thanh toán khi nhận hàng'
    : 'Chuyển khoản',
);
    } catch {
      router.replace('/customer/checkout');
      return;
    }

    setLoading(false);
  }, [router]);

  const totals = useMemo(() => {
    return (data?.cart ?? []).reduce(
      (result, item) => {
        if (item.loaiGiaoDich === 'Mua') {
          result.purchase += cartItemTotal(item);
        } else {
          result.rental += cartItemTotal(item);
          result.deposit += cartItemDeposit(item);
        }

        return result;
      },
      { purchase: 0, rental: 0, deposit: 0 },
    );
  }, [data]);

  const total =
    totals.purchase + totals.rental + totals.deposit;

  const hasRental = data?.cart.some(
    (item) => item.loaiGiaoDich === 'Thuê',
  );
  
async function handlePlaceOrder() {
  if (!data || placingOrder) return;

  const account = getUser() as Account | null;

  if (
    !account?.MaNguoiDung ||
    account.MaNguoiDung !== data.userId ||
    account.TenVaiTro !== 'Khách hàng'
  ) {
    setMessage('Phiên đăng nhập không hợp lệ.');
    return;
  }


const premiumRentals = data.cart.filter(
  (item) =>
    item.loaiGiaoDich === 'Thuê' &&
    item.goiThue === 'Cao cấp',
);

for (const item of premiumRentals) {
  if (!item.ngayBatDauThue || !item.ngayKetThucThue) {
    setMessage(`Vui lòng chọn ngày thuê cho ${item.tenSP}.`);
    return;
  }

  const start = new Date(`${item.ngayBatDauThue}T00:00:00Z`);
  const end = new Date(`${item.ngayKetThucThue}T00:00:00Z`);

  const days =
    (end.getTime() - start.getTime()) / 86400000;

  if (!Number.isFinite(days) || days < 15) {
    setMessage(
      `Gói Cao cấp của ${item.tenSP} yêu cầu thời gian thuê tối thiểu 15 ngày.`,
    );
    return;
  }
}


  const currentCart = getCart(account.MaNguoiDung);

  if (
    JSON.stringify(currentCart) !== JSON.stringify(data.cart)
  ) {
    setMessage(
      'Giỏ hàng đã thay đổi. Vui lòng quay lại trang thông tin giao nhận để cập nhật.',
    );
    return;
  }

  setPlacingOrder(true);
  setMessage('');

  try {
    const result = await api<{
      success: boolean;
      message: string;
      data: {
        maDH: number | null;
        maDTs: number[];
        trangThai: string;
        trangThaiThanhToan: string;
      };
    }>('/checkout/place-order', {
      method: 'POST',
      body: JSON.stringify({
        maDiaChi: data.maDiaChi,
        items: data.cart.map((item) => ({
          maSP: item.maSP,
          loaiGiaoDich: item.loaiGiaoDich,
          soLuong: item.soLuong,
          ngayBatDauThue: item.ngayBatDauThue,
          ngayKetThucThue: item.ngayKetThucThue,
          goiThue: item.goiThue,
        })),
        delivery: data.delivery,
        paymentMethod: method,
      }),
    });

    if (!result.success) {
      throw new Error(result.message || 'Đặt hàng thất bại');
    }

    sessionStorage.setItem(
      `nhai-last-order-${account.MaNguoiDung}`,
      JSON.stringify({
        ...result.data,
        paymentMethod: method,
      }),
    );

    sessionStorage.removeItem(
      `nhai-checkout-${account.MaNguoiDung}`,
    );

    saveCart(account.MaNguoiDung, []);

    await router.replace('/customer/order-confirmation');
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : 'Không thể đặt hàng. Vui lòng thử lại.',
    );
  } finally {
    setPlacingOrder(false);
  }
}


  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8faf5] p-10 text-center">
        Đang kiểm tra thông tin thanh toán...
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <Head>
        <title>Phương thức thanh toán | NHAI&apos;s Green</title>
      </Head>

      <div className="min-h-screen bg-[#f8faf5] text-[#294530]">
        <Header />

        <main className="mx-auto max-w-7xl px-5 py-12">
          <nav className="mb-8 flex flex-wrap gap-3 text-sm text-gray-500">
            <Link href="/customer/cart">Giỏ hàng</Link>
            <span>›</span>
            <Link href="/customer/checkout">
              Thông tin giao nhận
            </Link>
            <span>›</span>
            <span className="font-semibold text-[#315b3d]">
              Phương thức thanh toán
            </span>
          </nav>

          <h1 className="mb-8 text-3xl font-semibold">
            Phương thức thanh toán
          </h1>

          <div className="grid items-start gap-8 lg:grid-cols-[1fr_420px]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-[#dce7d8] bg-white p-7">
                <h2 className="text-xl font-semibold">
                  Thông tin giao nhận
                </h2>

                <div className="mt-5 space-y-3 text-sm leading-7">
                  <p>
                    <strong>Người nhận:</strong>{' '}
                    {data.delivery.tenNguoiNhan}
                  </p>

                  <p>
                    <strong>Điện thoại:</strong>{' '}
                    {data.delivery.soDienThoai}
                  </p>

                  <p>
                    <strong>Hình thức nhận:</strong>{' '}
                    {data.delivery.hinhThucNhan}
                  </p>

                  {data.delivery.hinhThucNhan === 'Giao tận nơi' && (
                    <p>
                      <strong>Địa chỉ:</strong>{' '}
                      {[
                        data.delivery.diaChiChiTiet,
                        data.delivery.phuongXa,
                        data.delivery.quanHuyen,
                        data.delivery.tinhThanh,
                      ].filter(Boolean).join(', ')}
                    </p>
                  )}

                  {data.delivery.ghiChu && (
                    <p>
                      <strong>Ghi chú:</strong>{' '}
                      {data.delivery.ghiChu}
                    </p>
                  )}
                </div>

                <Link
                  href="/customer/checkout"
                  className="mt-5 inline-block text-sm font-semibold text-[#315b3d] underline"
                >
                  Chỉnh sửa thông tin
                </Link>
              </section>

              <section className="rounded-2xl border border-[#dce7d8] bg-white p-7">
                <h2 className="text-xl font-semibold">
                  Chọn phương thức thanh toán
                </h2>

                <div className="mt-6 space-y-4">
                  <label
                    className={`flex cursor-pointer items-start gap-4 rounded-xl border p-5 ${
                      method === 'Chuyển khoản'
                        ? 'border-[#315b3d] bg-[#f1f6ee]'
                        : 'border-[#dce7d8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={method === 'Chuyển khoản'}
                      onChange={() => {
                        setMethod('Chuyển khoản');
                        setMessage('');
                      }}
                      className="mt-1"
                    />

                    <div>
                      <strong>Chuyển khoản ngân hàng</strong>
                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        Thông tin tài khoản nhận tiền sẽ được cung cấp
                        qua quy trình thanh toán chính thức.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-4 rounded-xl border p-5 ${
                      method === 'Thanh toán khi nhận hàng'
                        ? 'border-[#315b3d] bg-[#f1f6ee]'
                        : 'border-[#dce7d8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={method === 'Thanh toán khi nhận hàng'}
                      onChange={() => {
                        setMethod('Thanh toán khi nhận hàng');
                        setMessage('');
                      }}
                      className="mt-1"
                    />

                    <div>
                      <strong>Thanh toán khi nhận cây</strong>
                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        Chỉ áp dụng khi đơn hàng và hình thức giao nhận
                        đáp ứng chính sách thanh toán của cửa hàng.
                      </p>
                    </div>
                  </label>
                </div>

                {hasRental && (
                  <p className="mt-5 rounded-xl bg-[#fff8e9] p-4 text-sm leading-6 text-[#886323]">
                    Giỏ hàng có sản phẩm thuê. Tiền cọc cần được
                    xác minh theo chính sách trước khi chấp nhận
                    phương thức thanh toán.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-[#dce7d8] bg-white p-7">
                <h2 className="text-xl font-semibold">
                  Xác nhận thông tin
                </h2>

                <p className="mt-4 text-sm leading-7 text-gray-600">
                  Phương thức đã chọn: <strong>{method}</strong>.
                </p>

                {message && (
                  <p
                    role="status"
                    className="mt-5 rounded-lg bg-[#eaf3e6] p-4 text-sm text-[#315b3d]"
                  >
                    {message}
                  </p>
                )}

                <div className="mt-7 flex flex-wrap gap-4">
                  <Link
                    href="/customer/checkout"
                    className="rounded-xl border border-[#b8cbb1] px-6 py-3 font-semibold"
                  >
                    Quay lại
                  </Link>

               
<button
  type="button"
  onClick={handlePlaceOrder}
  disabled={placingOrder}
  className="rounded-xl bg-[#315b3d] px-7 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
>
  {placingOrder ? 'Đang gửi đơn hàng...' : 'Đặt hàng'}
</button>

                </div>
              </section>
            </div>

            <aside className="rounded-2xl border border-[#dce7d8] bg-white p-6">
              <h2 className="text-xl font-semibold">
                Đơn hàng của bạn
              </h2>

              <div className="mt-6 space-y-5">
                {data.cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 border-b pb-5 text-sm"
                  >
                    <div>
                      <p className="font-semibold">
                        {item.tenSP}
                      </p>

                      <p className="mt-1 text-gray-500">
                        {item.loaiGiaoDich} × {item.soLuong}
                      </p>

                      {item.loaiGiaoDich === 'Thuê' && (
                        <p className="mt-2 text-xs text-gray-500">
                          {item.ngayBatDauThue}
                          {' → '}
                          {item.ngayKetThucThue}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 font-semibold">
                      {formatMoney(cartItemTotal(item))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between">
                  <span>Tiền mua cây</span>
                  <span>{formatMoney(totals.purchase)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Phí thuê</span>
                  <span>{formatMoney(totals.rental)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tiền cọc dự kiến</span>
                  <span>{formatMoney(totals.deposit)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span>Chưa xác định</span>
                </div>

                <div className="flex justify-between border-t pt-5 text-lg font-bold">
                  <span>Tạm tính</span>
                  <span className="text-[#315b3d]">
                    {formatMoney(total)}
                  </span>
                </div>
              </div>


            </aside>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
