import TicketImages from '../../components/TicketImages';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, getUser } from '../../api/client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RoleGuard from '../../components/RoleGuard';

type Account = {
  MaNguoiDung?: number;
  HoTen?: string;
  TenVaiTro?: string;
};

type Ticket = {
  MaYC: number;
  MaDH: number | null;
  MaDT: number | null;
  TieuDe: string;
  MoTa: string | null;
  NhomYeuCau: string;
  LoaiYeuCau: string;
  TrangThai: string;
  MucDo: string;
  TenKhachHang: string;
  TenKenh: string | null;
  MaKenhTiepNhan: number;
  NgayTao: string;
  NgayPhanHoiDau: string | null;
  NgayDong: string | null;
  KetQua: string | null;
  QuaHanPhanHoi: boolean | null;
  QuaHanXuLy: boolean | null;
  MaBH: number | null;
  TrangThaiBaoHanh: string | null;
  KetQuaKiemTra: string | null;
  HuongXuLy: string | null;
};

type Message = {
  MaTuongTac: number;
  MaNguoiDung: number;
  HoTen: string | null;
  TenKenh: string;
  NoiDung: string;
  LoaiTuongTac: string;
  ThoiGian: string;
};

type History = {
  MaLSTS: number;
  TrangThaiCu: string | null;
  TrangThaiMoi: string;
  LyDo: string | null;
  HoTen: string | null;
  ThoiGian: string;
};

type TicketDetail = {
  ticket: Ticket;
  messages: Message[];
  history: History[];
};

type Channel = {
  MaKenh: number;
  TenKenh: string;
};

const cardClass =
  'rounded-2xl border border-[#dce7d8] bg-white p-6';

function formatDate(value: string | null | undefined) {
  if (!value) return 'Chưa có';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Không xác định';
  }

  return date.toLocaleString('vi-VN');
}

