
import ManagementLayout from '../../components/layout/ManagementLayout';
import SupportDetails from '../../components/SupportDetails';

export default function AdminSupportDetailsPage() {
  return (
    <ManagementLayout role="admin" title="Chi tiết yêu cầu hậu mãi">
      <SupportDetails role="admin" />
    </ManagementLayout>
  );
}
