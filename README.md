# CỔNG HẬU MÃI VÀ BẢO HÀNH ĐA KÊNH

## 1. Thông tin đồ án

| Thông tin | Nội dung |
|---|---|
| Họ và tên | Nguyễn Thị Kim Liên |
| MSSV | 1250080097 |
| Lớp | 12_ĐH_CNPM1 |
| Môn học | Phương pháp phát triển phần mềm hướng đối tượng |
| Giảng viên hướng dẫn | ThS. Phạm Trọng Huynh |
| Tên đề tài | Cổng hậu mãi và bảo hành đa kênh |
| Tên thư mục dự án | AfterSalesWarranty |
| Thời gian thực hiện | Tháng 11/2026 |

## 2. Giới thiệu dự án

**Cổng hậu mãi và bảo hành đa kênh** là Website được xây dựng nhằm hỗ trợ hoạt động kinh doanh, cho thuê cây cảnh và quản lý các dịch vụ chăm sóc khách hàng sau giao dịch.

Đề tài tập trung giải quyết các nghiệp vụ tiếp nhận yêu cầu hỗ trợ, xác minh thông tin khách hàng, kiểm tra quyền lợi bảo hành, phân công nhân viên xử lý, quản lý lịch hẹn chăm sóc cây và theo dõi thời hạn phản hồi, giải quyết yêu cầu theo SLA (Service Level Agreement).

Website được tổ chức theo ba nhóm người dùng gồm **Khách hàng, Nhân viên và Quản trị viên**, giúp quản lý thông tin tập trung, theo dõi tiến độ và hỗ trợ quá trình phối hợp giải quyết yêu cầu.

## 3. Công nghệ và môi trường phát triển

| Thành phần | Công nghệ sử dụng |
|---|---|
| Hệ điều hành phát triển | Windows |
| Công cụ lập trình | Visual Studio Code |
| Frontend | Next.js, React, TypeScript |
| Cơ chế định tuyến | Next.js Pages Router |
| Backend | NestJS, Node.js, TypeScript |
| Cơ sở dữ liệu | Microsoft SQL Server |
| Công cụ quản lý dữ liệu | SQL Server Management Studio |
| Kết nối cơ sở dữ liệu | mssql / msnodesqlv8 |
| Phương thức xác thực SQL Server | Windows Authentication |
| Xác thực và phân quyền API | JWT, Guards |
| Giao tiếp Frontend – Backend | REST API |
| Quản lý thư viện | npm |
| Công cụ thiết kế | UML, Figma |

### Yêu cầu môi trường

Máy tính cần cài đặt:

- Node.js và npm.
- Microsoft SQL Server.
- SQL Server Management Studio (SSMS).
- Visual Studio Code hoặc công cụ tương đương.
- Trình duyệt Web hiện đại.

Phiên bản cụ thể của các công nghệ được xác định từ môi trường phát triển và các tệp `package.json`, `package-lock.json` trong thư mục `frontend` và `backend`.

Có thể kiểm tra Node.js và npm bằng:

```bash
node -v
npm -v
```

## 4. Cấu trúc thư mục dự án

```text
AfterSalesWarranty/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── database/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── modules/
│   │   ├── services/
│   │   └── main.ts
│   ├── test/
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── public/
│   │   └── images/
│   │       ├── banners/
│   │       ├── categories/
│   │       └── products/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── customer/
│   │   │   └── staff/
│   │   ├── styles/
│   │   └── types/
│   ├── .env.local
│   ├── package.json
│   └── README.md
│
├── docker/
├── docker-compose.yml
├── QuanLyCayCanh.sql
└── README.md
```

### Mô tả các thành phần chính

| Thư mục / Tệp | Chức năng |
|---|---|
| `backend/` | Phát triển API, xác thực, xử lý nghiệp vụ và kết nối cơ sở dữ liệu. |
| `frontend/` | Xây dựng giao diện và các chức năng tương tác với người dùng. |
| `docker/` | Chứa các thành phần cấu hình Docker của dự án. |
| `docker-compose.yml` | Tệp cấu hình Docker Compose. |
| `QuanLyCayCanh.sql` | Script khởi tạo cơ sở dữ liệu SQL Server. |
| `backend/README.md` | Hướng dẫn chi tiết về Backend. |
| `frontend/README.md` | Hướng dẫn chi tiết về Frontend. |

Các thư mục `node_modules`, `dist` và `.next` có thể được tạo trong quá trình cài đặt, biên dịch và chạy ứng dụng.

## 5. Nội dung đã thực hiện

### 5.1. Phân tích và thiết kế

