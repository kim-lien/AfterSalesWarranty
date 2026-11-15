
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { api } from '../../api/client';

type AfterSalesTicket = {
  MaYC: number;
  TieuDe: string;
  NhomYeuCau: string;
  LoaiYeuCau: string;
  TrangThai: string;
  MucDo: string;
  TenKhachHang?: string;
  MaNVXuLy: number | null;
  QuaHanPhanHoi: boolean | null;
  QuaHanXuLy: boolean | null;
};

export default function StaffAfterSalesPage() {
  const [tickets, setTickets] = useState<AfterSalesTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAfterSales() {
      try {
        const result = await api<AfterSalesTicket[]>(
          '/support/tickets',
        );

        setTickets(
          result.filter(
            (ticket) => ticket.NhomYeuCau === 'Hậu mãi',
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Không thể tải yêu cầu hậu mãi.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadAfterSales();
  }, []);

  return (
    <ManagementLayout
      role="staff"
      title="Xử lý hậu mãi và chăm sóc cây"
    >
      <main className="min-h-screen bg-[#f8faf5] px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-[#315b3d]">
            Xử lý hậu mãi và chăm sóc cây
          </h1>

          <p className="mt-2 text-gray-600">
            Theo dõi và xử lý yêu cầu chăm sóc cây được phân công.
          </p>

          <div className="my-7 rounded-2xl border border-[#dce7d8] bg-white p-6">
            <p className="text-gray-500">
              Tổng yêu cầu hậu mãi
            </p>

            <p className="mt-2 text-3xl font-bold text-[#315b3d]">
              {tickets.length}
            </p>
          </div>

          {error && (
            <p className="mb-5 rounded-xl bg-red-50 p-4 text-red-600">
              {error}
            </p>
          )}

          <section className="overflow-hidden rounded-2xl border border-[#dce7d8] bg-white">
            <div className="border-b p-5">
              <h2 className="text-xl font-bold text-[#315b3d]">
                Danh sách yêu cầu hậu mãi
              </h2>
            </div>

            {loading ? (
              <p className="p-6 text-gray-500">
                Đang tải dữ liệu...
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-[#eef3eb]">
                    <tr>
                      <th className="p-4">Mã</th>
                      <th className="p-4">Yêu cầu</th>
                      <th className="p-4">Khách hàng</th>
                      <th className="p-4">Mức độ</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4">SLA</th>
                      <th className="p-4">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {tickets.map((ticket) => {
                      const overdue =
                        ticket.QuaHanPhanHoi === true ||
                        ticket.QuaHanXuLy === true;

                      return (
                        <tr
                          key={ticket.MaYC}
                          className="border-t border-[#edf0e9]"
                        >
                          <td className="p-4 font-semibold">
                            #{ticket.MaYC}
                          </td>

                          <td className="p-4">
                            <p className="font-medium">
                              {ticket.TieuDe}
                            </p>

                            <p className="mt-1 text-gray-500">
                              {ticket.LoaiYeuCau}
                            </p>
                          </td>

                          <td className="p-4">
                            {ticket.TenKhachHang ?? '-'}
                          </td>

                          <td className="p-4">
                            {ticket.MucDo}
                          </td>

                          <td className="p-4">
                            {ticket.TrangThai}
                          </td>

                          <td className="p-4">
                            <span
                              className={
                                overdue
                                  ? 'font-semibold text-red-600'
                                  : 'text-green-700'
                              }
                            >
                              {overdue
                                ? 'Vi phạm SLA'
                                : 'Chưa ghi nhận vi phạm'}
                            </span>
                          </td>

                          <td className="p-4">
                            <Link
                              href={{
                                pathname: '/staff/supportdetail',
                                query: { id: ticket.MaYC },
                              }}
                              className="font-semibold text-[#315b3d] hover:underline"
                            >
                              Xem và xử lý
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {tickets.length === 0 && (
                  <p className="p-6 text-center text-gray-500">
                    Không có yêu cầu hậu mãi.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </ManagementLayout>
  );
}
