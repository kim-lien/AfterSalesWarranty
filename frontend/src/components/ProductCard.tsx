
import Link from 'next/link';
import { useState } from 'react';

export type Plant = {
  MaSP: number;
  MaDM: number;
  TenSP: string;
  MoTa: string | null;
  HinhAnh: string | null;
  LoaiSanPham: string;
  GiaBan: number | null;
  GiaThueTheoNgay: number | null;
  GiaTriCay: number;
  DuDieuKienBaoHanh: boolean;
  ChieuCao?: string | null;
  NhuCauAnhSang?: string | null;
  HuongDanChamSoc?: string | null;
  DonViTinh?: string;
  TrangThai: boolean;
};

export function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getPlantImage(image: string | null) {
  if (!image?.trim()) return null;

  if (/^https?:\/\//i.test(image)) return image;

  if (image.startsWith('/')) return image;

  return `/images/products/${image}`;
}

export function getDeposit(plant: Plant) {
  return Math.round(Number(plant.GiaTriCay) * 1.5);
}

export function canBuy(plant: Plant) {
  return (
    ['Bán', 'Bán và thuê'].includes(plant.LoaiSanPham) &&
    plant.GiaBan !== null
  );
}

export function canRent(plant: Plant) {
  return (
    ['Thuê', 'Bán và thuê'].includes(plant.LoaiSanPham) &&
    plant.GiaThueTheoNgay !== null
  );
}

export default function ProductCard({ plant }: { plant: Plant }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getPlantImage(plant.HinhAnh);

  const buying = canBuy(plant);
  const renting = canRent(plant);

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#e2e9de] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link
        href={`/products/${plant.MaSP}`}
        className="block"
      >
        <div className="relative flex aspect-[4/4.2] items-center justify-center overflow-hidden bg-[#edf2e9]">
          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={plant.TenSP}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="px-5 text-center text-[#789377]">
              <div className="text-5xl">✳</div>
              <p className="mt-3 text-sm">
                Hình ảnh đang cập nhật
              </p>
            </div>
          )}

          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#315b3d]">
            {buying && renting
              ? 'Mua hoặc thuê'
              : buying
                ? 'Cây bán'
                : 'Cây cho thuê'}
          </span>
        </div>
      </Link>

      <div className="p-5">
        <p className="text-xs uppercase tracking-widest text-[#8a9a84]">
          NHAI&apos;s Green
        </p>

        <Link href={`/products/${plant.MaSP}`}>
          <h3 className="mt-2 line-clamp-2 min-h-14 text-lg font-semibold text-[#294530] hover:text-[#5b865c]">
            {plant.TenSP}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">
          {plant.MoTa || 'Cây xanh cho không gian sống của bạn.'}
        </p>

        <div className="mt-4 space-y-3 border-t border-[#edf0e9] pt-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-500">Giá mua</span>
            <span className="font-semibold text-[#315b3d]">
              {buying && plant.GiaBan !== null
                ? formatPrice(Number(plant.GiaBan))
                : 'Không bán'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-500">Giá thuê</span>
            <span className="font-semibold text-[#315b3d]">
              {renting && plant.GiaThueTheoNgay !== null
                ? `${formatPrice(Number(plant.GiaThueTheoNgay))}/ngày`
                : 'Không cho thuê'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-500">
              Giá cọc dự kiến
            </span>
            <span className="font-semibold text-[#315b3d]">
              {renting
                ? formatPrice(getDeposit(plant))
                : 'Không áp dụng'}
            </span>
          </div>
        </div>

        <Link
          href={`/products/${plant.MaSP}`}
          className="mt-5 block rounded-lg bg-[#315b3d] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#25472f]"
        >
          Xem chi tiết
        </Link>
      </div>
    </article>
  );
}
