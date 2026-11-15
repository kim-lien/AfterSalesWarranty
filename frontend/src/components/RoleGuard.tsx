
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getUser } from '../api/client';

type RoleGuardProps = {
  children: ReactNode;
  allowedRoles: string[];
};

export default function RoleGuard({
  children,
  allowedRoles,
}: RoleGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = getUser();
    const token = sessionStorage.getItem('token');

    if (!user || !token) {
      router.replace('/login');
      return;
    }

    if (!allowedRoles.includes(user.TenVaiTro)) {
      if (user.TenVaiTro === 'Quản trị viên') {
        router.replace('/admin/support');
      } else if (user.TenVaiTro === 'Nhân viên') {
        router.replace('/staff/support');
      } else {
  router.replace('/');
}
      return;
    }

    setAuthorized(true);
  }, [router, allowedRoles]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  return <>{children}</>;
}
