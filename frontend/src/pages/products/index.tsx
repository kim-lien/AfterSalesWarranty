
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductCard, {
  Plant,
  canBuy,
  canRent,
} from '../../components/ProductCard';
import { api } from '../../api/client';

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

const PAGE_SIZE = 12;

export default function ProductsPage() {
  const router = useRouter();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categoryId =
    typeof router.query.category === 'string'
      ? Number(router.query.category)
      : null;

  const type =
    router.query.type === 'buy' || router.query.type === 'rent'
      ? router.query.type
      : 'all';

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
            err instanceof Error ? err.message : 'Không tải được sản phẩm',
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

  useEffect(() => {
    setPage(1);
  }, [search, sort, categoryId, type]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi-VN');

    const result = plants.filter((plant) => {
      const matchesCategory =
        categoryId === null || plant.MaDM === categoryId;

      const matchesSearch =
        !keyword ||
        plant.TenSP.toLocaleLowerCase('vi-VN').includes(keyword) ||
        (plant.MoTa ?? '')
          .toLocaleLowerCase('vi-VN')
          .includes(keyword);

      const matchesType =
        type === 'all' ||
        (type === 'buy' && canBuy(plant)) ||
        (type === 'rent' && canRent(plant));

      return matchesCategory && matchesSearch && matchesType;
    });

    if (sort === 'name') {
      result.sort((a, b) => a.TenSP.localeCompare(b.TenSP, 'vi'));
    }

    if (sort === 'price-asc' || sort === 'price-desc') {
      const price = (plant: Plant) => {
        const value = type === 'rent'
          ? plant.GiaThueTheoNgay
          : plant.GiaBan;

        return value === null ? Infinity : Number(value);
      };

      result.sort((a, b) =>
        sort === 'price-asc'
          ? price(a) - price(b)
          : price(b) - price(a),
      );
    }

    return result;
  }, [plants, categoryId, search, sort, type]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE),
  );

  const displayed = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function changeFilter(nextCategory: number | null, nextType: string) {
    const query: Record<string, string> = {};

    if (nextCategory !== null) {
      query.category = String(nextCategory);
    }

    if (nextType !== 'all') {
      query.type = nextType;
    }

    router.push({
      pathname: '/products',
      query,
    });
  }

  return (
    <>
      <Head>
        <title>Tất cả sản phẩm | NHAI&apos;s Green</title>
      </Head>

      <div className="min-h-screen bg-[#fafbf7] text-[#2d4633]">
        <Header />

        <main>
          <section className="bg-[#e9f0e4]">
            <div className="mx-auto max-w-7xl px-5 py-12">
              <nav className="mb-5 text-sm text-[#6d816b]">
                <Link href="/">Trang chủ</Link>
                <span className="mx-2">/</span>
                Sản phẩm
              </nav>

              <h1 className="text-4xl font-semibold text-[#294b31]">
                Tất cả cây cảnh
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-[#667b66]">
                
              </p>
            </div>
          </section>

          <div className="mx-auto grid max-w-7xl gap-9 px-5 py-12 lg:grid-cols-[250px_1fr]">
            <aside className="h-fit rounded-2xl border border-[#e0e8dc] bg-white p-6">
              <h2 className="text-lg font-semibold">Bộ lọc sản phẩm</h2>

              <div className="mt-6">
                <h3 className="mb-4 text-sm font-semibold">
                  Danh mục cây
                </h3>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => changeFilter(null, type)}
                    className={`rounded-lg px-3 py-2 text-left text-sm ${
                      categoryId === null
                        ? 'bg-[#e6efe1] font-semibold text-[#315b3d]'
                        : 'text-gray-600 hover:bg-[#f5f7f1]'
                    }`}
                  >
                    Tất cả danh mục
                  </button>

                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category.MaDM}
                      onClick={() =>
                        changeFilter(category.MaDM, type)
                      }
                      className={`rounded-lg px-3 py-2 text-left text-sm ${
                        categoryId === category.MaDM
                          ? 'bg-[#e6efe1] font-semibold text-[#315b3d]'
                          : 'text-gray-600 hover:bg-[#f5f7f1]'
                      }`}
                    >
                      {category.TenDM}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-7 border-t pt-6">
                <h3 className="mb-4 text-sm font-semibold">
                  Hình thức
                </h3>

                <div className="flex flex-col gap-2">
                  {[
                    { value: 'all', label: 'Tất cả sản phẩm' },
                    { value: 'buy', label: 'Có thể mua' },
                    { value: 'rent', label: 'Có thể thuê' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() =>
                        changeFilter(categoryId, item.value)
                      }
                      className={`rounded-lg px-3 py-2 text-left text-sm ${
                        type === item.value
                          ? 'bg-[#e6efe1] font-semibold text-[#315b3d]'
                          : 'text-gray-600 hover:bg-[#f5f7f1]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSort('default');
                  changeFilter(null, 'all');
                }}
                className="mt-7 w-full rounded-lg border border-[#bccdb5] px-4 py-3 text-sm font-medium text-[#315b3d]"
              >
                Xóa bộ lọc
              </button>
            </aside>

            <section>
              <div className="mb-7 flex flex-col gap-4 sm:flex-row">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm kiếm tên cây..."
                  className="min-w-0 flex-1 rounded-xl border border-[#dce5d7] bg-white px-5 py-3 outline-none focus:border-[#648665]"
                />

                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="rounded-xl border border-[#dce5d7] bg-white px-5 py-3"
                >
                  <option value="default">Sắp xếp mặc định</option>
                  <option value="name">Tên A–Z</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                </select>
              </div>

              <div className="mb-6 flex items-center justify-between text-sm text-gray-500">
                <span>{filtered.length} sản phẩm phù hợp</span>
                <span>Trang {page}/{totalPages}</span>
              </div>

              {loading ? (
                <p className="rounded-xl bg-white p-12 text-center">
                  Đang tải sản phẩm...
                </p>
              ) : displayed.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {displayed.map((plant) => (
                    <ProductCard key={plant.MaSP} plant={plant} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-white p-12 text-center text-gray-500">
                  Không có sản phẩm phù hợp với bộ lọc.
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-9 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="rounded-lg border bg-white px-5 py-2 disabled:opacity-40"
                  >
                    Trang trước
                  </button>

                  <span className="text-sm">
                    {page} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="rounded-lg border bg-white px-5 py-2 disabled:opacity-40"
                  >
                    Trang sau
                  </button>
                </div>
              )}

              {error && (
                <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </p>
              )}
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
