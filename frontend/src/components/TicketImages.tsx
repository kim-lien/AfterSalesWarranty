
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

type TicketImage = {
  maTuongTac: number;
  maNguoiDung: number;
  thoiGian: string;
  dataUrl: string;
};

type ImageResponse = {
  success: boolean;
  data: TicketImage[];
};

type Props = {
  ticketId: number;
  allowUpload?: boolean;
};

export async function prepareTicketImage(
  file: File,
): Promise<string> {
  const accepted = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!accepted.includes(file.type)) {
    throw new Error('Chỉ chọn ảnh JPG, PNG hoặc WebP.');
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(
        new Error('Không thể đọc ảnh đã chọn.'),
      );
      image.src = objectUrl;
    });

    const maxEdge = 1400;
    const scale = Math.min(
      1,
      maxEdge / Math.max(image.width, image.height),
    );

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(
      1,
      Math.round(image.width * scale),
    );
    canvas.height = Math.max(
      1,
      Math.round(image.height * scale),
    );

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Không thể xử lý hình ảnh.');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    context.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    let quality = 0.8;
    let dataUrl = canvas.toDataURL(
      'image/jpeg',
      quality,
    );

    while (dataUrl.length > 2000000 && quality > 0.4) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL(
        'image/jpeg',
        quality,
      );
    }

    const estimatedSize =
      Math.floor(
        (dataUrl.length - dataUrl.indexOf(',') - 1) *
          0.75,
      );

    if (estimatedSize > 1572864) {
      throw new Error(
        'Ảnh quá lớn. Vui lòng chọn ảnh khác.',
      );
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function uploadTicketPhoto(
  ticketId: number,
  file: File,
) {
  const dataUrl = await prepareTicketImage(file);

  return api<{ success: boolean }>(
    `/support/tickets/${ticketId}/images`,
    {
      method: 'POST',
      body: JSON.stringify({ dataUrl }),
    },
  );
}

export default function TicketImages({
  ticketId,
  allowUpload = true,
}: Props) {
  const [images, setImages] = useState<TicketImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadImages = useCallback(async () => {
    if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
      setImages([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await api<ImageResponse>(
        `/support/tickets/${ticketId}/images`,
      );

      setImages(response.data || []);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải hình ảnh.',
      );
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files || []);

    event.target.value = '';

    if (!files.length) return;

    if (images.length + files.length > 5) {
      setError('Mỗi yêu cầu được đính kèm tối đa 5 ảnh.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');

    let uploaded = 0;

    try {
      for (const file of files) {
        await uploadTicketPhoto(ticketId, file);
        uploaded += 1;
      }

      setNotice(`Đã thêm ${uploaded} ảnh.`);
      await loadImages();
    } catch (err) {
      if (uploaded > 0) {
        await loadImages();
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải ảnh lên.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#dce7d8] bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#315b3d]">
            Hình ảnh đính kèm
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {images.length}/5 ảnh
          </p>
        </div>

        {allowUpload && images.length < 5 && (
          <label className="cursor-pointer rounded-xl bg-[#315b3d] px-5 py-3 text-sm font-semibold text-white">
            {busy ? 'Đang tải ảnh...' : 'Thêm hình ảnh'}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={busy}
              onChange={(event) => void handleUpload(event)}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {notice && (
        <p className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">
          {notice}
        </p>
      )}

      {loading ? (
        <p className="mt-5 text-sm text-gray-500">
          Đang tải hình ảnh...
        </p>
      ) : images.length === 0 ? (
        <p className="mt-5 rounded-xl bg-[#f6f9f3] p-5 text-sm text-gray-500">
          Chưa có hình ảnh đính kèm.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {images.map((item, index) => (
            <a
              key={item.maTuongTac}
              href={item.dataUrl}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-xl border border-[#dce7d8] bg-[#f6f9f3]"
              aria-label={`Xem ảnh ${index + 1}`}
            >
              <img
                src={item.dataUrl}
                alt={`Ảnh đính kèm ${index + 1}`}
                className="h-44 w-full object-cover"
              />

              <p className="p-3 text-center text-xs text-[#315b3d]">
                Xem ảnh {index + 1}
              </p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
