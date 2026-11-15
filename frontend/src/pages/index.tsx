
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard, { Plant } from '../components/ProductCard';
import { api } from '../api/client';

type Category = {
  MaDM: number;
  TenDM: string;
  TrangThai: boolean;
};

type ListResponse<T> = {
  success: boolean;
  total: number;
  data: T[];
};

export default function HomePage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bannerFailed, setBannerFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [plantResult, categoryResult] = await Promise.all([
          api<ListResponse<Plant>>('/plants'),
          api<ListResponse<Category>>('/categories'),
        ]);

        if (!active) return;

        setPlants(
          plantResult.data.filter((plant) => Boolean(plant.TrangThai)),
        );
        setCategories(
          categoryResult.data.filter((item) => Boolean(item.TrangThai)),
        );
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Không thể tải dữ liệu',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const featuredPlants = plants.slice(0, 4);
  const rentalPlants = plants
    .filter(
      (plant) =>
        ['Thuê', 'Bán và thuê'].includes(plant.LoaiSanPham) &&
        plant.GiaThueTheoNgay !== null,
    )
    .slice(0, 4);

  return (
    <>
      <Head>
        <title>NHAI&apos;s Green | Cây cảnh và dịch vụ thuê cây</title>
        <meta
          name="description"
          content="Khám phá cây cảnh, mua và thuê cây tại NHAI's Green."
        />
      </Head>

      <div className="min-h-screen bg-[#fafbf7] text-[#2d4633]">
        <Header />

        <main>
          <section className="bg-[#e8eee1]">
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#75916e]">
                  NHAI&apos;s Green
                </p>

                <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-[#294b31] md:text-6xl">
                  Một chiếc cây nhỏ,
                  <span className="block text-[#7c9b73]">
                    một khoảng xanh riêng.
                  </span>
                </h1>

                <p className="mt-6 max-w-lg text-base leading-8 text-[#617362]">
                  Khám phá cây xanh cho nhà ở, văn phòng và không gian
                  kinh doanh. Dễ dàng tìm hiểu giá mua, giá thuê và
                  thông tin chăm sóc trước khi lựa chọn.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/products"
                    className="rounded-full bg-[#315b3d] px-7 py-3.5 font-semibold text-white hover:bg-[#25472f]"
                  >
                    Khám phá sản phẩm
                  </Link>

                  <Link
                    href="/about"
                    className="rounded-full border border-[#a8bea3] bg-white px-7 py-3.5 font-semibold text-[#315b3d]"
                  >
                    Về NHAI&apos;s Green
                  </Link>
                </div>
              </div>

              <div className="relative flex aspect-[5/4] items-center justify-center overflow-hidden rounded-[2rem] bg-[#d3e0ce]">
                {!bannerFailed ? (
                  <img
                    src="/images/banners/green-home.jpg"
                    alt="Không gian xanh NHAI's Green"
                    onError={() => setBannerFailed(true)}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center text-[#668265]">
                    <div className="text-7xl">✳</div>
                    <p className="mt-5 text-lg">Sống xanh mỗi ngày</p>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#294b31]/75 to-transparent p-7 text-white">
                  <p className="text-xl font-semibold">
                    Mang thiên nhiên về nhà
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-b bg-white py-8">
            <div className="mx-auto grid max-w-7xl gap-6 px-5 text-sm md:grid-cols-3">
              <div>
                <strong className="text-[#315b3d]">Cây cảnh đa dạng</strong>
                <p className="mt-2 text-gray-500">
                  Lựa chọn theo không gian và nhu cầu chăm sóc.
                </p>
              </div>
              <div>
                <strong className="text-[#315b3d]">Mua hoặc thuê cây</strong>
                <p className="mt-2 text-gray-500">
                  So sánh giá và lựa chọn tại trang chi tiết.
                </p>
              </div>
              <div>
                <strong className="text-[#315b3d]">Đồng hành sau mua</strong>
                <p className="mt-2 text-gray-500">
                  Theo dõi yêu cầu chăm sóc và bảo hành.
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-5 py-16">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8aa17e]">
                  Khám phá theo loại cây
                </p>
                <h2 className="mt-3 text-3xl font-semibold">
                  Danh mục cây cảnh
                </h2>
              </div>

              <Link
                href="/products"
                className="text-sm font-semibold text-[#315b3d] hover:underline"
              >
                Xem tất cả sản phẩm →
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.slice(0, 8).map((category, index) => (
                <Link
                  key={category.MaDM}
                  href={`/products?category=${category.MaDM}`}
                  className="group rounded-2xl border border-[#dce6d6] bg-white p-6 transition hover:border-[#91ad88] hover:shadow-md"
                >
                  <span className="text-xs text-[#8ba084]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-7 text-lg font-semibold text-[#315b3d]">
                    {category.TenDM}
                  </h3>
                  <p className="mt-3 text-sm text-gray-500">
                    Khám phá sản phẩm →
                  </p>
                </Link>
              ))}
            </div>

            {!loading && categories.length === 0 && (
              <p className="mt-6 text-sm text-gray-500">
                Chưa có danh mục đang hoạt động.
              </p>
            )}
          </section>

          <section className="bg-white py-16">
            <div className="mx-auto max-w-7xl px-5">
              <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8aa17e]">
                    NHAI&apos;s Green
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold">
                    Sản phẩm nổi bật
                  </h2>
                  <p className="mt-3 text-gray-500">
                    
                  </p>
                </div>

                <Link
                  href="/products"
                  className="font-semibold text-[#315b3d] hover:underline"
                >
                  Xem tất cả →
                </Link>
              </div>

              {loading ? (
                <p className="py-10 text-center">Đang tải sản phẩm...</p>
              ) : featuredPlants.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {featuredPlants.map((plant) => (
                    <ProductCard key={plant.MaSP} plant={plant} />
                  ))}
                </div>
              ) : (
                <p className="py-10 text-center text-gray-500">
                  Chưa có sản phẩm để hiển thị.
                </p>
              )}
            </div>
          </section>

          <section className="bg-[#f0f5eb] py-16">
            <div className="mx-auto max-w-7xl px-5">
              <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8aa17e]">
                    Cho không gian linh hoạt
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold">
                    Cây cảnh cho thuê
                  </h2>
                  <p className="mt-3 text-gray-500">
                   
                  </p>
                </div>

                <Link
                  href="/products?type=rent"
                  className="font-semibold text-[#315b3d] hover:underline"
                >
                  Xem cây cho thuê →
                </Link>
              </div>

              {rentalPlants.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {rentalPlants.map((plant) => (
                    <ProductCard key={plant.MaSP} plant={plant} />
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-white p-8 text-center text-gray-500">
                  Chưa có cây cho thuê trong danh sách hiện tại.
                </p>
              )}
            </div>
          </section>

          <section id="dich-vu" className="bg-[#e4eddf] py-20">
            <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8aa17e]">
                  Dịch vụ NHAI&apos;s Green
                </p>
                <h2 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">
                  Chăm cây cùng bạn,
                  <span className="block">từ lúc chọn đến sau mua.</span>
                </h2>
                <p className="mt-5 leading-8 text-[#657667]">
                  Chúng tôi hướng đến trải nghiệm chọn cây, thuê cây và
                  theo dõi yêu cầu hỗ trợ rõ ràng trên một hệ thống.
                </p>
                <Link
                  href="/about"
                  className="mt-7 inline-block rounded-full bg-[#315b3d] px-6 py-3 font-medium text-white"
                >
                  Tìm hiểu về cửa hàng
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  'Tư vấn lựa chọn cây',
                  'Dịch vụ thuê cây',
                  'Hướng dẫn chăm sóc',
                  'Hậu mãi và bảo hành',
                ].map((name) => (
                  <div
                    key={name}
                    className="rounded-2xl border border-[#d1dfcb] bg-white p-6 font-semibold text-[#315b3d]"
                  >
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {error && (
            <div className="mx-auto max-w-7xl px-5 py-7">
              <p className="rounded-lg bg-red-50 p-4 text-red-700">
                Lỗi tải dữ liệu: {error}
              </p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
