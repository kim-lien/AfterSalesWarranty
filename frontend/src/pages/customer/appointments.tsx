
import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RoleGuard from '../../components/RoleGuard';

type Appointment = {
  MaLich: number;
  MaYC: number;
  NhomYeuCau: string;
  LoaiCongViec: string;
  NgayHen: string;
  NgayHoanTat: string | null;
  DiaDiem: string | null;
  TrangThai: string;
  KetQua: string | null;
  TenNhanVien: string | null;
};

type Response = {
  success: boolean;
  data: Appointment[];
};

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleString('vi-VN')
    : 'Chưa cập nhật';
}

export default function CustomerAppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api<Response>(
        '/support/appointments',
      );

      setItems(response.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải lịch hẹn',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <RoleGuard allowedRoles={['Khách hàng']}>
      <Head>
        <title>Lịch hẹn của tôi | NHAI&apos;s Green</title>
      </Head>

      <Header />

      <main className="min-h-screen bg-[#f8faf5] px-5 py-10 text-[#294530]">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link
                href="/customer/after-sales"
                className="text-sm text-[#648665]"
              >
                ← Yêu cầu hỗ trợ
              </Link>

              <h1 className="mt-4 text-3xl font-bold text-[#315b3d]">
                Lịch hẹn của tôi
              </h1>
            </div>

            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl border border-[#cbdac7] bg-white px-5 py-3 font-semibold"
            >
              Làm mới
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="mb-5 rounded-xl bg-red-50 p-4 text-red-700"
            >
              {error}
            </p>
          )}

          <div className="space-y-5">
            {items.map((item) => (
              <article
                key={item.MaLich}
                className="rounded-2xl border border-[#dce7d8] bg-white p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#648665]">
  {item.NhomYeuCau === 'Bảo hành'
    ? 'Lịch hẹn bảo hành'
    : 'Lịch hẹn hậu mãi'}
</p>

                    <h2 className="mt-2 text-xl font-bold text-[#315b3d]">
                      {item.LoaiCongViec}
                    </h2>
                  </div>

                  <span className="rounded-full bg-[#edf3e9] px-4 py-2 text-sm font-semibold">
                    {item.TrangThai}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 border-t pt-5 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-gray-500">Ngày hẹn</p>
                    <p className="mt-1 font-semibold">
                      {formatDate(item.NgayHen)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Nhân viên phụ trách
                    </p>
                    <p className="mt-1 font-semibold">
                      {item.TenNhanVien || 'Chưa cập nhật'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Địa điểm</p>
                    <p className="mt-1 font-semibold">
                      {item.DiaDiem || 'Chưa cập nhật'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Ngày hoàn tất</p>
                    <p className="mt-1 font-semibold">
                      {formatDate(item.NgayHoanTat)}
                    </p>
                  </div>
                </div>

                {item.TrangThai === 'Hoàn tất' &&
                  item.KetQua && (
                    <div className="mt-5 rounded-xl bg-[#f1f6ed] p-4">
                      <h3 className="font-semibold text-[#315b3d]">
                        Kết quả thực hiện
                      </h3>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7">
                        {item.KetQua}
                      </p>
                    </div>
                  )}
              </article>
            ))}
          </div>

          {loading && (
            <p className="py-10 text-center text-gray-500">
              Đang tải lịch hẹn...
            </p>
          )}

          {!loading && items.length === 0 && !error && (
            <div className="rounded-2xl border border-[#dce7d8] bg-white p-10 text-center">
              <p className="font-semibold text-[#315b3d]">
                Chưa có lịch hẹn
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </RoleGuard>
  );
}
