
import RoleGuard from '../../components/RoleGuard';
import SupportDashboard from '../../components/SupportDashboard';

export default function CustomerAfterSalesPage() {
  return (
    <RoleGuard allowedRoles={['Khách hàng']}>
      <SupportDashboard />
    </RoleGuard>
  );
}
