
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getUser } from '../../api/client';
import {
  CartItem,
  cartItemDeposit,
  cartItemTotal,
  formatMoney,
  getCart,
  removeFromCart,
  rentalDays,
  updateCartQuantity,
} from '../../lib/cart';

type Account = {
  MaNguoiDung?: number;
  TenVaiTro?: string;
};

export default function CartPage() {
  const [user, setUser] = useState<Account | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = getUser() as Account | null;
    setUser(current);

    if (current?.MaNguoiDung) {
      setItems(getCart(current.MaNguoiDung));
    }

    setReady(true);
  }, []);

  const totals = useMemo(() => {
    const result = {
      purchase: 0,
      rental: 0,
      deposit: 0,
    };

    for (const item of items) {
      if (item.loaiGiaoDich === 'Mua') {
        result.purchase += cartItemTotal(item);
      } else {
        result.rental += cartItemTotal(item);
        result.deposit += cartItemDeposit(item);
      }
    }

    return result;
  }, [items]);

  function changeQuantity(item: CartItem, quantity: number) {
    if (!user?.MaNguoiDung) return;

    updateCartQuantity(user.MaNguoiDung, item.id, quantity);
    setItems(getCart(user.MaNguoiDung));
  }

  function removeItem(item: CartItem) {
    if (!user?.MaNguoiDung) return;

    removeFromCart(user.MaNguoiDung, item.id);
    setItems(getCart(user.MaNguoiDung));
  }

  const allowed = user?.TenVaiTro === 'Khách hàng';

  return (
    <>
      <Head>
        <title>Giỏ hàng | NHAI&apos;s Green</title>
      </Head>

      <div className="min-h-screen bg-[#f8faf5] text-[#294530]">
        <Header />

        <main className="mx-auto max-w-7xl px-5 py-12">
          <div className="mb-9">
            <Link href="/products" className="text-sm text-[#688068]">
              ← Tiếp tục mua sắm
            </Link>
            
<div className="mt-5 flex flex-wrap items-center justify-between gap-4">
  <h1 className="text-3xl font-semibold">
    Giỏ hàng của bạn
  </h1>

 

  <Link
    href="/customer/my-orders"
    className="inline-flex items-center justify-center rounded-xl border border-[#315b3d] bg-white px-5 py-3 font-semibold text-[#315b3d] transition hover:bg-[#eef5ea]"
  >
    Đơn hàng của tôi
  </Link>
</div>

            <p className="mt-3 text-gray-500">
              Sản phẩm mua và thuê được tách chi phí rõ ràng.
            </p>
          </div>

          {!ready ? (
            <p>Đang tải giỏ hàng...</p>
          ) : !allowed ? (
            <div className="rounded-2xl bg-white p-10 text-center">
              <p className="text-lg font-semibold">
                Vui lòng đăng nhập bằng tài khoản khách hàng.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block rounded-full bg-[#315b3d] px-6 py-3 text-white"
              >
                Đăng nhập
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center">
              <h2 className="text-xl font-semibold">
                Giỏ hàng đang trống
              </h2>
              <p className="mt-3 text-gray-500">
                Hãy chọn cây mà bạn yêu thích.
              </p>
              <Link
                href="/products"
                className="mt-6 inline-block rounded-full bg-[#315b3d] px-7 py-3 text-white"
              >
                Xem sản phẩm
              </Link>
            </div>
          ) : (
            <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
              <div className="space-y-5">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="grid gap-5 rounded-2xl border border-[#e1e9dc] bg-white p-5 sm:grid-cols-[120px_1fr]"
                  >
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#edf3e9]">
                      {item.hinhAnh ? (
                        <img
                          src={item.hinhAnh}
                          alt={item.tenSP}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm text-gray-500">
                          Chưa có ảnh
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/products/${item.maSP}`}
                            className="text-lg font-semibold hover:underline"
                          >
                            {item.tenSP}
                          </Link>
                          <p className="mt-2 text-sm text-[#78906f]">
                            {item.loaiGiaoDich === 'Mua'
                              ? 'Mua cây'
                              : 'Thuê cây'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Xóa
                        </button>
                      </div>

                      {item.loaiGiaoDich === 'Thuê' && (
                        <div className="mt-3 space-y-1 text-sm text-gray-600">
                          <p>
                            Ngày thuê: {item.ngayBatDauThue}
                            {' → '}
                            {item.ngayKetThucThue}
                          </p>
                          <p>
                            Thời gian: {rentalDays(item)} ngày
                          </p>
                          <p>Gói: {item.goiThue}</p>
                        </div>
                      )}

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                        <div className="flex items-center rounded-lg border">
                          <button
                            type="button"
                            onClick={() =>
                              changeQuantity(item, item.soLuong - 1)
                            }
                            disabled={item.soLuong <= 1}
                            className="px-4 py-2 disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="px-3 font-medium">
                            {item.soLuong}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              changeQuantity(item, item.soLuong + 1)
                            }
                            disabled={item.soLuong >= 99}
                            className="px-4 py-2 disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-[#315b3d]">
                            {formatMoney(cartItemTotal(item))}
                          </p>
                          {item.loaiGiaoDich === 'Thuê' && (
                            <p className="mt-1 text-xs text-gray-500">
                              Cọc dự kiến:{' '}
                              {formatMoney(cartItemDeposit(item))}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="sticky top-28 rounded-2xl border border-[#dce6d7] bg-white p-6">
                <h2 className="text-xl font-semibold">
                  Tóm tắt giỏ hàng
                </h2>

                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span>Tiền mua cây</span>
                    <span>{formatMoney(totals.purchase)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiền thuê cây</span>
                    <span>{formatMoney(totals.rental)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiền cọc dự kiến</span>
                    <span>{formatMoney(totals.deposit)}</span>
                  </div>

                  <div className="flex justify-between border-t pt-5 text-lg font-bold">
                    <span>Tạm tính</span>
                    <span className="text-[#315b3d]">
                      {formatMoney(
                        totals.purchase + totals.rental + totals.deposit,
                      )}
                    </span>
                  </div>
                </div>

                <p className="mt-5 text-xs leading-6 text-gray-500">
                  Chưa bao gồm phí giao hàng, ưu đãi, phí dịch vụ
                  và các điều chỉnh theo chính sách thuê.
                </p>



                <Link
  href="/customer/checkout"
  className="mt-5 block w-full rounded-xl bg-[#315b3d] px-5 py-3 text-center font-semibold text-white hover:bg-[#25472f]"
>
  Tiếp tục đến thông tin giao nhận
</Link>

                <Link
                  href="/products"
                  className="mt-4 block text-center text-sm font-medium text-[#315b3d] hover:underline"
                >
                  Tiếp tục chọn cây
                </Link>
              </aside>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
