
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getUser, logout } from '../api/client';
import { getCart, subscribeCart } from '../lib/cart';

type Account = {
  MaNguoiDung?: number;
  HoTen?: string;
  TenVaiTro?: string;
};

const links = [
  { href: '/', label: 'Trang chủ' },
  { href: '/products', label: 'Sản phẩm' },
  { href: '/products?type=rent', label: 'Thuê cây' },
  { href: '/services', label: 'Dịch vụ' },
  { href: '/about', label: 'Giới thiệu' },
];

function CartIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.5 13h12l2.5-9H6" />
    </svg>
  );
}

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<Account | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const current = getUser() as Account | null;
    setUser(current);

    const refreshCart = () => {
      const count = current?.MaNguoiDung
        ? getCart(current.MaNguoiDung).reduce(
            (total, item) => total + item.soLuong,
            0,
          )
        : 0;

      setCartCount(count);
    };

    refreshCart();

    const unsubscribe = subscribeCart(refreshCart);
    window.addEventListener('storage', refreshCart);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', refreshCart);
    };
  }, [router.asPath]);

  const role = user?.TenVaiTro;

  const accountUrl =
    role === 'Quản trị viên'
      ? '/admin/support'
      : role === 'Nhân viên'
        ? '/staff/support'
        : '/customer/after-sales';

  return (
    <header className="sticky top-0 z-50 border-b border-[#e1e8dd] bg-[#fffefb]/95 backdrop-blur">
      <div className="bg-[#315b3d] px-4 py-2 text-center text-xs text-white">
        NHAI&apos;s Green · Cây cảnh cho không gian sống
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4">
        <Link href="/" className="shrink-0">
          <strong className="block text-2xl text-[#315b3d]">
            NHAI&apos;s Green
          </strong>
          <span className="text-[10px] tracking-[0.2em] text-[#81947d]">
            GROW WITH NATURE
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[#586d58] hover:text-[#315b3d]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {role !== 'Quản trị viên' && role !== 'Nhân viên' && (
            <Link
              href={user ? '/customer/cart' : '/login'}
              aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
              className="relative p-2 text-[#315b3d]"
            >
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#bb6c45] px-1 text-center text-xs text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {role === 'Khách hàng' && (
            <>
              <Link
                href="/customer/appointments"
                className="whitespace-nowrap text-sm font-medium text-[#315b3d] transition hover:text-[#6c9569]"
              >
                Lịch hẹn của tôi
              </Link>

              <Link
                href="/customer/my-orders"
                className="whitespace-nowrap text-sm font-medium text-[#315b3d] transition hover:text-[#6c9569]"
              >
                Đơn hàng của tôi
              </Link>
            </>
          )}

          {user ? (
            <>
              <Link
                href={accountUrl}
                className="max-w-44 truncate rounded-full border border-[#cad9c4] px-4 py-2 text-sm text-[#315b3d]"
              >
                {user.HoTen || 'Tài khoản'}
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-full bg-[#315b3d] px-4 py-2 text-sm text-white"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-[#315b3d]">
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#315b3d] px-4 py-2 text-sm text-white"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Mở menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg border px-4 py-2 text-sm lg:hidden"
        >
          Menu
        </button>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-4 border-t bg-white px-5 py-5 lg:hidden">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {role !== 'Quản trị viên' && role !== 'Nhân viên' && (
            <Link
              href={user ? '/customer/cart' : '/login'}
              onClick={() => setMenuOpen(false)}
            >
              Giỏ hàng ({cartCount})
            </Link>
          )}

          {role === 'Khách hàng' && (
            <>
              <Link
                href="/customer/appointments"
                onClick={() => setMenuOpen(false)}
                className="font-medium text-[#315b3d]"
              >
                Lịch hẹn của tôi
              </Link>

              <Link
                href="/customer/my-orders"
                onClick={() => setMenuOpen(false)}
                className="font-medium text-[#315b3d]"
              >
                Đơn hàng của tôi
              </Link>
            </>
          )}

          {user ? (
            <>
              <Link href={accountUrl}>
                Tài khoản: {user.HoTen}
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="text-left text-red-700"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link href="/login">Đăng nhập</Link>
          )}
        </nav>
      )}
    </header>
  );
}
