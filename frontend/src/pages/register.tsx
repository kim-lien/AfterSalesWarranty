
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { api } from '../api/client';

export default function RegisterPage() {
  const router = useRouter();

  const [hoTen, setHoTen] = useState('');
  const [tenDangNhap, setTenDangNhap] = useState('');
  const [email, setEmail] = useState('');
  const [sdt, setSdt] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState('');
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (matKhau !== xacNhanMatKhau) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (matKhau.length < 1) {
    setError('Vui lòng nhập mật khẩu');
    return;
    }

    setLoading(true);

    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          hoTen,
          tenDangNhap,
          email,
          sdt,
          matKhau,
        }),
      });

      await router.push('/login?registered=1');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Đăng ký không thành công',
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[#d7dfd3] px-4 py-3 outline-none focus:border-[#315b3d]';

  return (
    <>
      <Head>
        <title>Đăng ký | NHAI&apos;s Green</title>
      </Head>

      <main className="min-h-screen bg-[#f5f7f0] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="text-center mb-7">
            <Link
              href="/"
              className="text-4xl font-bold text-[#315b3d]"
            >
              NHAI&apos;s Green
            </Link>
            <p className="mt-2 text-gray-500">
              Cùng bạn chăm sóc không gian xanh
            </p>
          </div>

          <form
            onSubmit={handleRegister}
            className="bg-white border border-[#e1e8dd] rounded-2xl p-8 shadow-sm space-y-5"
          >
            <div>
              <h1 className="text-2xl font-bold text-[#263c2d]">
                Tạo tài khoản
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Đăng ký để mua, thuê cây và sử dụng dịch vụ hậu mãi.
              </p>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Họ và tên
              </label>
              <input
                required
                maxLength={100}
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                className={inputClass}
                placeholder="Nhập họ và tên"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Tên đăng nhập
              </label>
              <input
                required
                minLength={3}
                maxLength={50}
                pattern="[a-zA-Z0-9_]+"
                title="Chỉ dùng chữ cái không dấu, số và dấu gạch dưới"
                autoComplete="username"
                value={tenDangNhap}
                onChange={(e) => setTenDangNhap(e.target.value)}
                className={inputClass}
                placeholder="Ví dụ: green2026"
              />
              <p className="mt-1 text-xs text-gray-500">
                Từ 3 đến 50 ký tự, không chứa dấu cách.
              </p>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Email
              </label>
              <input
                required
                type="email"
                maxLength={150}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="Nhập email (bắt buộc)"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Số điện thoại
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={sdt}
                onChange={(e) => setSdt(e.target.value)}
                className={inputClass}
                placeholder="Nhập số điện thoại (không bắt buộc)"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  required
                  minLength={1}
                  maxLength={72}
                  type={hienMatKhau ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={matKhau}
                  onChange={(e) => setMatKhau(e.target.value)}
                  className={`${inputClass} pr-16`}
                  placeholder="Ít nhất 8 ký tự"
                />
                <button
                  type="button"
                  onClick={() => setHienMatKhau(!hienMatKhau)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#315b3d]"
                >
                  {hienMatKhau ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Xác nhận mật khẩu
              </label>
              <input
                required
                minLength={1}
                maxLength={72}
                type={hienMatKhau ? 'text' : 'password'}
                autoComplete="new-password"
                value={xacNhanMatKhau}
                onChange={(e) => setXacNhanMatKhau(e.target.value)}
                className={inputClass}
                placeholder="Nhập lại mật khẩu"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="text-sm text-red-600 bg-red-50 rounded-lg p-3"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#315b3d] text-white py-3 font-semibold hover:bg-[#25472f] disabled:opacity-50"
            >
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link
                href="/login"
                className="font-semibold text-[#315b3d] hover:underline"
              >
                Đăng nhập
              </Link>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}
