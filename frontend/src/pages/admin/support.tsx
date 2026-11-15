import ManagementLayout from '../../components/layout/ManagementLayout';
import SupportDashboard from '../../components/SupportDashboard';

export default function AdminSupportPage() {
  return (
    <ManagementLayout role="admin" title="Tổng quan và hậu mãi">
      <SupportDashboard />
    </ManagementLayout>
  );
}