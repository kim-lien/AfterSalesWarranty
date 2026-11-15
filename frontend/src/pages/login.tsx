
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { api, LoginUser } from '../api/client';

type LoginResponse = {
  accessToken: string;
  user: LoginUser;
};

export default function LoginPage() {
  const router = useRouter();

  const [tenDangNhap, setTenDangNhap] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          tenDangNhap,
          matKhau,
        }),
      });

      sessionStorage.setItem('token', result.accessToken);
      sessionStorage.setItem('user', JSON.stringify(result.user));

     if (result.user.TenVaiTro === 'Quản trị viên') {
  await router.replace('/admin/support');
} else if (result.user.TenVaiTro === 'Nhân viên') {
  await router.replace('/staff/support');
} else {
  await router.replace('/');
}
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể đăng nhập',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Đăng nhập | NHAI&apos;s Green</title>
        <meta
          name="description"
          content="Đăng nhập NHAI's Green để mua, thuê cây và sử dụng dịch vụ hậu mãi."
        />
      </Head>

      <main className="min-h-screen bg-[#f5f7f0] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link
              href="/"
              className="text-6xl font-bold tracking-tight text-[#315b3d]"
            >
              NHAI&apos;s Green
            </Link>

          
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-white rounded-2xl border border-[#dce7d8] shadow-sm p-8"
          >
        

            <label
              htmlFor="username"
              className="block font-semibold text-[16px] mb-3"
            >
              Tên đăng nhập
            </label>

            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              maxLength={50}
              value={tenDangNhap}
              onChange={(e) => setTenDangNhap(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 mb-5 text-[18px] outline-none focus:border-[#315b3d]"
            />

            <label
              htmlFor="password"
              className="block font-semibold text-[16px] mb-3"
            >
              Mật khẩu
            </label>

            <div className="relative">
              <input
                id="password"
                type={hienMatKhau ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 text-[18px] outline-none focus:border-[#315b3d]"
              />

              <button
                type="button"
                onClick={() => setHienMatKhau(!hienMatKhau)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#315b3d]"
              >
                {hienMatKhau ? 'Ẩn' : 'Hiện'}
              </button>
            </div>

            <div className="flex justify-end mt-3 mb-6">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#315b3d] hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {error && (
              <p
                role="alert"
                className="mb-4 text-sm text-red-600"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#315b3d] py-3 text-white font-semibold hover:bg-[#24462e] disabled:opacity-50"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            <div className="text-center mt-6 text-sm text-gray-600">
              Chưa có tài khoản?{' '}
              <Link
                href="/register"
                className="text-[#315b3d] font-semibold hover:underline"
              >
                Đăng ký ngay
              </Link>
            </div>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            © NHAI&apos;s Green – Kinh doanh và cho thuê cây cảnh
          </p>
        </div>
      </main>
    </>
  );
}
