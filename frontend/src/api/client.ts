export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type LoginUser = {
  MaNguoiDung: number;
  HoTen: string;
  TenDangNhap: string;
  Email: string;
  TenVaiTro: string;
  MaKH: number | null;
  MaNV: number | null;
};

export function getUser(): LoginUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const value = sessionStorage.getItem('user');
    return value ? (JSON.parse(value) as LoginUser) : null;
  } catch {
    return null;
  }
}

export function logout(): void {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  window.location.href = '/login';
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('token')
      : null;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const message = result?.message;

    throw new Error(
      Array.isArray(message)
        ? message.join(', ')
        : typeof message === 'string'
          ? message
          : `Lỗi HTTP ${response.status}`,
    );
  }

  return result as T;
}