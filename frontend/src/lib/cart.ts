
export type CartItem = {
  id: string;
  maSP: number;
  tenSP: string;
  hinhAnh: string | null;
  loaiGiaoDich: 'Mua' | 'Thuê';
  soLuong: number;
  donGia: number;
  giaTriCay: number;
  ngayBatDauThue: string | null;
  ngayKetThucThue: string | null;
  goiThue: 'Cơ bản' | 'Cao cấp' | null;
};

const EVENT_NAME = 'nhai-cart-updated';

function cartKey(userId: number) {
  return `nhai-cart-${userId}`;
}

export function getCart(userId: number): CartItem[] {
  if (typeof window === 'undefined' || !userId) return [];

  try {
    const raw = localStorage.getItem(cartKey(userId));
    const items: unknown = raw ? JSON.parse(raw) : [];

    return Array.isArray(items) ? items as CartItem[] : [];
  } catch {
    return [];
  }
}

export function saveCart(userId: number, items: CartItem[]) {
  if (typeof window === 'undefined' || !userId) return;

  localStorage.setItem(cartKey(userId), JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function subscribeCart(listener: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(EVENT_NAME, listener);

  return () => window.removeEventListener(EVENT_NAME, listener);
}

export function addToCart(userId: number, item: CartItem) {
  const items = getCart(userId);

  const index = items.findIndex((current) => current.id === item.id);

  if (index >= 0) {
    items[index] = {
      ...items[index],
      soLuong: items[index].soLuong + item.soLuong,
    };
  } else {
    items.push(item);
  }

  saveCart(userId, items);
}

export function removeFromCart(userId: number, id: string) {
  saveCart(
    userId,
    getCart(userId).filter((item) => item.id !== id),
  );
}

export function updateCartQuantity(
  userId: number,
  id: string,
  quantity: number,
) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return;

  saveCart(
    userId,
    getCart(userId).map((item) =>
      item.id === id ? { ...item, soLuong: quantity } : item,
    ),
  );
}

export function rentalDays(item: CartItem) {
  if (
    item.loaiGiaoDich !== 'Thuê' ||
    !item.ngayBatDauThue ||
    !item.ngayKetThucThue
  ) {
    return 0;
  }

  const start = new Date(`${item.ngayBatDauThue}T00:00:00`);
  const end = new Date(`${item.ngayKetThucThue}T00:00:00`);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000);

  return Number.isFinite(days) ? Math.max(0, days) : 0;
}

export function cartItemTotal(item: CartItem) {
  const days = item.loaiGiaoDich === 'Thuê' ? rentalDays(item) : 1;

  return item.donGia * item.soLuong * days;
}

export function cartItemDeposit(item: CartItem) {
  if (item.loaiGiaoDich !== 'Thuê') return 0;

  return Math.round(item.giaTriCay * 1.5 * item.soLuong);
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}
