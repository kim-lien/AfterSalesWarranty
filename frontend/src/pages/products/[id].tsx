
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import {
  Plant,
  canBuy,
  canRent,
  formatPrice,
  getPlantImage,
} from '../../components/ProductCard';
import { api, getUser } from '../../api/client';
import { addToCart } from '../../lib/cart';

type Stock = {
  MaSP: number;
  SoLuongTon: number;
  SoLuongDangThue: number;
  SoLuongKhaDung: number;
  TrangThai: boolean;
  TinhTrang: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type Account = {
  MaNguoiDung?: number;
  TenVaiTro?: string;
};

type Mode = 'buy' | 'rent';

function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function calculateDays(start: string, end: string) {
  if (!start || !end) return 0;

  const startDate = Date.parse(`${start}T00:00:00`);
  const endDate = Date.parse(`${end}T00:00:00`);

  if (!Number.isFinite(startDate) || !Number.isFinite(endDate)) {
    return 0;
  }

  return Math.max(0, Math.round((endDate - startDate) / 86400000));
}

export default function ProductDetailPage() {
  const router = useRouter();

  const [plant, setPlant] = useState<Plant | null>(null);
  const [stock, setStock] = useState<Stock | null>(null);
  const [account, setAccount] = useState<Account | null>(null);

  const [mode, setMode] = useState<Mode>('buy');
  const [quantity, setQuantity] = useState(1);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentalPackage, setRentalPackage] = useState<
    'Cơ bản' | 'Cao cấp'
  >('Cơ bản');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  const loadProduct = useCallback(async (id: number) => {
    setLoading(true);
    setError('');

    try {
      const [productResult, stockResult] = await Promise.all([
        api<ApiResponse<Plant>>(`/plants/${id}`),
        api<ApiResponse<Stock>>(`/stock/products/${id}`),
      ]);

      if (!productResult.success || !productResult.data) {
        throw new Error('Không tìm thấy sản phẩm');
      }

      if (!stockResult.success || !stockResult.data) {
        throw new Error('Không thể xác minh tồn kho sản phẩm');
      }

      setPlant(productResult.data);
      setStock(stockResult.data);

      setMode(canBuy(productResult.data) ? 'buy' : 'rent');
      setQuantity(1);
      setImageFailed(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không tải được thông tin sản phẩm',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    const id = Number(router.query.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      setError('Mã sản phẩm không hợp lệ');
      setLoading(false);
      return;
    }

    setAccount(getUser() as Account | null);
    loadProduct(id);
  }, [router.isReady, router.query.id, loadProduct]);

  const buying = plant ? canBuy(plant) : false;
  const renting = plant ? canRent(plant) : false;

  const available = stock?.SoLuongKhaDung ?? 0;

  const inStock =
    Boolean(plant?.TrangThai) &&
    Boolean(stock?.TrangThai) &&
    available > 0;

  const days = useMemo(
    () => calculateDays(startDate, endDate),
    [startDate, endDate],
  );

  const depositPerPlant = plant
    ? Math.round(Number(plant.GiaTriCay) * 1.5)
    : 0;

  const buyingTotal =
    plant && buying
      ? Number(plant.GiaBan) * quantity
      : 0;

  const rentalTotal =
    plant && renting
      ? Number(plant.GiaThueTheoNgay) * days * quantity
      : 0;

  const depositTotal = depositPerPlant * quantity;

  const estimatedRentalTotal = rentalTotal + depositTotal;

  const imageUrl = plant ? getPlantImage(plant.HinhAnh) : null;

  function validateSelection() {
    if (!plant || !stock || !inStock) {
      return 'Sản phẩm hiện không còn hàng để đặt.';
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > available
    ) {
      return `Số lượng đặt không được vượt quá ${available} cây.`;
    }

    if (mode === 'buy' && !buying) {
      return 'Sản phẩm không hỗ trợ mua.';
    }

    if (mode === 'rent') {
      if (!renting) {
        return 'Sản phẩm không hỗ trợ thuê.';
      }

      if (!startDate || !endDate) {
        return 'Vui lòng chọn ngày bắt đầu và kết thúc thuê.';
      }

      if (startDate < getToday()) {
        return 'Ngày bắt đầu thuê không được ở trong quá khứ.';
      }

      if (days <= 0) {
        return 'Ngày kết thúc phải sau ngày bắt đầu thuê.';
      }
    }

    return '';
  }

  function handleAddToCart(goToCart: boolean) {
    const currentAccount = getUser() as Account | null;

    if (!currentAccount?.MaNguoiDung) {
      setMessage('Vui lòng đăng nhập bằng tài khoản khách hàng.');
      router.push('/login');
      return;
    }

    if (currentAccount.TenVaiTro !== 'Khách hàng') {
      setMessage(
        'Chỉ tài khoản khách hàng mới có thể đặt mua hoặc thuê cây.',
      );
      return;
    }

    const validationError = validateSelection();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    if (!plant) return;

    const type = mode === 'buy' ? 'Mua' : 'Thuê';

    const id =
      mode === 'buy'
        ? `buy-${plant.MaSP}`
        : [
            'rent',
            plant.MaSP,
            startDate,
            endDate,
            rentalPackage,
          ].join('-');

    addToCart(currentAccount.MaNguoiDung, {
      id,
      maSP: plant.MaSP,
      tenSP: plant.TenSP,
      hinhAnh: imageUrl,
      loaiGiaoDich: type,
      soLuong: quantity,
      donGia: Number(
        mode === 'buy' ? plant.GiaBan : plant.GiaThueTheoNgay,
      ),
      giaTriCay: Number(plant.GiaTriCay),
      ngayBatDauThue: mode === 'rent' ? startDate : null,
      ngayKetThucThue: mode === 'rent' ? endDate : null,
      goiThue: mode === 'rent' ? rentalPackage : null,
    });

    setMessage('Đã thêm sản phẩm vào giỏ hàng.');

    if (goToCart) {
      router.push('/customer/cart');
    }
  }

  return (
    <>
      <Head>
        <title>
          {plant
            ? `${plant.TenSP} | NHAI's Green`
            : `Chi tiết sản phẩm | NHAI's Green`}
        </title>
      </Head>

      <div className="min-h-screen bg-[#f8faf5] text-[#294530]">
        <Header />

        <main className="mx-auto max-w-7xl px-5 py-10">
          <nav className="mb-8 flex flex-wrap gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#315b3d]">
              Trang chủ
            </Link>
            <span>/</span>
            <Link href="/products" className="hover:text-[#315b3d]">
              Sản phẩm
            </Link>
            <span>/</span>
            <span className="text-[#315b3d]">
              {plant?.TenSP || 'Chi tiết sản phẩm'}
            </span>
          </nav>

          {loading && (
            <p className="rounded-xl bg-white p-12 text-center">
              Đang tải thông tin sản phẩm...
            </p>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 p-6 text-red-700">
              {error}
            </p>
          )}

          {!loading && plant && stock && (
            <>
              <div className="grid items-start gap-10 lg:grid-cols-2">
                <section className="overflow-hidden rounded-2xl border border-[#e1e9dc] bg-[#e8efe3]">
                  {imageUrl && !imageFailed ? (
                    <img
                      src={imageUrl}
                      alt={plant.TenSP}
                      onError={() => setImageFailed(true)}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square flex-col items-center justify-center text-[#799478]">
                      <span className="text-7xl">✳</span>
                      <p className="mt-4">
                        Hình ảnh sản phẩm đang cập nhật
                      </p>
                    </div>
                  )}

                  <div className="border-t border-[#d6e1d1] bg-white p-4 text-sm text-gray-500">
                    Mã sản phẩm: SP{String(plant.MaSP).padStart(4, '0')}
                  </div>
                </section>

                <section>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7c9875]">
                    CÂY CẢNH NHAI&apos;S GREEN
                  </p>

                  <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
                    {plant.TenSP}
                  </h1>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-gray-500">
                      Mã SP: {plant.MaSP}
                    </span>

                    <span className="text-gray-300">|</span>

                    <span
                      className={`rounded-full px-3 py-1 font-semibold ${
                        inStock
                          ? 'bg-[#e3f2df] text-[#347042]'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {stock.TinhTrang}
                    </span>
                  </div>

                  <div className="mt-6 rounded-2xl border border-[#e1e9dc] bg-white p-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-sm text-gray-500">
                          Giá mua
                        </p>
                        <p className="mt-2 text-xl font-bold text-[#315b3d]">
                          {buying
                            ? formatPrice(Number(plant.GiaBan))
                            : 'Không bán'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">
                          Giá thuê/ngày
                        </p>
                        <p className="mt-2 text-xl font-bold text-[#315b3d]">
                          {renting
                            ? formatPrice(Number(plant.GiaThueTheoNgay))
                            : 'Không thuê'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">
                          Cọc dự kiến/cây
                        </p>
                        <p className="mt-2 text-xl font-bold text-[#315b3d]">
                          {renting
                            ? formatPrice(depositPerPlant)
                            : 'Không áp dụng'}
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 border-t pt-4 text-xs leading-6 text-gray-500">
                 
                    </p>
                  </div>

                  <div className="mt-7">
                    <h2 className="mb-3 text-lg font-semibold">
                      Lựa chọn hình thức
                    </h2>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {buying && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('buy');
                            setMessage('');
                          }}
                          className={`rounded-xl border px-5 py-4 text-left ${
                            mode === 'buy'
                              ? 'border-[#315b3d] bg-[#315b3d] text-white'
                              : 'border-[#d5e0d0] bg-white'
                          }`}
                        >
                          <strong className="block">
                            Mua cây
                          </strong>
                          <span className="mt-1 block text-sm opacity-80">
                            Sở hữu cây lâu dài
                          </span>
                        </button>
                      )}

                      {renting && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('rent');
                            setMessage('');
                          }}
                          className={`rounded-xl border px-5 py-4 text-left ${
                            mode === 'rent'
                              ? 'border-[#315b3d] bg-[#315b3d] text-white'
                              : 'border-[#d5e0d0] bg-white'
                          }`}
                        >
                          <strong className="block">
                            Thuê cây
                          </strong>
                          <span className="mt-1 block text-sm opacity-80">
                            Thuê theo ngày
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-[#e1e9dc] bg-white p-6">
                    <label className="block text-sm font-semibold">
                      Số lượng
                    </label>

                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <div className="flex items-center rounded-lg border border-[#cbd9c5]">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(Math.max(1, quantity - 1))
                          }
                          disabled={!inStock || quantity <= 1}
                          className="px-4 py-2 text-xl disabled:opacity-40"
                        >
                          −
                        </button>

                        <span className="min-w-12 text-center font-semibold">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(
                              Math.min(available, quantity + 1),
                            )
                          }
                          disabled={!inStock || quantity >= available}
                          className="px-4 py-2 text-xl disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-sm text-gray-500">
                        Khả dụng hiện tại: {available} cây
                      </span>
                    </div>

                    {mode === 'rent' && renting && (
                      <div className="mt-7 border-t pt-6">
                        <h3 className="mb-4 font-semibold">
                          Thông tin thuê cây
                        </h3>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm">
                              Ngày bắt đầu thuê *
                            </label>
                            <input
                              type="date"
                              min={getToday()}
                              value={startDate}
                              onChange={(event) =>
                                setStartDate(event.target.value)
                              }
                              className="w-full rounded-lg border border-[#cbd9c5] p-3"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm">
                              Ngày kết thúc thuê *
                            </label>
                            <input
                              type="date"
                              min={startDate || getToday()}
                              value={endDate}
                              onChange={(event) =>
                                setEndDate(event.target.value)
                              }
                              className="w-full rounded-lg border border-[#cbd9c5] p-3"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="mb-2 block text-sm">
                            Gói thuê *
                          </label>

                          <select
                            value={rentalPackage}
                            onChange={(event) =>
                              setRentalPackage(
                                event.target.value as
                                  | 'Cơ bản'
                                  | 'Cao cấp',
                              )
                            }
                            className="w-full rounded-lg border border-[#cbd9c5] p-3"
                          >
                            <option value="Cơ bản">
                              Gói cơ bản
                            </option>
                            <option value="Cao cấp">
                              Gói cao cấp
                            </option>
                          </select>

                          <p className="mt-2 text-xs text-gray-500">
                            Phí dịch vụ theo gói chưa được cộng vào
                            giá tạm tính.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 space-y-3 border-t pt-5">
                      {mode === 'buy' ? (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-gray-600">
                            Tạm tính tiền mua
                          </span>
                          <strong className="text-2xl text-[#315b3d]">
                            {formatPrice(buyingTotal)}
                          </strong>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Thời gian thuê</span>
                            <span>{days} ngày</span>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span>Tiền thuê dự kiến</span>
                            <span>{formatPrice(rentalTotal)}</span>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span>Tiền cọc dự kiến</span>
                            <span>{formatPrice(depositTotal)}</span>
                          </div>

                          <div className="flex justify-between border-t pt-4">
                            <span className="font-semibold">
                              Tạm tính
                            </span>
                            <strong className="text-2xl text-[#315b3d]">
                              {days > 0
                                ? formatPrice(estimatedRentalTotal)
                                : 'Chọn ngày thuê'}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {message && (
                    <p
                      role="status"
                      className="mt-5 rounded-xl bg-[#eaf2e5] p-4 text-sm text-[#315b3d]"
                    >
                      {message}
                    </p>
                  )}

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={!inStock}
                      onClick={() => handleAddToCart(false)}
                      className="rounded-xl border-2 border-[#315b3d] bg-white px-5 py-4 font-semibold text-[#315b3d] hover:bg-[#eef4eb] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Thêm vào giỏ hàng
                    </button>

                    <button
                      type="button"
                      disabled={!inStock}
                      onClick={() => handleAddToCart(true)}
                      className="rounded-xl bg-[#315b3d] px-5 py-4 font-semibold text-white hover:bg-[#25472f] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {mode === 'buy'
                        ? 'Mua ngay'
                        : 'Thuê ngay'}
                    </button>
                  </div>

                  <p className="mt-4 text-xs leading-6 text-gray-500">
                  
                  </p>
                </section>
              </div>

              <section className="mt-14 rounded-2xl border border-[#e1e9dc] bg-white p-8">
                <h2 className="text-2xl font-semibold">
                  Mô tả và thông tin cây
                </h2>

                <p className="mt-5 whitespace-pre-line leading-8 text-gray-600">
                  {plant.MoTa || 'Thông tin sản phẩm đang cập nhật.'}
                </p>

                <div className="mt-8 grid gap-6 border-t pt-7 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">
                      Chiều cao
                    </p>
                    <p className="mt-2 font-medium">
                      {plant.ChieuCao || 'Đang cập nhật'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Nhu cầu ánh sáng
                    </p>
                    <p className="mt-2 font-medium">
                      {plant.NhuCauAnhSang || 'Đang cập nhật'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Đơn vị tính
                    </p>
                    <p className="mt-2 font-medium">
                      {plant.DonViTinh || 'Cây'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Điều kiện xem xét bảo hành
                    </p>
                    <p className="mt-2 font-medium">
                      {plant.DuDieuKienBaoHanh
                        ? 'Có hỗ trợ xem xét theo chính sách'
                        : 'Không thuộc nhóm cây đủ điều kiện theo thuộc tính sản phẩm'}
                    </p>
                  </div>
                </div>

                <div className="mt-8 border-t pt-7">
                  <h3 className="text-lg font-semibold">
                    Hướng dẫn chăm sóc
                  </h3>

                  <p className="mt-4 whitespace-pre-line leading-8 text-gray-600">
                    {plant.HuongDanChamSoc ||
                      'Hướng dẫn chăm sóc đang cập nhật.'}
                  </p>
                </div>

                <Link
                  href="/services"
                  className="mt-8 inline-block text-sm font-semibold text-[#315b3d] underline"
                >
                  Tìm hiểu thêm về dịch vụ chăm sóc và bảo hành
                </Link>
              </section>
            </>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
