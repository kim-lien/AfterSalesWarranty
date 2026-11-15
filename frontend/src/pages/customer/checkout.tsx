
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { api, getUser } from '../../api/client';
import { useRouter } from 'next/router';
import {
  CartItem,
  cartItemDeposit,
  cartItemTotal,
  formatMoney,
  getCart,
} from '../../lib/cart';

type Account = {
  MaNguoiDung?: number;
  HoTen?: string;
  TenVaiTro?: string;
};


type SavedAddress = {
  MaDiaChi: number;
  TenNguoiNhan: string;
  SDT: string;
  TinhThanh: string;
  QuanHuyen: string | null;
  PhuongXa: string | null;
  DiaChiChiTiet: string;
  MacDinh: boolean;
};

type DeliveryForm = {
  tenNguoiNhan: string;
  soDienThoai: string;
  tinhThanh: string;
  quanHuyen: string;
  phuongXa: string;
  diaChiChiTiet: string;
  hinhThucNhan: 'Giao tận nơi' | 'Nhận tại cửa hàng';
  phuongThucThanhToan: 'Chuyển khoản' | 'Thanh toán khi nhận';
  ghiChu: string;
};

const inputClass =
  'w-full rounded-xl border border-[#d5dfd0] bg-white px-4 py-3 outline-none focus:border-[#678d65]';

function isValidPhone(value: string) {
  return /^0\d{9}$/.test(value.trim());
}

export default function CheckoutPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
const [saving, setSaving] = useState(false);
const [addressError, setAddressError] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [validated, setValidated] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState<DeliveryForm>({
    tenNguoiNhan: '',
    soDienThoai: '',
    tinhThanh: '',
    quanHuyen: '',
    phuongXa: '',
    diaChiChiTiet: '',
    hinhThucNhan: 'Giao tận nơi',
    phuongThucThanhToan: 'Chuyển khoản',
    ghiChu: '',
  });
  

  useEffect(() => {
    const current = getUser() as Account | null;

    setAccount(current);
    setItems(
      current?.MaNguoiDung
        ? getCart(current.MaNguoiDung)
        : [],
    );

    setForm((previous) => ({
      ...previous,
      tenNguoiNhan: current?.HoTen || '',
    }));

    setReady(true);
  }, []);

  
function fillAddress(address: SavedAddress) {
  setSelectedAddressId(address.MaDiaChi);

  setForm((previous) => ({
    ...previous,
    tenNguoiNhan: address.TenNguoiNhan,
    soDienThoai: address.SDT,
    tinhThanh: address.TinhThanh,
    quanHuyen: address.QuanHuyen || '',
    phuongXa: address.PhuongXa || '',
    diaChiChiTiet: address.DiaChiChiTiet,
  }));
}