- Khảo sát, xác định yêu cầu và phân tích nghiệp vụ.
- Xác định các nhóm người dùng và chức năng tương ứng.
- Xây dựng sơ đồ Use Case, Class Diagram, Activity Diagram và Sequence Diagram.
- Thiết kế cơ sở dữ liệu SQL Server.
- Thiết kế giao diện phục vụ khách hàng, nhân viên và quản trị viên.

### 5.2. Chức năng khách hàng

- Đăng ký và đăng nhập tài khoản.
- Xem thông tin, mua hoặc thuê cây cảnh.
- Theo dõi đơn mua, đơn thuê.
- Gửi yêu cầu hậu mãi hoặc bảo hành.
- Cung cấp thông tin và hình ảnh liên quan đến yêu cầu.
- Theo dõi trạng thái, kết quả xử lý và lịch hẹn chăm sóc cây.

### 5.3. Chức năng nhân viên

- Xem danh sách yêu cầu được phân công.
- Kiểm tra thông tin và xác minh điều kiện hỗ trợ.
- Cập nhật kết quả xử lý bảo hành.
- Ghi nhận tiến độ và kết quả hỗ trợ hậu mãi.
- Theo dõi, cập nhật lịch hẹn chăm sóc cây.
- Kiểm tra thời hạn phản hồi và xử lý theo SLA.

### 5.4. Chức năng quản trị viên

- Theo dõi tổng quan hoạt động hậu mãi và bảo hành.
- Quản lý danh sách và thông tin chi tiết yêu cầu.
- Phân công hoặc thay đổi nhân viên phụ trách.
- Theo dõi tiến độ giải quyết và lịch sử xử lý.
- Quản lý lịch hẹn chăm sóc cây.
- Giám sát tình trạng SLA và các yêu cầu quá hạn.

## 6. Cơ sở dữ liệu

Dự án sử dụng Microsoft SQL Server với cơ sở dữ liệu:

```text
QuanLyCayCanh
```

Tệp SQL được đặt tại:

```text
AfterSalesWarranty/QuanLyCayCanh.sql
```

Cơ sở dữ liệu gồm **26 bảng**, phục vụ các nhóm nghiệp vụ:

- Quản lý tài khoản, khách hàng và nhân viên.
- Quản lý danh mục, sản phẩm và tồn kho.
- Quản lý đơn mua, đơn thuê và thanh toán.
- Quản lý chính sách dịch vụ.
- Quản lý yêu cầu hậu mãi và bảo hành.
- Quản lý lịch hẹn chăm sóc cây.
- Lưu trữ lịch sử trạng thái và tương tác hỗ trợ.

Các bảng được liên kết bằng khóa chính, khóa ngoại và những ràng buộc dữ liệu nhằm hỗ trợ quá trình lưu trữ, truy xuất và xử lý nghiệp vụ.

## 7. Hướng dẫn cài đặt và chạy dự án

### Bước 1. Chuẩn bị mã nguồn

Mở thư mục `AfterSalesWarranty` bằng Visual Studio Code.

Kiểm tra các thành phần:

- Thư mục `backend`.
- Thư mục `frontend`.
- Tệp `QuanLyCayCanh.sql`.

### Bước 2. Khởi tạo cơ sở dữ liệu

1. Mở SQL Server Management Studio.
2. Kết nối đến SQL Server.
3. Chọn **File → Open → File**.
4. Mở tệp `QuanLyCayCanh.sql`.
5. Thực thi script SQL để khởi tạo cơ sở dữ liệu.
6. Kiểm tra các bảng và dữ liệu đã được tạo.

**Lưu ý:** Nếu cơ sở dữ liệu đã tồn tại, cần kiểm tra script trước khi thực thi để tránh ảnh hưởng dữ liệu hiện có.

### Bước 3. Cấu hình kết nối Backend

Kiểm tra hai tệp:

```text
backend/.env
backend/src/config/DatabaseConfig.ts
```

Điều chỉnh thông tin kết nối theo SQL Server trên máy sử dụng:

- Tên máy chủ hoặc SQL Server instance.
- Tên cơ sở dữ liệu `QuanLyCayCanh`.
- Phương thức xác thực.
- Quyền truy cập cơ sở dữ liệu.

Trong môi trường phát triển, dự án sử dụng SQL Server với **Windows Authentication**. Khi chạy trên máy khác, cần bảo đảm tài khoản Windows được cấp quyền truy cập phù hợp.

### Bước 4. Khởi chạy Backend

Mở Terminal thứ nhất tại thư mục `AfterSalesWarranty`.

Thực hiện:

```bash
cd backend
npm install
npm run start:dev
```

