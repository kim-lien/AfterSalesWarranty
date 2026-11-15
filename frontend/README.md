# FRONTEND – CỔNG HẬU MÃI VÀ BẢO HÀNH ĐA KÊNH

## 1. Thông tin đồ án

| Thông tin | Nội dung |
|---|---|
| Họ và tên | Nguyễn Thị Kim Liên |
| MSSV | 1250080097 |
| Lớp | 12_ĐH_CNPM1 |
| Môn học | Phương pháp phát triển phần mềm hướng đối tượng |
| Giảng viên hướng dẫn | ThS. Phạm Trọng Huynh |
| Tên đề tài | Cổng hậu mãi và bảo hành đa kênh |
| Thành phần | Frontend – Next.js |

## 2. Giới thiệu Frontend

Frontend là thành phần giao diện người dùng của đề tài **Cổng hậu mãi và bảo hành đa kênh**, được xây dựng bằng Next.js, React và TypeScript. Ứng dụng cung cấp các trang phục vụ hoạt động mua, thuê cây cảnh và hỗ trợ khách hàng sau giao dịch.

Giao diện được tổ chức theo ba nhóm người dùng gồm khách hàng, nhân viên và quản trị viên. Mỗi nhóm có khu vực làm việc và chức năng tương ứng, giúp người dùng dễ dàng thực hiện các thao tác nghiệp vụ.

Frontend giao tiếp với Backend NestJS thông qua API để lấy dữ liệu, gửi yêu cầu và cập nhật thông tin.

## 3. Công nghệ và môi trường phát triển

| Thành phần | Công nghệ sử dụng |
|---|---|
| Framework | Next.js |
| Thư viện giao diện | React |
| Ngôn ngữ lập trình | TypeScript |
| Cơ chế định tuyến | Next.js Pages Router |
| Định dạng giao diện | TSX, CSS |
| Giao tiếp dữ liệu | API từ Backend NestJS |
| Quản lý thư viện | npm |
| Công cụ lập trình | Visual Studio Code |
| Hệ điều hành phát triển | Windows |

**Phiên bản:** Kiểm tra phiên bản Node.js bằng `node -v`, npm bằng `npm -v` và phiên bản Next.js, React, TypeScript trong `package.json`.

## 4. Cấu trúc thư mục Frontend

