
import ManagementLayout from '../../components/layout/ManagementLayout';
import SupportDetails from '../../components/SupportDetails';

export default function StaffSupportDetailsPage() {
  return (
    <ManagementLayout role="staff" title="Chi tiết yêu cầu hậu mãi">
      <SupportDetails role="staff" />
    </ManagementLayout>
  );
}