Giữ Terminal hoạt động để Backend tiếp nhận các yêu cầu từ Frontend.

Địa chỉ và cổng Backend được xác định theo cấu hình trong `backend/src/main.ts` và tệp `.env`.

### Bước 5. Cấu hình và chạy Frontend

Mở Terminal thứ hai tại thư mục `AfterSalesWarranty`.

Thực hiện:

```bash
cd frontend
npm install
npm run dev
```

Trước khi kiểm tra chức năng, bảo đảm địa chỉ API trong `frontend/.env.local` phù hợp với địa chỉ Backend.

Sau khi Frontend khởi chạy, mở trình duyệt và truy cập:

**http://localhost:3000**

Đây là địa chỉ mặc định của Next.js. Nếu Terminal hiển thị cổng khác, sử dụng địa chỉ thực tế.

### Bước 6. Kiểm tra hoạt động

Kiểm tra lần lượt:

1. SQL Server đang chạy.
2. Backend đã kết nối với cơ sở dữ liệu.
3. Frontend đã khởi chạy thành công.
4. Trang đăng nhập hoạt động.
5. Các chức năng truy xuất và cập nhật dữ liệu có thể giao tiếp với Backend.

**Phương thức chạy chính:** Khởi chạy thủ công bằng npm. Tệp Docker Compose hiện chưa được xác nhận có cấu hình đầy đủ nên không sử dụng làm hướng dẫn chạy mặc định.

## 8. Tài khoản kiểm thử

Các tài khoản được sử dụng để giảng viên kiểm tra chức năng:

| Vai trò | Tên đăng nhập | Mật khẩu |
|---|---|---|
| Khách hàng | `tu1` | `123` |
| Quản trị viên | `nhai1` | `1` |
| Nhân viên | `nhai2` | `2` |
| Nhân viên | `nhai3` | `3` |

Các tài khoản trên chỉ phục vụ môi trường kiểm thử đồ án và cần có sẵn trong cơ sở dữ liệu được bàn giao.

Không sử dụng mật khẩu thử nghiệm khi triển khai ứng dụng công khai.

## 9. Hướng dẫn giảng viên kiểm tra chức năng

### 9.1. Kiểm tra tài khoản khách hàng

Sử dụng tài khoản:

```text
Username: tu1
Password: 123
```

Các bước kiểm tra:

1. Truy cập Website và đăng nhập.
2. Xem danh sách sản phẩm cây cảnh.
3. Kiểm tra thông tin đơn mua hoặc thuê.
4. Truy cập chức năng hỗ trợ khách hàng.
5. Tạo yêu cầu hậu mãi hoặc bảo hành.
6. Theo dõi trạng thái và kết quả xử lý.
7. Xem thông tin lịch hẹn nếu có.

### 9.2. Kiểm tra tài khoản quản trị viên

Sử dụng tài khoản:

```text
Username: nhai1
Password: 1
```

Các bước kiểm tra:

1. Đăng nhập vào khu vực quản trị.
2. Xem trang tổng quan hậu mãi.
3. Tra cứu danh sách yêu cầu.
4. Xem chi tiết yêu cầu của khách hàng.
5. Phân công nhân viên phụ trách xử lý.
6. Theo dõi trạng thái yêu cầu và lịch hẹn.
7. Kiểm tra tình trạng SLA phản hồi, xử lý.

### 9.3. Kiểm tra tài khoản nhân viên

Sử dụng một trong hai tài khoản:

```text
Username: nhai2
Password: 2
```

Hoặc:

```text
Username: nhai3
Password: 3
```

Các bước kiểm tra:

1. Đăng nhập vào khu vực nhân viên.
2. Xem danh sách yêu cầu được phân công.
3. Mở chi tiết hồ sơ để xác minh thông tin.
4. Thực hiện cập nhật tiến độ xử lý.
5. Ghi nhận kết quả hậu mãi hoặc bảo hành.
6. Theo dõi và cập nhật lịch hẹn.
7. Kiểm tra danh sách SLA.

### 9.4. Quy trình kiểm tra tổng thể

Giảng viên có thể kiểm tra luồng nghiệp vụ chính theo trình tự:

**Khách hàng tạo yêu cầu → Quản trị viên phân công nhân viên → Nhân viên xác minh → Xử lý hậu mãi hoặc bảo hành → Cập nhật kết quả → Khách hàng theo dõi tiến độ.**

Quy trình này giúp kiểm tra sự phối hợp giữa các vai trò, khả năng trao đổi dữ liệu giữa Frontend và Backend, cũng như việc lưu trữ thông tin trong SQL Server.

