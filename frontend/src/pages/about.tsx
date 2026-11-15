
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>Giới thiệu | NHAI&apos;s Green</title>
      </Head>

      <div className="min-h-screen bg-[#fafbf7] text-[#294530]">
        <Header />

        <main>
          <section className="bg-[#e7eee1] py-20">
            <div className="mx-auto max-w-5xl px-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#779271]">
                Về chúng tôi
              </p>

              <h1 className="mt-5 text-4xl font-semibold md:text-5xl">
                NHAI&apos;s Green
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#627763]">
                Mang thiên nhiên đến gần hơn với không gian sống
                thông qua cây cảnh, dịch vụ thuê cây và hệ thống
                chăm sóc khách hàng.
              </p>
            </div>
          </section>

          <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ba184]">
                Câu chuyện cửa hàng
              </p>

              <h2 className="mt-4 text-3xl font-semibold">
                Không gian sống xanh bắt đầu từ những lựa chọn nhỏ.
              </h2>
            </div>

            <div className="space-y-5 leading-8 text-[#667767]">
              <p>
                NHAI&apos;s Green được xây dựng với định hướng
                cung cấp trải nghiệm mua và thuê cây cảnh
                trên cùng một website.
              </p>

              <p>
                Khách hàng có thể xem thông tin cây, so sánh
                giá mua và giá thuê, tìm hiểu cách chăm sóc,
                quản lý đơn hàng và gửi yêu cầu hỗ trợ sau mua.
              </p>

              <p>
                Hệ thống hướng đến quy trình rõ ràng từ lựa chọn
                sản phẩm, đặt hàng, giao nhận đến chăm sóc và
                xử lý bảo hành.
              </p>
            </div>
          </section>

          <section className="bg-white py-20">
            <div className="mx-auto max-w-6xl px-5">
              <h2 className="text-center text-3xl font-semibold">
                Dịch vụ của NHAI&apos;s Green
              </h2>

              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {[
                  {
                    title: 'Kinh doanh cây cảnh',
                    text: 'Giới thiệu cây và các thông tin cần thiết để lựa chọn sản phẩm phù hợp.',
                  },
                  {
                    title: 'Cho thuê cây',
                    text: 'Lựa chọn cây theo thời gian sử dụng với phí thuê và tiền cọc được tách riêng.',
                  },
                  {
                    title: 'Chăm sóc và bảo hành',
                    text: 'Tiếp nhận, theo dõi và xử lý yêu cầu hậu mãi trên hệ thống.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[#e0e9db] bg-[#fafcf8] p-8"
                  >
                    <h3 className="text-xl font-semibold text-[#315b3d]">
                      {item.title}
                    </h3>
                    <p className="mt-5 leading-7 text-gray-600">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-[#e7eee1] py-16 text-center">
            <h2 className="text-3xl font-semibold">
              Khám phá cây xanh phù hợp với bạn
            </h2>

            <Link
              href="/products"
              className="mt-7 inline-block rounded-full bg-[#315b3d] px-8 py-3.5 font-medium text-white"
            >
              Xem tất cả sản phẩm
            </Link>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
