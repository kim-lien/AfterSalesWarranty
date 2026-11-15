
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#23432d] text-[#e9f0e7]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <Link href="/" className="text-2xl font-bold text-white">
            NHAI&apos;s Green
          </Link>

          <p className="mt-5 max-w-sm text-sm leading-7 text-[#c9d8c8]">
            Cửa hàng cây cảnh với lựa chọn mua, thuê và
            theo dõi dịch vụ chăm sóc sau mua.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-white">Khám phá</h3>

          <nav className="mt-5 flex flex-col gap-3 text-sm">
            <Link href="/">Trang chủ</Link>
            <Link href="/products">Tất cả sản phẩm</Link>
            <Link href="/products?type=rent">Cây cho thuê</Link>
            <Link href="/about">Giới thiệu cửa hàng</Link>
          </nav>
        </div>

        <div>
          <h3 className="font-semibold text-white">
            Khách hàng
          </h3>

          <nav className="mt-5 flex flex-col gap-3 text-sm">
            <Link href="/login">Đăng nhập</Link>
            <Link href="/register">Đăng ký</Link>
            <Link href="/customer/after-sales">
              Hỗ trợ và bảo hành
            </Link>
          </nav>
        </div>
      </div>

      <div className="border-t border-white/15 px-5 py-5 text-center text-xs text-[#c9d8c8]">
        © {new Date().getFullYear()} NHAI&apos;s Green.
        Cây xanh cho không gian sống.
      </div>
    </footer>
  );
}