## 10. Kết quả đạt được

Đề tài đã xây dựng Website phục vụ quản lý hoạt động mua, thuê cây cảnh và các nghiệp vụ hậu mãi, bảo hành.

Các kết quả chính:

- Xây dựng giao diện theo ba nhóm người dùng.
- Thiết kế cơ sở dữ liệu SQL Server.
- Phát triển Frontend sử dụng Next.js và TypeScript.
- Phát triển Backend sử dụng NestJS và TypeScript.
- Kết nối Frontend với Backend thông qua API.
- Xây dựng chức năng tiếp nhận và theo dõi yêu cầu hỗ trợ.
- Hỗ trợ xác minh, phân công và xử lý yêu cầu.
- Quản lý lịch hẹn chăm sóc cây.
- Theo dõi thời hạn phản hồi và xử lý theo SLA.

## 11. Lỗi thường gặp và cách khắc phục

| Vấn đề | Nguyên nhân có thể gặp | Cách khắc phục |
|---|---|---|
| Không kết nối được SQL Server | Sai thông tin máy chủ hoặc thiếu quyền truy cập | Kiểm tra SQL Server, cấu hình kết nối và Windows Authentication. |
| Backend không khởi động | Thiếu thư viện hoặc lỗi cấu hình | Kiểm tra Terminal và thực hiện `npm install`. |
| Frontend không gọi được API | Sai địa chỉ API hoặc Backend chưa chạy | Kiểm tra `.env.local` và trạng thái Backend. |
| Không đăng nhập được | Sai tài khoản hoặc dữ liệu chưa được khởi tạo | Kiểm tra tài khoản thử nghiệm và dữ liệu SQL Server. |
| Không hiển thị sản phẩm hoặc yêu cầu | Lỗi kết nối API hoặc dữ liệu không tồn tại | Kiểm tra API, Backend và cơ sở dữ liệu. |
| Không truy cập được trang quản lý | Tài khoản không có quyền phù hợp | Kiểm tra vai trò và thông tin đăng nhập. |
| Không chạy được lệnh npm | Node.js hoặc thư viện chưa phù hợp | Kiểm tra phiên bản Node.js và cài đặt lại dependencies. |
| Cổng ứng dụng đã được sử dụng | Có chương trình khác sử dụng cùng cổng | Dừng chương trình đang chiếm cổng hoặc thay đổi cấu hình. |

Bảng trên là hướng dẫn xử lý sự cố khi chạy lại dự án, không thay thế cho nhật ký lỗi và kết quả kiểm thử thực tế.

## 12. Hạn chế

Chức năng quản lý tương tác đa kênh chưa được hoàn thiện đầy đủ. Việc tích hợp và đồng bộ tự động giữa Website, Email, điện thoại và Chat chưa được triển khai hoàn chỉnh.

Ứng dụng hiện chủ yếu được phát triển và chạy thử trên môi trường máy tính cá nhân, chưa có thông tin xác nhận việc triển khai chính thức trên máy chủ Production.

## 13. Hướng phát triển

- Hoàn thiện việc tích hợp và đồng bộ các kênh hỗ trợ khách hàng.
- Phát triển chức năng thông báo tự động về tiến độ và thời hạn SLA.
- Tối ưu hiệu suất truy xuất và xử lý dữ liệu.
- Nâng cao khả năng bảo mật và quản lý quyền truy cập.
- Cải thiện trải nghiệm sử dụng trên thiết bị di động.
- Bổ sung kiểm thử tự động và hoàn thiện quy trình triển khai.

## 14. Hướng dẫn kiểm tra và bàn giao mã nguồn

Khi bàn giao, cần bảo đảm có đầy đủ:

- Thư mục `backend/` chứa mã nguồn NestJS.
- Thư mục `frontend/` chứa mã nguồn Next.js.
- Tệp `QuanLyCayCanh.sql` phục vụ khởi tạo cơ sở dữ liệu.
- Các tệp `package.json` và `package-lock.json`.
- Tài liệu hướng dẫn `README.md`.

Các tệp cấu hình môi trường phải được điều chỉnh phù hợp với máy kiểm tra. Không công khai mật khẩu cơ sở dữ liệu, khóa JWT hoặc thông tin nhạy cảm.

Có thể tham khảo thêm:

- **Backend:** `backend/README.md`.
- **Frontend:** `frontend/README.md`.

---

**Sinh viên thực hiện:** Nguyễn Thị Kim Liên

**MSSV:** 1250080097

**Giảng viên hướng dẫn:** ThS. Phạm Trọng Huynh

**Đề tài:** Cổng hậu mãi và bảo hành đa kênh