function statusClass(value: string) {
  if (['Đã xử lý', 'Đã đóng', 'Hoàn tất'].includes(value)) {
    return 'bg-green-100 text-green-800';
  }

  if (['Đã hủy', 'Từ chối'].includes(value)) {
    return 'bg-red-100 text-red-700';
  }

  if (['Đang xử lý', 'Đang xác minh'].includes(value)) {
    return 'bg-blue-100 text-blue-800';
  }

  return 'bg-amber-100 text-amber-800';
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${statusClass(value)}`}
    >
      {value}
    </span>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="border-b border-[#edf1e9] py-3 last:border-0">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 font-semibold text-[#315b3d]">
        {value ?? 'Chưa có'}
      </p>
    </div>
  );
}

export default function CustomerSupportDetailPage() {
  const router = useRouter();

  const rawId = router.query.id;

  const id =
    typeof rawId === 'string' ? Number(rawId) : NaN;

  const [detail, setDetail] = useState<TicketDetail | null>(
    null,
  );
  const [channels, setChannels] = useState<Channel[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [message, setMessage] = useState('');
  const [channelId, setChannelId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadDetail = useCallback(async () => {
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError('Mã yêu cầu không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const result = await api<TicketDetail>(
        `/support/tickets/${id}`,
      );

      setDetail(result);
      setError('');
    } catch (err) {
      setDetail(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải thông tin yêu cầu.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setAccount(getUser() as Account | null);

    async function loadChannels() {
      try {
        const result = await api<Channel[]>(
          '/support/channels',
        );

        setChannels(result);

        const website = result.find(
          (item) => item.TenKenh === 'Website',
        );

        if (website) {
          setChannelId(website.MaKenh);
        }
      } catch {
        setChannels([]);
      }
    }

    void loadChannels();
  }, []);

  useEffect(() => {
    if (router.isReady) {
      void loadDetail();
    }
  }, [router.isReady, loadDetail]);

  const ticket = detail?.ticket;

  const history = useMemo(
    () =>
      [...(detail?.history || [])].sort(
        (a, b) =>
          new Date(b.ThoiGian).getTime() -
          new Date(a.ThoiGian).getTime(),
      ),
    [detail],
  );

  const messages = useMemo(
    () =>
      [...(detail?.messages || [])]
        .filter(
          (item) =>
            item.LoaiTuongTac !== 'Hình ảnh' &&
            Boolean(item.NoiDung?.trim()),
        )
        .sort(
          (a, b) =>
            new Date(a.ThoiGian).getTime() -
            new Date(b.ThoiGian).getTime(),
        ),
    [detail],
  );

  const processedHistory = history.find(
    (item) =>
      ['Đã xử lý', 'Đã đóng', 'Từ chối'].includes(
        item.TrangThaiMoi,
      ) && Boolean(item.LyDo?.trim()),
  );

  const resultText =
    ticket?.KetQua?.trim() ||
    processedHistory?.LyDo?.trim() ||
    ticket?.KetQuaKiemTra?.trim() ||
    '';

  const isProcessed = Boolean(
    ticket &&
      ['Đã xử lý', 'Đã đóng'].includes(
        ticket.TrangThai,
      ),
  );

  const isClosed = Boolean(
    ticket &&
      ['Đã đóng', 'Đã hủy', 'Từ chối'].includes(
        ticket.TrangThai,
      ),
  );

  async function sendMessage(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!ticket || saving || !message.trim()) return;

    const maKenh =
      channelId || ticket.MaKenhTiepNhan;

    if (!maKenh) {
      setError('Chưa xác định được kênh trao đổi.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await api(
        `/support/tickets/${ticket.MaYC}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            maKenh,
            noiDung: message.trim(),
          }),
        },
      );

      setMessage('');
      setNotice('Đã gửi phản hồi đến cửa hàng.');
      await loadDetail();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể gửi phản hồi.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <RoleGuard allowedRoles={['Khách hàng']}>
      <Head>
        <title>
          Chi tiết yêu cầu hỗ trợ | NHAI&apos;s Green
        </title>
      </Head>

      <div className="min-h-screen bg-[#f8faf5] text-[#294530]">
        <Header />

        <main className="mx-auto max-w-5xl px-5 py-10">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link
                href="/customer/after-sales"
                className="text-sm font-medium text-[#648665]"
              >
                ← Quay lại yêu cầu hỗ trợ
              </Link>

              <h1 className="mt-4 text-3xl font-bold text-[#315b3d]">
                Chi tiết yêu cầu
                {ticket ? ` #${ticket.MaYC}` : ''}
              </h1>

              <p className="mt-2 text-gray-500">
                Theo dõi yêu cầu và trao đổi với NHAI&apos;s Green.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadDetail()}
              disabled={loading || saving}
              className="rounded-xl border border-[#bfd3ba] bg-white px-5 py-3 font-semibold text-[#315b3d] disabled:opacity-50"
            >
              Làm mới
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
            >
              {error}
            </div>
          )}

          {notice && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
              {notice}
            </div>
          )}

          {loading ? (
            <div className={cardClass}>
              Đang tải thông tin yêu cầu...
            </div>
          ) : !ticket || !detail ? (
            <div className={cardClass}>
              <p>Không tìm thấy yêu cầu hỗ trợ.</p>
              <Link
                href="/customer/after-sales"
                className="mt-5 inline-block rounded-xl bg-[#315b3d] px-5 py-3 text-white"
              >
                Quay lại danh sách
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <section className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <p className="text-sm text-gray-500">
                      Yêu cầu #{ticket.MaYC}
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-[#315b3d]">
                      {ticket.TieuDe}
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                      Gửi ngày {formatDate(ticket.NgayTao)}
                    </p>
                  </div>

                  <StatusBadge value={ticket.TrangThai} />
                </div>

                <div className="mt-6 grid gap-x-8 sm:grid-cols-2">
                  <Info
                    title="Nhóm yêu cầu"
                    value={ticket.NhomYeuCau}
                  />
                  <Info
                    title="Loại yêu cầu"
                    value={ticket.LoaiYeuCau}
                  />
                  <Info
                    title="Đơn hàng liên quan"
                    value={
                      ticket.MaDT
                        ? `Đơn thuê #${ticket.MaDT}`
                        : ticket.MaDH
                          ? `Đơn mua #${ticket.MaDH}`
                          : 'Chưa có'
                    }
                  />
                  <Info
                    title="Mức độ ưu tiên"
                    value={ticket.MucDo}
                  />
                  <Info
                    title="Kênh tiếp nhận"
                    value={ticket.TenKenh}
                  />
                  <Info
                    title="Thời điểm phản hồi đầu tiên"
                    value={formatDate(
                      ticket.NgayPhanHoiDau,
                    )}
                  />
                </div>

                <div className="mt-5 border-t border-[#edf1e9] pt-5">
                  <h3 className="font-bold text-[#315b3d]">
                    Nội dung yêu cầu
                  </h3>

                  <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
                    {ticket.MoTa || 'Chưa có mô tả.'}
                  </p>
                </div>
              </section>

              {isProcessed && (
                <section className="rounded-2xl border border-[#c9dec3] bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-[#315b3d]">
                      Kết quả xử lý
                    </h2>
                    <StatusBadge value={ticket.TrangThai} />
                  </div>

                  <p className="mt-4 whitespace-pre-wrap rounded-xl bg-[#f0f7ec] p-5 leading-7 text-[#315b3d]">
                    {resultText ||
                      'Cửa hàng đã cập nhật kết quả xử lý. Bạn có thể xem lịch sử trao đổi bên dưới.'}
                  </p>

                  {ticket.NgayDong && (
                    <p className="mt-3 text-sm text-gray-500">
                      Hoàn tất ngày {formatDate(ticket.NgayDong)}
                    </p>
                  )}
                </section>
              )}

              {ticket.TrangThai === 'Từ chối' && (
                <section className="rounded-2xl border border-red-200 bg-white p-6">
                  <h2 className="text-xl font-bold text-red-700">
                    Kết quả xem xét
                  </h2>
                  <p className="mt-4 whitespace-pre-wrap text-gray-700">
                    {resultText || 'Yêu cầu không được chấp thuận.'}
                  </p>
                </section>
              )}

              {ticket.NhomYeuCau === 'Bảo hành' &&
                ticket.MaBH && (
                  <section className={cardClass}>
                    <h2 className="text-xl font-bold text-[#315b3d]">
                      Phiếu bảo hành #{ticket.MaBH}
                    </h2>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Info
                        title="Trạng thái bảo hành"
                        value={ticket.TrangThaiBaoHanh}
                      />
                      <Info
                        title="Hướng xử lý"
                        value={ticket.HuongXuLy}
                      />
                    </div>
                  </section>
                )}

<TicketImages
  ticketId={ticket.MaYC}
  allowUpload={
    !['Đã đóng', 'Đã hủy', 'Từ chối'].includes(
      ticket.TrangThai,
    )
  }
/>

              <section className={cardClass}>
                <h2 className="text-xl font-bold text-[#315b3d]">
                  Tiến độ xử lý
                </h2>

                {history.length === 0 ? (
                  <p className="mt-5 text-gray-500">
                    Yêu cầu đã được tiếp nhận.
                  </p>
                ) : (
                  <div className="mt-5 space-y-4">
                    {history.map((item) => (
                      <div
                        key={item.MaLSTS}
                        className="border-l-2 border-[#a8cba2] py-1 pl-5"
                      >
                        <p className="font-semibold text-[#315b3d]">
                          {item.TrangThaiCu
                            ? `${item.TrangThaiCu} → ${item.TrangThaiMoi}`
                            : item.TrangThaiMoi}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(item.ThoiGian)}
                        </p>

                        {item.LyDo && (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                            {item.LyDo}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className={cardClass}>
                <h2 className="text-xl font-bold text-[#315b3d]">
                  Trao đổi với cửa hàng
                </h2>

                {messages.length === 0 ? (
                  <p className="mt-5 text-sm text-gray-500">
                    Chưa có tin nhắn trao đổi.
                  </p>
                ) : (
                  <div className="mt-5 space-y-4">
                    {messages.map((item) => {
                      const mine =
                        Number(item.MaNguoiDung) ===
                        Number(account?.MaNguoiDung);

                      return (
                        <div
                          key={item.MaTuongTac}
                          className={`rounded-xl p-4 ${
                            mine
                              ? 'bg-[#e9f3e5]'
                              : 'bg-[#f5f7f3]'
                          }`}
                        >
                          <div className="flex flex-wrap justify-between gap-2">
                            <span className="font-semibold text-[#315b3d]">
                              {mine
                                ? 'Bạn'
                                : item.HoTen || 'NHAI\'s Green'}
                            </span>

                            <span className="text-xs text-gray-500">
                              {formatDate(item.ThoiGian)}
                            </span>
                          </div>

                          <p className="mt-3 whitespace-pre-wrap leading-7">
                            {item.NoiDung}
                          </p>

                          <p className="mt-2 text-xs text-gray-500">
                            {item.TenKenh}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!isClosed && (
                  <form
                    onSubmit={(event) =>
                      void sendMessage(event)
                    }
                    className="mt-7 border-t border-[#edf1e9] pt-6"
                  >
                    <label
                      htmlFor="customer-reply"
                      className="mb-3 block font-semibold"
                    >
                      Gửi phản hồi
                    </label>

                    <textarea
                      id="customer-reply"
                      rows={4}
                      value={message}
                      onChange={(event) =>
                        setMessage(event.target.value)
                      }
                      maxLength={3000}
                      placeholder="Nhập nội dung bạn muốn trao đổi với cửa hàng..."
                      className="w-full rounded-xl border border-[#cfdfca] p-4 outline-none focus:border-[#315b3d]"
                    />

                    <button
                      type="submit"
                      disabled={saving || !message.trim()}
                      className="mt-4 rounded-xl bg-[#315b3d] px-6 py-3 font-semibold text-white disabled:opacity-50"
                    >
                      {saving
                        ? 'Đang gửi...'
                        : 'Gửi phản hồi'}
                    </button>
                  </form>
                )}
              </section>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/customer/after-sales"
                  className="rounded-xl border border-[#b9d0b4] bg-white px-6 py-3 font-semibold text-[#315b3d]"
                >
                  Danh sách yêu cầu
                </Link>

                <Link
                  href="/customer/my-orders"
                  className="rounded-xl border border-[#b9d0b4] bg-white px-6 py-3 font-semibold text-[#315b3d]"
                >
                  Đơn hàng của tôi
                </Link>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </RoleGuard>
  );
}