```text
frontend/
├── .next/
├── node_modules/
├── public/
│   ├── images/
│   │   ├── banners/
│   │   ├── categories/
│   │   └── products/
│   ├── favicon.ico
│   └── *.svg
├── src/
│   ├── api/
│   ├── components/
│   │   ├── layout/
│   │   │   └── ManagementLayout.tsx
│   │   ├── CreateWarrantyButton.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── ProductCard.tsx
│   │   ├── RentalAssignment.tsx
│   │   ├── RoleGuard.tsx
│   │   ├── RoleNavigation.tsx
│   │   ├── SupportDashboard.tsx
│   │   ├── SupportDetails.tsx
│   │   ├── SupportSLA.tsx
│   │   ├── TicketImages.tsx
│   │   └── WarrantyPanel.tsx
│   ├── context/
│   ├── lib/
│   │   └── cart.ts
│   ├── pages/
│   │   ├── admin/
│   │   ├── customer/
│   │   │   └── products/
│   │   │       ├── [id].tsx
│   │   │       └── index.tsx
│   │   ├── staff/
│   │   ├── _app.tsx
│   │   ├── _document.tsx
│   │   ├── about.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── services.tsx
│   ├── styles/
│   │   └── globals.css
│   └── types/
├── .env.local
├── .gitignore
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

### Mô tả các thư mục chính

| Thư mục | Chức năng |
|---|---|
| `public/images` | Lưu hình ảnh banner, danh mục và sản phẩm. |
| `src/api` | Chứa các hàm giao tiếp với Backend API. |
| `src/components` | Chứa các thành phần giao diện có thể sử dụng lại. |
| `src/components/layout` | Tổ chức bố cục giao diện quản lý. |
| `src/context` | Quản lý trạng thái và dữ liệu dùng chung. |
| `src/lib` | Chứa các tiện ích xử lý nghiệp vụ phía Frontend. |
| `src/pages` | Tổ chức các trang theo cơ chế Pages Router. |
| `src/styles` | Quản lý CSS và định dạng giao diện. |
| `src/types` | Chứa các định nghĩa kiểu dữ liệu TypeScript. |

Các thư mục `.next` và `node_modules` được tạo trong quá trình cài đặt, phát triển ứng dụng.

## 5. Tổ chức các trang giao diện

Frontend sử dụng **Next.js Pages Router**, các trang được định nghĩa thông qua các tệp `.tsx` trong thư mục `src/pages`.

### 5.1. Trang công khai

| Tệp | Chức năng |
|---|---|
| `index.tsx` | Trang chủ Website. |
| `about.tsx` | Giới thiệu Website. |
| `services.tsx` | Thông tin dịch vụ. |
| `login.tsx` | Đăng nhập tài khoản. |
| `register.tsx` | Đăng ký tài khoản. |

### 5.2. Trang khách hàng

Các trang được tổ chức trong `src/pages/customer/`.

| Tệp | Chức năng |
|---|---|
| `products/index.tsx` | Danh sách sản phẩm cây cảnh. |
| `products/[id].tsx` | Chi tiết sản phẩm. |
| `cart.tsx` | Giỏ hàng. |
| `checkout.tsx` | Đặt hàng và thanh toán. |
| `my-orders.tsx` | Theo dõi đơn mua hoặc thuê. |
| `order-confirmation.tsx` | Xác nhận thông tin đơn hàng. |
| `payment.tsx` | Giao diện thanh toán. |
| `after-sales.tsx` | Quản lý yêu cầu hậu mãi. |
| `support-detail.tsx` | Xem chi tiết yêu cầu hỗ trợ. |
| `appointments.tsx` | Theo dõi lịch hẹn chăm sóc cây. |

### 5.3. Trang nhân viên

Các trang được tổ chức trong `src/pages/staff/`.

| Tệp | Chức năng |
|---|---|
| `support.tsx` | Danh sách yêu cầu hỗ trợ. |
| `supportdetail.tsx` | Chi tiết và xác minh yêu cầu. |
| `warranties.tsx` | Quản lý xử lý bảo hành. |
| `aftersales.tsx` | Xử lý hậu mãi. |
| `appointments.tsx` | Danh sách lịch hẹn. |
| `appointments-detail.tsx` | Chi tiết và cập nhật lịch hẹn. |
| `sla.tsx` | Theo dõi thời hạn SLA. |
| `orders.tsx` | Theo dõi đơn mua. |
| `rentals.tsx` | Theo dõi đơn thuê. |
| `rentals-detail.tsx` | Chi tiết đơn thuê. |
| `[section].tsx` | Trang động theo nhóm chức năng. |

### 5.4. Trang quản trị viên

Các trang được tổ chức trong `src/pages/admin/`.

| Tệp | Chức năng |
|---|---|
| `support.tsx` | Quản lý các yêu cầu hỗ trợ. |
| `supportdetail.tsx` | Chi tiết yêu cầu và phân công nhân viên. |
| `warranties.tsx` | Quản lý bảo hành. |
| `aftersales.tsx` | Quản lý hậu mãi. |
| `appointments.tsx` | Quản lý lịch hẹn. |
| `appointments-detail.tsx` | Chi tiết lịch hẹn. |
| `sla.tsx` | Giám sát SLA. |
| `orders.tsx` | Quản lý đơn hàng. |
| `rentals.tsx` | Quản lý đơn thuê. |
| `rentals-detail.tsx` | Chi tiết đơn thuê. |
| `payments.tsx` | Theo dõi thanh toán. |
| `[section].tsx` | Trang động theo nhóm chức năng. |

## 6. Các Components chính

| Component | Chức năng |
|---|---|
| `Header.tsx` | Hiển thị thanh điều hướng Website. |
| `Footer.tsx` | Hiển thị thông tin cuối trang. |
| `ProductCard.tsx` | Hiển thị thông tin sản phẩm. |
| `ManagementLayout.tsx` | Bố cục giao diện quản lý. |
| `RoleGuard.tsx` | Kiểm tra quyền truy cập giao diện. |
| `RoleNavigation.tsx` | Điều hướng theo vai trò. |
| `SupportDashboard.tsx` | Hiển thị thông tin tổng quan hỗ trợ. |
| `SupportDetails.tsx` | Hiển thị nội dung chi tiết yêu cầu. |
| `SupportSLA.tsx` | Hiển thị thông tin SLA. |
| `TicketImages.tsx` | Hiển thị hình ảnh liên quan đến yêu cầu. |
| `WarrantyPanel.tsx` | Giao diện xử lý bảo hành. |
| `CreateWarrantyButton.tsx` | Thành phần hỗ trợ thao tác tạo bảo hành. |
| `RentalAssignment.tsx` | Thành phần liên quan đến phân công trong nghiệp vụ thuê. |

## 7. Nội dung đã thực hiện

### 7.1. Giao diện khách hàng

- Xây dựng trang chủ và trang giới thiệu dịch vụ.
- Thiết kế giao diện đăng ký, đăng nhập.
- Hiển thị danh sách và thông tin chi tiết sản phẩm.
- Xây dựng các trang giỏ hàng, đặt hàng và thanh toán.
- Xây dựng giao diện theo dõi đơn hàng, đơn thuê.
- Hỗ trợ gửi và theo dõi yêu cầu hậu mãi, bảo hành.
- Hiển thị lịch hẹn và kết quả hỗ trợ.

### 7.2. Giao diện nhân viên

- Hiển thị danh sách yêu cầu được phân công.
- Cung cấp giao diện xác minh và xử lý yêu cầu.
- Xây dựng các trang xử lý bảo hành và hậu mãi.
- Quản lý lịch hẹn chăm sóc cây.
- Hiển thị thời hạn và tình trạng SLA.

### 7.3. Giao diện quản trị viên

- Xây dựng trang tổng quan hoạt động hậu mãi.
- Hiển thị danh sách và chi tiết yêu cầu.
- Hỗ trợ phân công nhân viên xử lý.
- Theo dõi tình trạng bảo hành, hậu mãi.
- Quản lý lịch hẹn và giám sát SLA.

## 8. Hướng dẫn cài đặt và chạy Frontend

### 8.1. Chuẩn bị môi trường

Cài đặt:

- Node.js và npm.
- Visual Studio Code.
- Trình duyệt Web.
- Backend NestJS và SQL Server của dự án.

### 8.2. Cài đặt thư viện

Mở Terminal tại thư mục:

`AfterSalesWarranty/frontend`

Thực hiện:

```bash
npm install
```

Nếu cần cài đặt đúng phiên bản dependencies theo `package-lock.json`, sử dụng:

```bash
npm ci
```

### 8.3. Cấu hình kết nối API

Kiểm tra tệp:

```text
frontend/.env.local
```

Đảm bảo địa chỉ API trong cấu hình Frontend phù hợp với địa chỉ và cổng đang sử dụng của Backend.

Tên biến môi trường cụ thể cần được kiểm tra trong mã nguồn `src/api` và tệp `.env.local`.

### 8.4. Khởi chạy Frontend

Tại thư mục `frontend`, chạy:

```bash
npm run dev
```

Sau khi ứng dụng khởi chạy, truy cập:

http://localhost:3000

Đây là cổng mặc định của Next.js. Nếu Terminal hiển thị cổng khác, sử dụng địa chỉ tương ứng.

### 8.5. Build ứng dụng

Có thể kiểm tra khả năng biên dịch bằng lệnh:

```bash
npm run build
```

Nếu `package.json` có script `start`, có thể khởi chạy bản production bằng:

```bash
npm run start
```

## 9. Tài khoản kiểm thử

| Vai trò | Tên đăng nhập | Mật khẩu |
|---|---|---|
| Khách hàng | `tu1` | `123` |
| Quản trị viên | `nhai1` | `1` |
| Nhân viên | `nhai2` | `2` |
| Nhân viên | `nhai3` | `3` |

Các tài khoản trên sử dụng cho mục đích kiểm thử đồ án và cần có sẵn trong cơ sở dữ liệu.

## 10. Hướng dẫn giảng viên kiểm tra giao diện

### 10.1. Kiểm tra giao diện công khai

1. Truy cập trang chủ tại `http://localhost:3000`.
2. Kiểm tra thanh điều hướng, hình ảnh và danh sách sản phẩm.
3. Mở trang đăng ký và đăng nhập.
4. Kiểm tra việc hiển thị thông báo khi nhập thông tin không hợp lệ.

