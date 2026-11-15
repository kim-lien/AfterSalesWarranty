
import Head from 'next/head';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RoleGuard from '../../components/RoleGuard';
import RoleNavigation from '../../components/RoleNavigation';
import { OrderManager } from '../admin/orders';

export default function StaffOrdersPage() {
  return (
    <RoleGuard allowedRoles={['Nhân viên']}>
      <Head>
        <title>Xử lý đơn mua | NHAI&apos;s Green</title>
      </Head>

      <Header />

      <div className="flex min-h-screen items-stretch bg-[#f8faf5]">
        <RoleNavigation role="staff" />

        <main className="min-w-0 flex-1">
          <OrderManager />
        </main>
      </div>

      <Footer />
    </RoleGuard>
  );
}
