
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

const services = [
  {
    title: 'Tư vấn lựa chọn cây',
    description:
      'Tìm cây theo không gian, nhu cầu ánh sáng và khả năng chăm sóc. Thông tin từng loại cây được cung cấp tại trang chi tiết.',
    href: '/products',
    label: 'Xem cây cảnh',
  },
  {
    title: 'Cho thuê cây cảnh',
    description:
      'Lựa chọn cây theo thời gian sử dụng. Chi phí thuê và tiền cọc được hiển thị riêng để khách dễ theo dõi.',
    href: '/products?type=rent',
    label: 'Xem cây cho thuê',
  },
  {
    title: 'Hướng dẫn chăm sóc',
    description:
      'Tra cứu thông tin ánh sáng, kích thước và hướng dẫn chăm sóc phù hợp với sản phẩm.',
    href: '/products',
    label: 'Tra cứu sản phẩm',
  },
  {
    title: 'Hậu mãi và bảo hành',
    description:
      'Gửi yêu cầu liên quan đến cây đã mua hoặc thuê, theo dõi trạng thái xử lý và lịch sử trao đổi với nhân viên.',
    href: '/customer/after-sales',
    label: 'Truy cập hậu mãi',
  },
];

export default function ServicesPage() {
  return (
    <>
      <Head>
        <title>Dịch vụ | NHAI&apos;s Green</title>
        <meta
          name="description"
          content="Tìm hiểu dịch vụ mua, thuê, chăm sóc và hậu mãi cây cảnh tại NHAI's Green."
        />
      </Head>

      <div className="min-h-screen bg-[#fafbf7] text-[#294530]">
        <Header />

        <main>
          <section className="bg-[#e7eee1] py-20">
            <div className="mx-auto max-w-7xl px-5">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#7c9776]">
                DỊCH VỤ CỬA HÀNG
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
                Từ chọn cây đến chăm sóc,
                <span className="block text-[#75936d]">
                  NHAI&apos;s Green đồng hành cùng bạn.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl leading-8 text-[#617562]">
                Khám phá các dịch vụ dành cho khách hàng mua và thuê
                cây cảnh. Thông tin chi phí và chính sách chính thức
                được xác định theo từng sản phẩm và đơn hàng.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-5 py-16">
            <div className="grid gap-6 md:grid-cols-2">
              {services.map((service, index) => (
                <article
                  key={service.title}
                  className="rounded-2xl border border-[#dce7d8] bg-white p-8"
                >
                  <span className="text-sm font-semibold text-[#88a181]">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <h2 className="mt-5 text-2xl font-semibold">
                    {service.title}
                  </h2>

                  <p className="mt-4 min-h-24 leading-8 text-gray-600">
                    {service.description}
                  </p>

                  <Link
                    href={service.href}
                    className="mt-6 inline-block rounded-full bg-[#315b3d] px-6 py-3 text-sm font-semibold text-white"
                  >
                    {service.label}
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="bg-[#eef3e9] py-16">
            <div className="mx-auto max-w-5xl px-5">
              <h2 className="text-3xl font-semibold">
                Quy trình sử dụng dịch vụ
              </h2>

              <div className="mt-8 grid gap-4 md:grid-cols-4">
                {[
                  'Tìm cây phù hợp',
                  'Xem giá và chính sách',
                  'Chọn mua hoặc thuê',
                  'Theo dõi đơn và hậu mãi',
                ].map((step, index) => (
                  <div
                    key={step}
                    className="rounded-xl bg-white p-6"
                  >
                    <p className="text-sm text-[#83a17e]">
                      Bước {index + 1}
                    </p>
                    <h3 className="mt-3 font-semibold">{step}</h3>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