useEffect(() => {
  const current = getUser();

  if (!current) return;

  let active = true;

  async function loadAddresses() {
    try {
      const response = await api<{
        success: boolean;
        data: SavedAddress[];
      }>('/addresses');

      if (!active) return;

      setSavedAddresses(response.data);

      const defaultAddress = response.data.find(
        (address) => address.MacDinh,
      );

      if (defaultAddress) {
        fillAddress(defaultAddress);
      }
    } catch (err) {
      if (active) {
        setAddressError(
          err instanceof Error
            ? err.message
            : 'Không tải được địa chỉ đã lưu',
        );
      }
    }
  }

  loadAddresses();

  return () => {
    active = false;
  };
}, []);

  const hasRental = items.some(
    (item) => item.loaiGiaoDich === 'Thuê',
  );

  const totals = useMemo(() => {
    return items.reduce(
      (result, item) => {
        if (item.loaiGiaoDich === 'Mua') {
          result.purchase += cartItemTotal(item);
        } else {
          result.rental += cartItemTotal(item);
          result.deposit += cartItemDeposit(item);
        }

        return result;
      },
      {
        purchase: 0,
        rental: 0,
        deposit: 0,
      },
    );
  }, [items]);

  const total =
    totals.purchase + totals.rental + totals.deposit;

  function updateField<K extends keyof DeliveryForm>(
    name: K,
    value: DeliveryForm[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setValidated(false);
    setError('');
  }

  function validateForm() {
    if (!form.tenNguoiNhan.trim()) {
      return 'Vui lòng nhập họ tên người nhận.';
    }

    if (!isValidPhone(form.soDienThoai)) {
      return 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.';
    }

    if (form.hinhThucNhan === 'Giao tận nơi') {
      if (!form.tinhThanh.trim()) {
        return 'Vui lòng nhập tỉnh hoặc thành phố.';
      }

      if (!form.diaChiChiTiet.trim()) {
        return 'Vui lòng nhập địa chỉ giao hàng chi tiết.';
      }
    }

    if (hasRental && form.hinhThucNhan === 'Nhận tại cửa hàng') {
      return 'Thông tin nhận cây thuê tại cửa hàng cần được xác nhận với nhân viên trước khi đặt.';
    }

    if (items.length === 0) {
      return 'Giỏ hàng đang trống.';
    }

    for (const item of items) {
      if (!Number.isInteger(item.soLuong) || item.soLuong <= 0) {
        return 'Giỏ hàng có số lượng không hợp lệ.';
      }

      if (
        item.loaiGiaoDich === 'Thuê' &&
        (
          !item.ngayBatDauThue ||
          !item.ngayKetThucThue ||
          item.ngayKetThucThue <= item.ngayBatDauThue
        )
      ) {
        return `Ngày thuê của ${item.tenSP} không hợp lệ.`;
      }
    }

    return '';
  }

  

async function handleContinue() {
  const result = validateForm();

  if (result) {
    setError(result);
    return;
  }

  if (!account?.MaNguoiDung) {
    setError('Phiên đăng nhập không hợp lệ.');
    return;
  }

  setSaving(true);
  setError('');

  try {
    const addressData = {
      tenNguoiNhan: form.tenNguoiNhan,
      soDienThoai: form.soDienThoai,
      tinhThanh: form.tinhThanh,
      quanHuyen: form.quanHuyen,
      phuongXa: form.phuongXa,
      diaChiChiTiet: form.diaChiChiTiet,
      macDinh: savedAddresses.length === 0,
    };

    let maDiaChi = selectedAddressId;

    if (selectedAddressId) {
      const response = await api<{
        success: boolean;
        maDiaChi: number;
      }>(`/addresses/${selectedAddressId}`, {
        method: 'PUT',
        body: JSON.stringify(addressData),
      });

      maDiaChi = response.maDiaChi;
    } else {
      const response = await api<{
        success: boolean;
        maDiaChi: number;
      }>('/addresses', {
        method: 'POST',
        body: JSON.stringify(addressData),
      });

      maDiaChi = response.maDiaChi;
    }

    const checkoutData = {
      userId: account.MaNguoiDung,
      maDiaChi,
      cart: items,
      delivery: form,
      savedAt: Date.now(),
    };

    sessionStorage.setItem(
      `nhai-checkout-${account.MaNguoiDung}`,
      JSON.stringify(checkoutData),
    );

    await router.push('/customer/payment');
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Không thể lưu địa chỉ giao hàng',
    );
  } finally {
    setSaving(false);
  }
}



  if (!ready) {
    return <p className="p-10">Đang tải thông tin thanh toán...</p>;
  }

  return (
    <>
      <Head>
        <title>Thông tin giao nhận | NHAI&apos;s Green</title>
      </Head>

      <div className="min-h-screen bg-[#f8faf5] text-[#294530]">
        <Header />

        <main className="mx-auto max-w-7xl px-5 py-12">
          <nav className="mb-8 text-sm text-gray-500">
            <Link href="/customer/cart">Giỏ hàng</Link>
            <span className="mx-3">›</span>
            <span className="font-semibold text-[#315b3d]">
              Thông tin giao nhận
            </span>
            <span className="mx-3">›</span>
            Phương thức thanh toán
          </nav>

          <h1 className="mb-8 text-3xl font-semibold">
            Thông tin giao nhận
          </h1>

          {account?.TenVaiTro !== 'Khách hàng' ? (
            <div className="rounded-2xl bg-white p-10 text-center">
              <p>Vui lòng đăng nhập bằng tài khoản khách hàng.</p>
              <Link
                href="/login"
                className="mt-5 inline-block rounded-full bg-[#315b3d] px-6 py-3 text-white"
              >
                Đăng nhập
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center">
              <p>Giỏ hàng đang trống.</p>
              <Link href="/products" className="mt-4 inline-block underline">
                Chọn sản phẩm
              </Link>
            </div>
          ) : (
            <div className="grid items-start gap-9 lg:grid-cols-[1fr_420px]">
              <section className="space-y-6">
                <div className="rounded-2xl border border-[#dce7d8] bg-white p-7">
                  <h2 className="text-xl font-semibold">
                    Thông tin người nhận
                  </h2>

                  
{savedAddresses.length > 0 && (
  <div className="mt-6 rounded-xl bg-[#f0f5ec] p-5">
    <label className="mb-3 block text-sm font-semibold">
      Địa chỉ giao hàng đã lưu
    </label>

    <select
      value={selectedAddressId ?? ''}
      onChange={(event) => {
        const address = savedAddresses.find(
          (item) => item.MaDiaChi === Number(event.target.value),
        );

        if (address) {
          fillAddress(address);
        } else {
          setSelectedAddressId(null);
        }
      }}
      className="w-full rounded-lg border border-[#cad9c4] bg-white p-3"
    >
      <option value="">Nhập địa chỉ mới</option>

      {savedAddresses.map((address) => (
        <option key={address.MaDiaChi} value={address.MaDiaChi}>
          {address.TenNguoiNhan} – {address.DiaChiChiTiet}
          {address.MacDinh ? ' (Mặc định)' : ''}
        </option>
      ))}
    </select>

    <button
      type="button"
      onClick={() => {
        setSelectedAddressId(null);
        setForm((previous) => ({
          ...previous,
          tenNguoiNhan: account?.HoTen || '',
          soDienThoai: '',
          tinhThanh: '',
          quanHuyen: '',
          phuongXa: '',
          diaChiChiTiet: '',
        }));
      }}
      className="mt-4 text-sm font-semibold text-[#315b3d] underline"
    >
      + Thêm địa chỉ giao hàng mới
    </button>
  </div>
)}

{addressError && (
  <p className="mt-4 text-sm text-red-700">
    {addressError}
  </p>
)}


                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="mb-2 block text-sm">
                        Họ và tên *
                      </span>
                      <input
                        value={form.tenNguoiNhan}
                        onChange={(event) =>
                          updateField(
                            'tenNguoiNhan',
                            event.target.value,
                          )
                        }
                        className={inputClass}
                        placeholder="Nhập họ tên người nhận"
                      />
                    </label>

                    <label>
                      <span className="mb-2 block text-sm">
                        Số điện thoại *
                      </span>
                      <input
                        type="tel"
                        value={form.soDienThoai}
                        onChange={(event) =>
                          updateField(
                            'soDienThoai',
                            event.target.value,
                          )
                        }
                        className={inputClass}
                        placeholder="0xxxxxxxxx"
                      />
                    </label>

                    <label>
                      <span className="mb-2 block text-sm">
                        Tỉnh / Thành phố
                      </span>
                      <input
                        value={form.tinhThanh}
                        onChange={(event) =>
                          updateField('tinhThanh', event.target.value)
                        }
                        className={inputClass}
                        placeholder="Tỉnh hoặc thành phố"
                      />
                    </label>

                    <label>
                      <span className="mb-2 block text-sm">
                        Quận / Huyện
                      </span>
                      <input
                        value={form.quanHuyen}
                        onChange={(event) =>
                          updateField('quanHuyen', event.target.value)
                        }
                        className={inputClass}
                      />
                    </label>

                    <label>
                      <span className="mb-2 block text-sm">
                        Phường / Xã
                      </span>
                      <input
                        value={form.phuongXa}
                        onChange={(event) =>
                          updateField('phuongXa', event.target.value)
                        }
                        className={inputClass}
                      />
                    </label>

                    <label className="sm:col-span-2">
                      <span className="mb-2 block text-sm">
                        Địa chỉ chi tiết
                      </span>
                      <input
                        value={form.diaChiChiTiet}
                        onChange={(event) =>
                          updateField(
                            'diaChiChiTiet',
                            event.target.value,
                          )
                        }
                        className={inputClass}
                        placeholder="Số nhà, tên đường..."
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#dce7d8] bg-white p-7">
                  <h2 className="text-xl font-semibold">
                    Hình thức nhận cây
                  </h2>

                  <div className="mt-5 space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={
                          form.hinhThucNhan === 'Giao tận nơi'
                        }
                        onChange={() =>
                          updateField(
                            'hinhThucNhan',
                            'Giao tận nơi',
                          )
                        }
                      />
                      Giao tận nơi
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={
                          form.hinhThucNhan === 'Nhận tại cửa hàng'
                        }
                        onChange={() =>
                          updateField(
                            'hinhThucNhan',
                            'Nhận tại cửa hàng',
                          )
                        }
                      />
                      Nhận tại cửa hàng
                    </label>
                  </div>

                  <p className="mt-4 text-xs leading-6 text-gray-500">
                    Địa điểm nhận hàng tại cửa hàng và khả năng
                    phục vụ cần được xác nhận trước khi tạo đơn.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#dce7d8] bg-white p-7">
                  <h2 className="text-xl font-semibold">
                    Phương thức thanh toán dự kiến
                  </h2>

                  <div className="mt-5 space-y-4">
                    {(
                      [
                        'Chuyển khoản',
                        'Thanh toán khi nhận',
                      ] as const
                    ).map((method) => (
                      <label
                        key={method}
                        className="flex items-center gap-3"
                      >
                        <input
                          type="radio"
                          checked={
                            form.phuongThucThanhToan === method
                          }
                          onChange={() =>
                            updateField(
                              'phuongThucThanhToan',
                              method,
                            )
                          }
                        />
                        {method}
                      </label>
                    ))}
                  </div>


                </div>

                <div className="rounded-2xl border border-[#dce7d8] bg-white p-7">
                  <h2 className="text-xl font-semibold">
                    Ghi chú đơn hàng
                  </h2>

                  <textarea
                    rows={4}
                    maxLength={500}
                    value={form.ghiChu}
                    onChange={(event) =>
                      updateField('ghiChu', event.target.value)
                    }
                    className={`${inputClass} mt-5`}
                    placeholder="Thông tin cần lưu ý khi giao cây..."
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl bg-red-50 p-4 text-red-700"
                  >
                    {error}
                  </p>
                )}

                {validated && (
                  <div className="rounded-xl border border-[#cde0c6] bg-[#eaf4e5] p-5">
                    <p className="font-semibold text-[#315b3d]">
                      Thông tin giao nhận đã hợp lệ trên biểu mẫu.
                    </p>



                    <p className="mt-2 text-sm text-[#56765b]">
                      Hiện chưa gửi đơn hàng hoặc thanh toán.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Link
                    href="/customer/cart"
                    className="text-sm font-medium text-[#315b3d] underline"
                  >
                    Quay lại giỏ hàng
                  </Link>

                  
<button
  type="button"
  onClick={handleContinue}
  disabled={saving}
  className="rounded-xl bg-[#315b3d] px-7 py-3.5 font-semibold text-white disabled:opacity-50"
>
  {saving
    ? 'Đang lưu địa chỉ...'
    : 'Tiếp tục đến phương thức thanh toán'}
</button>

                </div>
              </section>

              <aside className="rounded-2xl border border-[#dce7d8] bg-white p-6">
                <h2 className="text-xl font-semibold">
                  Đơn hàng của bạn
                </h2>

                <div className="mt-6 space-y-5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-4 border-b pb-5 text-sm"
                    >
                      <div>
                        <Link
                          href={`/products/${item.maSP}`}
                          className="font-semibold text-[#315b3d]"
                        >
                          {item.tenSP}
                        </Link>

                        <p className="mt-1 text-gray-500">
                          {item.loaiGiaoDich} × {item.soLuong}
                        </p>

                        {item.loaiGiaoDich === 'Thuê' && (
                          <p className="mt-1 text-xs text-gray-500">
                            {item.ngayBatDauThue} →{' '}
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
                    <span>Tiền mua</span>
                    <span>{formatMoney(totals.purchase)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Phí thuê dự kiến</span>
                    <span>{formatMoney(totals.rental)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Tiền cọc dự kiến</span>
                    <span>{formatMoney(totals.deposit)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Vận chuyển</span>
                    <span>Chưa xác định</span>
                  </div>

                  <div className="flex justify-between border-t pt-5 text-lg font-bold">
                    <span>Tạm tính</span>
                    <span className="text-[#315b3d]">
                      {formatMoney(total)}
                    </span>
                  </div>
                </div>

                <p className="mt-5 text-xs leading-6 text-gray-500">
                  Đây là số tiền tham khảo trước khi áp dụng
                  phí vận chuyển, chính sách dịch vụ và khuyến mãi.
                </p>
              </aside>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
