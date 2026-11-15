
import Head from 'next/head';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RoleGuard from '../../components/RoleGuard';
import RoleNavigation from '../../components/RoleNavigation';
import SupportSLA from '../../components/SupportSLA';

export default function AdminSLAPage() {
  return (
    <RoleGuard allowedRoles={['Quản trị viên']}>
      <Head>
        <title>Theo dõi SLA | NHAI&apos;s Green</title>
      </Head>

      <Header />

      <div className="flex min-h-screen items-stretch bg-[#f8faf5]">
        <RoleNavigation role="admin" />

        <SupportSLA role="admin" />
      </div>

      <Footer />
    </RoleGuard>
  );
}
