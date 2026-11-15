import ManagementLayout from '../../components/layout/ManagementLayout';
import SupportDashboard from '../../components/SupportDashboard';

export default function StaffSupportPage() {
  return (
    <ManagementLayout role="staff" title="Yêu cầu khách hàng">
      <SupportDashboard />
    </ManagementLayout>
  );
}