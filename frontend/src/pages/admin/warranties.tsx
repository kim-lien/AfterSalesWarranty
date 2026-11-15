
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { api } from '../../api/client';

type WarrantyTicket = {
  MaYC: number;
  TieuDe: string;
  NhomYeuCau: string;
  LoaiYeuCau: string;
  TrangThai: string;
  MucDo: string;
  TenKhachHang?: string;
  MaNVXuLy: number | null;
  HanPhanHoi: string | null;
  HanXuLy: string | null;
  QuaHanPhanHoi: boolean | null;
  QuaHanXuLy: boolean | null;
};

export default function AdminWarrantiesPage() {
  const [tickets, setTickets] = useState<WarrantyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadWarranties() {
      try {
        const result = await api<WarrantyTicket[]>(
          '/support/tickets',
        );

        setTickets(
          result.filter(
            (ticket) => ticket.NhomYeuCau === 'Bảo hành',
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Không thể tải yêu cầu bảo hành.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadWarranties();
  }, []);

  return (
    <ManagementLayout
      role="admin"
      title="Quản lý bảo hành"
    >
      <main className="min-h-screen bg-[#f8faf5] px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#315b3d]">
              Quản lý bảo hành
            </h1>

            <p className="mt-2 text-gray-600">
              Tiếp nhận, phân công và theo dõi yêu cầu bảo hành cây cảnh.
            </p>
          </div>

          <div className="mb-6 rounded-2xl border border-[#dce7d8] bg-white p-6">
            <p className="text-gray-500">
              Tổng yêu cầu bảo hành
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
                Danh sách yêu cầu bảo hành
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
                              {overdue ? 'Vi phạm SLA' : 'Chưa ghi nhận vi phạm'}
                            </span>
                          </td>

                          <td className="p-4">
                            <Link
                              href={{
                                pathname: '/admin/supportdetail',
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
                    Không có yêu cầu bảo hành.
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
