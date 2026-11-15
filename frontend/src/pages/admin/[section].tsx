
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RoleGuard from '../../components/RoleGuard';
import RoleNavigation, {
  getRoleLinks,
} from '../../components/RoleNavigation';

export default function AdminSectionPage() {
  const router = useRouter();
  const section = router.query.section;

  const item = getRoleLinks('admin').find(
    (entry) => entry.href === `/admin/${section}`,
  );

  return (
    <RoleGuard allowedRoles={['Quản trị viên']}>
      <Head>
        <title>{item?.label || 'Quản trị'} | NHAI&apos;s Green</title>
      </Head>

      <Header />
      <RoleNavigation role="admin" />

      <main className="min-h-[55vh] bg-[#f8faf5] px-5 py-14">
        <div className="mx-auto max-w-5xl rounded-2xl border border-[#dce6d6] bg-white p-10">
          <h1 className="text-3xl font-semibold text-[#315b3d]">
            {item?.label || 'Chức năng quản trị'}
          </h1>

          <p className="mt-5 leading-8 text-gray-600">
            {item
              ? 'Trang quản lý đã được phân chia trong hệ thống. Giao diện thao tác và API cho chức năng này chưa hoàn thiện.'
              : 'Không tìm thấy danh mục quản trị phù hợp.'}
          </p>

          <Link
            href="/admin/support"
            className="mt-8 inline-block rounded-full bg-[#315b3d] px-6 py-3 text-white"
          >
            Về tổng quan quản trị
          </Link>
        </div>
      </main>

      <Footer />
    </RoleGuard>
  );
}
