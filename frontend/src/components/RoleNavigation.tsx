
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

type Role = 'admin' | 'staff';

type MenuItem = {
  label: string;
  href: string;
  group: string;
};

const adminMenu: MenuItem[] = [
  { label: 'Tổng quan & hậu mãi', href: '/admin/support', group: 'Tổng quan' },
  { label: 'Theo dõi SLA', href: '/admin/sla', group: 'Tổng quan' },

  { label: 'Đơn mua hàng', href: '/admin/orders', group: 'Đơn hàng' },
  { label: 'Đơn thuê cây', href: '/admin/rentals', group: 'Đơn hàng' },
  { label: 'Thanh toán', href: '/admin/payments', group: 'Đơn hàng' },

  { label: 'Sản phẩm', href: '/admin/products', group: 'Cửa hàng' },
  { label: 'Danh mục sản phẩm', href: '/admin/categories', group: 'Cửa hàng' },
  { label: 'Kho & tồn kho', href: '/admin/inventory', group: 'Cửa hàng' },
  { label: 'Khuyến mãi', href: '/admin/promotions', group: 'Cửa hàng' },
  { label: 'Chính sách dịch vụ', href: '/admin/services', group: 'Cửa hàng' },

  { label: 'Quản lý bảo hành', href: '/admin/warranties', group: 'Hậu mãi' },
{ label: 'Quản lý hậu mãi & chăm sóc cây', href: '/admin/aftersales', group: 'Hậu mãi' },
{ label: 'Quản lý lịch hẹn', href: '/admin/appointments', group: 'Hậu mãi' },
  
  { label: 'Khách hàng', href: '/admin/customers', group: 'Hệ thống' },
  { label: 'Nhân viên', href: '/admin/staff', group: 'Hệ thống' },
  { label: 'Báo cáo & thống kê', href: '/admin/reports', group: 'Hệ thống' },
];

const staffMenu: MenuItem[] = [
  { label: 'Yêu cầu khách hàng', href: '/staff/support', group: 'Hậu mãi' },
  { label: 'Theo dõi SLA', href: '/staff/sla', group: 'Hậu mãi' },
  { label: 'Xử lý bảo hành', href: '/staff/warranties', group: 'Hậu mãi' },
  { label: 'Xử lý hậu mãi & chăm sóc cây', href: '/staff/aftersales', group: 'Hậu mãi' },

  { label: 'Xử lý đơn mua', href: '/staff/orders', group: 'Đơn hàng' },
  { label: 'Xử lý đơn thuê', href: '/staff/rentals', group: 'Đơn hàng' },

  { label: 'Kiểm tra tồn kho', href: '/staff/inventory', group: 'Cửa hàng' },

  { label: 'Lịch hẹn bảo hành & hậu mãi', href: '/staff/appointments', group: 'Hậu mãi' },
{ label: 'Thông tin khách hàng', href: '/staff/customers', group: 'Khách hàng' },
];

export function getRoleLinks(role: Role) {
  return role === 'admin' ? adminMenu : staffMenu;
}

export default function RoleNavigation({ role }: { role: Role }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menu = getRoleLinks(role);
  const groups = Array.from(new Set(menu.map((item) => item.group)));

  const title = role === 'admin'
    ? 'Trung tâm quản trị'
    : 'Khu vực nhân viên';

  return (
    <aside className="w-full shrink-0 border-b border-[#dce5d7] bg-[#eef3e9] lg:w-64 lg:border-b-0 lg:border-r xl:w-72">
      <div className="flex flex-col lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)]">
        <div className="flex items-center justify-between border-b border-[#d8e4d3] px-5 py-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#81977b]">
              NHAI&apos;S GREEN
            </p>

            <h2 className="mt-2 text-xl font-bold text-[#315b3d]">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            className="rounded-lg border border-[#c4d5bd] bg-white px-4 py-2 text-sm text-[#315b3d] lg:hidden"
          >
            {mobileOpen ? 'Đóng' : 'Danh mục'}
          </button>
        </div>

        <nav
          aria-label={title}
          className={`overflow-y-auto px-3 py-5 lg:block lg:px-4 ${
            mobileOpen ? 'block' : 'hidden'
          }`}
        >
          {groups.map((group) => (
            <div key={group} className="mb-6">
              <h3 className="mb-3 px-4 text-xs font-bold uppercase tracking-[0.15em] text-[#8ca285]">
                {group}
              </h3>

              <div className="space-y-1">
                {menu
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const active = router.asPath.split('?')[0] === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                          active
                            ? 'bg-[#315b3d] text-white shadow-sm'
                            : 'text-[#47634b] hover:bg-[#deead8]'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}

          <div className="mt-6 border-t border-[#d8e4d3] pt-5">
            <Link
              href="/"
              className="block rounded-xl border border-[#bfd0b7] bg-white px-4 py-3 text-center text-sm font-semibold text-[#315b3d] hover:bg-[#e3eddf]"
            >
              Về trang chủ cửa hàng
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  );
}
