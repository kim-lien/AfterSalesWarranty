
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '../api/client';

type Role = 'admin' | 'staff';

type Ticket = {
  MaYC: number;
  TieuDe: string;
  TenKhachHang: string;
  NhomYeuCau: string;
  MucDo: string;
  TrangThai: string;
  NgayTao: string;
  MaNVXuLy: number | null;
  HanPhanHoi: string | null;
  HanXuLy: string | null;
  QuaHanPhanHoi: boolean | number | null;
  QuaHanXuLy: boolean | number | null;
};

type FilterType =
  | 'all'
  | 'overdue'
  | 'response'
  | 'processing'
  | 'ontime'
  | 'unassigned';

const completedStatuses = [
  'Đã đóng',
  'Từ chối',
  'Đã hủy',
];

const inputStyle =
  'w-full rounded-xl border border-[#dce5d8] bg-white px-4 py-3 text-sm text-[#315b3d] outline-none focus:border-[#769a75]';

function formatDate(value: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('vi-VN');
}

function getStatus(
  deadline: string | null,
  overdue: boolean,
  completed: boolean,
) {
  if (!deadline) return 'Chưa xác định';
  if (overdue) return 'Quá hạn';
  if (completed) return 'Đúng hạn';

  return 'Trong hạn';
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'Quá hạn':
      return 'bg-[#fcebea] text-[#b53939]';

    case 'Đúng hạn':
      return 'bg-[#dcf5e6] text-[#21734b]';

    case 'Trong hạn':
      return 'bg-[#e8f1e5] text-[#315b3d]';

    default:
      return 'bg-[#f0f1ef] text-[#737b72]';
  }
}

function getPriorityStyle(priority: string) {
  switch (priority) {
    case 'Khẩn cấp':
      return 'text-red-700';

    case 'Cao':
      return 'text-orange-700';

    default:
      return 'text-[#49674c]';
  }
}

