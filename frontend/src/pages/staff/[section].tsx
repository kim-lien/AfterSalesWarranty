
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RoleGuard from '../../components/RoleGuard';
import RoleNavigation, {
  getRoleLinks,
} from '../../components/RoleNavigation';

export default function StaffSectionPage() {
  const router = useRouter();

  const section =
    typeof router.query.section === 'string'
      ? router.query.section
      : '';

  const item = getRoleLinks('staff').find(
    (entry) => entry.href === `/staff/${section}`,
  );

  return (
    <RoleGuard allowedRoles={['Nhân viên']}>
      <Head>
        <title>
          {item?.label || 'Chức năng nhân viên'} | NHAI&apos;s Green
        </title>
      </Head>

      <Header />

      <div className="flex min-h-screen items-stretch bg-[#f8faf5]">
        <RoleNavigation role="staff" />

        <main className="min-w-0 flex-1 px-5 py-8 text-[#294530]">
          <div className="mx-auto max-w-6xl">
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#829a7c]">
                NHAI&apos;s Green
              </p>

              <h1 className="mt-3 text-3xl font-bold text-[#315b3d]">
                {item?.label || 'Chức năng nhân viên'}
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Khu vực quản lý và xử lý công việc.
              </p>
            </div>

            <section className="rounded-2xl border border-[#dce7d8] bg-white p-8">
              {item ? (
                <>
                  <h2 className="text-xl font-semibold text-[#315b3d]">
                    {item.label}
                  </h2>

                  <p className="mt-4 leading-7 text-gray-600">
                    Chức năng này đang được hoàn thiện.
                  </p>

                  <Link
                    href="/staff/support"
                    className="mt-6 inline-flex rounded-xl bg-[#315b3d] px-5 py-3 font-semibold text-white"
                  >
                    Xem yêu cầu khách hàng
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-[#315b3d]">
                    Không tìm thấy chức năng
                  </h2>

                  <p className="mt-4 text-gray-600">
                    Đường dẫn không thuộc danh mục chức năng của nhân viên.
                  </p>

                  <Link
                    href="/staff/support"
                    className="mt-6 inline-flex rounded-xl bg-[#315b3d] px-5 py-3 font-semibold text-white"
                  >
                    Về trang quản lý yêu cầu
                  </Link>
                </>
              )}
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </RoleGuard>
  );
}
