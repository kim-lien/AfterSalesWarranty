
import type { ReactNode } from 'react';
import Head from 'next/head';
import Header from '../Header';
import Footer from '../Footer';
import RoleGuard from '../RoleGuard';
import RoleNavigation from '../RoleNavigation';

type ManagementLayoutProps = {
  role: 'admin' | 'staff';
  title: string;
  children: ReactNode;
};

export default function ManagementLayout({
  role,
  title,
  children,
}: ManagementLayoutProps) {
  const allowedRoles =
    role === 'admin'
      ? ['Quản trị viên']
      : ['Nhân viên'];

  return (
    <RoleGuard allowedRoles={allowedRoles}>
      <Head>
        <title>{title} | NHAI&apos;s Green</title>
      </Head>

      <div className="flex min-h-screen flex-col bg-[#f8faf5]">
        <Header />

        <div className="flex flex-1 flex-col lg:flex-row">
          <RoleNavigation role={role} />

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="min-w-0 flex-1">
              {children}
            </div>

            <Footer />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