export default function SupportSLA({
  role,
}: {
  role: Role;
}) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api<Ticket[]>(
        '/support/tickets',
      );

      setTickets(
        Array.isArray(result) ? result : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải danh sách yêu cầu.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();

    const interval = window.setInterval(() => {
      void loadTickets();
    }, 60000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadTickets]);

  const data = useMemo(() => {
    return tickets.map((ticket) => {
      const completed = completedStatuses.includes(
        ticket.TrangThai,
      );

      const responseOverdue =
        Boolean(ticket.QuaHanPhanHoi);

      const processingOverdue =
        Boolean(ticket.QuaHanXuLy);

      return {
        ...ticket,
        completed,
        responseOverdue,
        processingOverdue,
        responseStatus: getStatus(
          ticket.HanPhanHoi,
          responseOverdue,
          completed,
        ),
        processingStatus: getStatus(
          ticket.HanXuLy,
          processingOverdue,
          completed,
        ),
      };
    });
  }, [tickets]);

  const statistics = useMemo(() => {
    const total = data.length;

    const responseOverdue = data.filter(
      (item) => item.responseOverdue,
    ).length;

    const processingOverdue = data.filter(
      (item) => item.processingOverdue,
    ).length;

    const overdue = data.filter(
      (item) =>
        item.responseOverdue ||
        item.processingOverdue,
    ).length;

    const ontime = data.filter(
      (item) =>
        !item.responseOverdue &&
        !item.processingOverdue &&
        item.HanPhanHoi &&
        item.HanXuLy,
    ).length;

    return {
      total,
      responseOverdue,
      processingOverdue,
      overdue,
      ontime,
    };
  }, [data]);

  const filtered = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return data.filter((ticket) => {
      const matchSearch =
        !search ||
        String(ticket.MaYC).includes(search) ||
        (ticket.TieuDe || '')
          .toLowerCase()
          .includes(search) ||
        (ticket.TenKhachHang || '')
          .toLowerCase()
          .includes(search);

      let matchFilter = true;

      if (filter === 'overdue') {
        matchFilter =
          ticket.responseOverdue ||
          ticket.processingOverdue;
      }

      if (filter === 'response') {
        matchFilter = ticket.responseOverdue;
      }

      if (filter === 'processing') {
        matchFilter = ticket.processingOverdue;
      }

      if (filter === 'ontime') {
        matchFilter =
          !ticket.responseOverdue &&
          !ticket.processingOverdue &&
          Boolean(ticket.HanPhanHoi) &&
          Boolean(ticket.HanXuLy);
      }

      if (filter === 'unassigned') {
        matchFilter =
          !ticket.MaNVXuLy &&
          !ticket.completed;
      }

      return matchSearch && matchFilter;
    });
  }, [data, keyword, filter]);

  const cards = [
    {
      title: 'Tổng yêu cầu',
      value: statistics.total,
    },
    {
      title: 'Quá hạn phản hồi',
      value: statistics.responseOverdue,
    },
    {
      title: 'Quá hạn xử lý',
      value: statistics.processingOverdue,
    },
    {
      title: 'Vi phạm SLA',
      value: statistics.overdue,
    },
  ];

  return (
    <main className="min-w-0 flex-1 bg-[#f8faf5] px-5 py-8 text-[#2c4230]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8aa086]">
              Quản lý dịch vụ khách hàng
            </p>

            <h1 className="mt-2 text-3xl font-bold text-[#315b3d]">
              Theo dõi SLA
            </h1>

            <p className="mt-2 text-sm text-[#728071]">
              {role === 'admin'
                ? 'Tình hình tiếp nhận và xử lý yêu cầu khách hàng'
                : 'Tiến độ các yêu cầu được phân công'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadTickets()}
            disabled={loading}
            className="rounded-xl border border-[#cbdcc5] bg-white px-5 py-3 text-sm font-semibold text-[#315b3d] transition hover:bg-[#edf4e9] disabled:opacity-50"
          >
            Làm mới
          </button>
        </div>

        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[#dfe8db] bg-white p-5"
            >
              <p className="text-sm text-[#7b8979]">
                {card.title}
              </p>

              <p className="mt-3 text-3xl font-bold text-[#315b3d]">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#dfe8db] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e7ede4] px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-[#315b3d]">
                Danh sách yêu cầu
              </h2>

              <p className="mt-1 text-sm text-[#829080]">
                {filtered.length} yêu cầu
              </p>
            </div>
          </div>

          <div className="grid gap-3 border-b border-[#e7ede4] p-5 md:grid-cols-[1fr_230px]">
            <input
              type="search"
              value={keyword}
              onChange={(event) =>
                setKeyword(event.target.value)
              }
              placeholder="Tìm mã yêu cầu, khách hàng..."
              className={inputStyle}
            />

            <select
              value={filter}
              onChange={(event) =>
                setFilter(
                  event.target.value as FilterType,
                )
              }
              className={inputStyle}
            >
              <option value="all">
                Tất cả trạng thái SLA
              </option>

              <option value="ontime">
                Không quá hạn
              </option>

              <option value="overdue">
                Vi phạm SLA
              </option>

              <option value="response">
                Quá hạn phản hồi
              </option>

              <option value="processing">
                Quá hạn xử lý
              </option>

              {role === 'admin' && (
                <option value="unassigned">
                  Chưa phân công
                </option>
              )}
            </select>
          </div>

          {error && (
            <div
              role="alert"
              className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead>
                <tr className="bg-[#edf3e9] text-[#315b3d]">
                  <th className="px-5 py-4 font-semibold">
                    Mã yêu cầu
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Khách hàng
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Nội dung
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Trạng thái
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Hạn phản hồi
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    SLA phản hồi
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Hạn xử lý
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    SLA xử lý
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((ticket) => (
                  <tr
                    key={ticket.MaYC}
                    className="border-t border-[#edf0ea] transition hover:bg-[#fafcf8]"
                  >
                    <td className="px-5 py-4 align-top font-semibold text-[#315b3d]">
                      #{ticket.MaYC}
                    </td>

                    <td className="px-5 py-4 align-top">
                      {ticket.TenKhachHang}
                    </td>

                    <td className="px-5 py-4 align-top">
                      <p className="max-w-52 font-medium text-[#315b3d]">
                        {ticket.TieuDe}
                      </p>

                      <p className="mt-1 text-xs text-[#8a9588]">
                        {ticket.NhomYeuCau}
                      </p>

                      <p
                        className={`mt-2 text-xs font-medium ${getPriorityStyle(ticket.MucDo)}`}
                      >
                        Ưu tiên: {ticket.MucDo}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span className="font-medium">
                        {ticket.TrangThai}
                      </span>

                      {!ticket.MaNVXuLy &&
                        !ticket.completed && (
                          <p className="mt-1 text-xs text-[#b17d32]">
                            Chưa phân công
                          </p>
                        )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 align-top">
                      {formatDate(ticket.HanPhanHoi)}
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span
                        className={`inline-block whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(ticket.responseStatus)}`}
                      >
                        {ticket.responseStatus}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 align-top">
                      {formatDate(ticket.HanXuLy)}
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span
                        className={`inline-block whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(ticket.processingStatus)}`}
                      >
                        {ticket.processingStatus}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <Link
                        href={`/${role}/supportdetail?id=${ticket.MaYC}`}
                        className="inline-flex whitespace-nowrap rounded-lg border border-[#c7dac1] px-3 py-2 text-xs font-semibold text-[#315b3d] transition hover:bg-[#edf4e9]"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && tickets.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-[#829080]">
              Đang tải danh sách yêu cầu...
            </div>
          )}

          {!loading && filtered.length === 0 && !error && (
            <div className="px-6 py-12 text-center">
              <p className="text-base font-semibold text-[#315b3d]">
                Chưa có dữ liệu
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