### 10.2. Kiểm tra giao diện khách hàng

Đăng nhập bằng tài khoản `tu1`.

1. Truy cập danh sách sản phẩm.
2. Xem chi tiết cây cảnh.
3. Kiểm tra giỏ hàng và trang đặt hàng.
4. Theo dõi các đơn mua hoặc thuê.
5. Truy cập trang yêu cầu hậu mãi.
6. Xem chi tiết yêu cầu và lịch hẹn.

### 10.3. Kiểm tra giao diện quản trị viên

Đăng nhập bằng tài khoản `nhai1`.

1. Truy cập khu vực quản trị.
2. Xem danh sách yêu cầu hậu mãi, bảo hành.
3. Mở chi tiết một yêu cầu.
4. Kiểm tra chức năng phân công nhân viên.
5. Theo dõi lịch hẹn và tình trạng SLA.

### 10.4. Kiểm tra giao diện nhân viên

Đăng nhập bằng tài khoản `nhai2` hoặc `nhai3`.

1. Xem danh sách yêu cầu được phân công.
2. Truy cập chi tiết yêu cầu.
3. Kiểm tra giao diện xử lý bảo hành.
4. Cập nhật tiến độ hậu mãi.
5. Xem và cập nhật lịch hẹn.
6. Theo dõi danh sách SLA.

### 10.5. Kiểm tra quy trình hoàn chỉnh

Giảng viên có thể kiểm tra theo trình tự:

**Khách hàng gửi yêu cầu → Quản trị viên phân công nhân viên → Nhân viên xử lý → Khách hàng theo dõi kết quả.**

Trong quá trình kiểm tra, Backend và SQL Server cần hoạt động để Frontend có thể trao đổi, cập nhật và hiển thị dữ liệu.

## 11. Kết quả đạt được

Frontend đã được xây dựng với các trang và thành phần giao diện phục vụ ba nhóm người dùng. Mã nguồn được tổ chức theo Pages Router, phân chia trang theo vai trò và sử dụng các Components chung nhằm tạo sự thống nhất trong quá trình phát triển.

Giao diện hỗ trợ hoạt động mua, thuê cây cảnh và các nghiệp vụ hậu mãi, bảo hành, quản lý lịch hẹn và theo dõi SLA.

## 12. Lỗi thường gặp và cách khắc phục

| Vấn đề | Nguyên nhân có thể gặp | Cách khắc phục |
|---|---|---|
| Không khởi chạy được Next.js | Thiếu thư viện hoặc phiên bản Node.js không phù hợp | Kiểm tra Node.js và chạy `npm install`. |
| Trang không hiển thị dữ liệu | Backend chưa hoạt động hoặc API bị lỗi | Kiểm tra Backend và cấu hình API. |
| Không đăng nhập được | Sai tài khoản hoặc API xác thực không hoạt động | Kiểm tra tài khoản, Backend và SQL Server. |
| Không truy cập được trang quản lý | Người dùng chưa có quyền phù hợp | Kiểm tra đăng nhập và vai trò tài khoản. |
| Hình ảnh sản phẩm không hiển thị | Sai đường dẫn hoặc thiếu tệp ảnh | Kiểm tra thư mục `public/images`. |
| Lỗi khi build | Lỗi TypeScript hoặc cấu hình Next.js | Kiểm tra thông báo Terminal và các tệp cấu hình. |
| Cổng 3000 đã được sử dụng | Có ứng dụng khác đang chạy | Dừng ứng dụng đang chiếm cổng hoặc sử dụng cổng khác. |

Bảng trên trình bày các tình huống cần kiểm tra khi chạy lại Frontend, không khẳng định tất cả đều là lỗi đã phát sinh trong quá trình thực hiện đồ án.

## 13. Hạn chế và hướng phát triển

### Hạn chế

- Việc tích hợp và đồng bộ tương tác tự động qua Email, điện thoại và Chat chưa được hoàn thiện đầy đủ.
- Khả năng vận hành của các trang phụ thuộc vào kết nối Backend và cơ sở dữ liệu.
- Ứng dụng chủ yếu được phát triển và chạy thử trên môi trường máy tính cá nhân.

### Hướng phát triển

- Hoàn thiện giao diện và quy trình hỗ trợ khách hàng đa kênh.
- Tối ưu trải nghiệm trên thiết bị di động.
- Cải thiện khả năng xử lý và hiển thị dữ liệu.
- Bổ sung kiểm thử tự động cho các thành phần giao diện.
- Hoàn thiện khả năng triển khai trên môi trường thực tế.

## 14. Lưu ý khi bàn giao

- Khởi chạy Backend và SQL Server trước khi kiểm tra Frontend.
- Kiểm tra cấu hình API trong `.env.local`.
- Không công khai các thông tin nhạy cảm trong tệp môi trường.
- Có thể cài đặt lại thư viện từ `package.json` và `package-lock.json`.
- Không cần bàn giao thư mục `node_modules` và `.next` nếu có thể cài đặt và build lại.
- Sử dụng các tài khoản kiểm thử để kiểm tra giao diện theo đúng vai trò.

---

**Sinh viên thực hiện:** Nguyễn Thị Kim Liên

**MSSV:** 1250080097

**Giảng viên hướng dẫn:** ThS. Phạm Trọng Huynh

**Đề tài:** Cổng hậu mãi và bảo hành đa kênh