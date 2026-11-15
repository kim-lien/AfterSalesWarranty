# BACKEND – CỔNG HẬU MÃI VÀ BẢO HÀNH ĐA KÊNH

## 1. Thông tin đồ án

| Thông tin | Nội dung |
|---|---|
| Họ và tên | Nguyễn Thị Kim Liên |
| MSSV | 1250080097 |
| Lớp | 12_ĐH_CNPM1 |
| Môn học | Phương pháp phát triển phần mềm hướng đối tượng |
| Giảng viên hướng dẫn | ThS. Phạm Trọng Huynh |
| Đề tài | Cổng hậu mãi và bảo hành đa kênh |
| Thành phần | Backend – NestJS |

## 2. Giới thiệu Backend

Backend được phát triển bằng **NestJS và TypeScript**, đảm nhiệm việc tiếp nhận yêu cầu từ Frontend, xử lý nghiệp vụ và trao đổi dữ liệu với Microsoft SQL Server.

Các chức năng chính bao gồm xác thực người dùng, quản lý sản phẩm, danh mục, giỏ hàng và thanh toán, xử lý đơn mua, đơn thuê, quản lý tồn kho và các nghiệp vụ hậu mãi, bảo hành.

Backend sử dụng mô hình tổ chức **Controller – Service – Module**, giúp phân chia trách nhiệm và thuận tiện cho quá trình phát triển, bảo trì.

## 3. Công nghệ và môi trường

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ lập trình | TypeScript |
| Framework | NestJS |
| Nền tảng chạy | Node.js |
| Cơ sở dữ liệu | Microsoft SQL Server |
| Kết nối cơ sở dữ liệu | mssql / msnodesqlv8 |
| Xác thực cơ sở dữ liệu | Windows Authentication |
| Xác thực API | JWT |
| Quản lý thư viện | npm |
| Công cụ lập trình | Visual Studio Code |
| Hệ điều hành phát triển | Windows |

**Phiên bản:** Kiểm tra Node.js bằng `node -v`, npm bằng `npm -v` và phiên bản NestJS, TypeScript trong `package.json`. Các phiên bản cụ thể cần được xác nhận từ môi trường chạy thực tế.

## 4. Cấu trúc thư mục Backend

```text
backend/
├── dist/
├── node_modules/
├── src/
│   ├── config/
│   │   └── DatabaseConfig.ts
│   ├── controllers/
│   │   ├── AddressController.ts
│   │   ├── AppController.ts
│   │   ├── AuthController.ts
│   │   ├── CategoryController.ts
│   │   ├── CheckoutController.ts
│   │   ├── OrderController.ts
│   │   ├── PaymentController.ts
│   │   ├── PlantController.ts
│   │   ├── RentalController.ts
│   │   ├── StockController.ts
│   │   └── SupportController.ts
│   ├── database/
│   ├── decorators/
│   ├── dto/
│   ├── guards/
│   │   └── JwtGuard.ts
│   ├── modules/
│   │   ├── AddressModule.ts
│   │   ├── AppModule.ts
│   │   ├── AuthModule.ts
│   │   ├── CategoryModule.ts
│   │   ├── CheckoutModule.ts
│   │   ├── DatabaseModule.ts
│   │   ├── OrderModule.ts
│   │   ├── PaymentModule.ts
│   │   ├── PlantModule.ts
│   │   ├── RentalModule.ts
│   │   ├── StockModule.ts
│   │   └── SupportModule.ts
│   ├── services/
│   │   ├── AppService.ts
│   │   ├── AuthService.ts
│   │   ├── CategoryService.ts
│   │   ├── CheckoutService.ts
│   │   ├── OrderService.ts
│   │   ├── PaymentService.ts
│   │   ├── PlantService.ts
│   │   └── SupportService.ts
│   └── main.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── uploads/
├── .env
├── .gitignore
├── eslint.config.json
├── package.json
├── package-lock.json
├── nest-cli.json
├── jest.config.ts
├── ResetDemoPassword.cjs
├── TestDatabase.cjs
├── tsconfig.json
└── README.md
```

**Lưu ý:** Cấu trúc trên tổng hợp những tệp và thư mục hiển thị trong ảnh. Các thư mục chưa mở rộng như `database`, `decorators`, `dto` có thể chứa thêm những tệp khác.

## 5. Chức năng các thành phần chính

### 5.1. Controllers

Controllers tiếp nhận các yêu cầu HTTP từ Frontend và chuyển đến Service xử lý.

| Controller | Nhóm chức năng |
|---|---|
| AuthController | Đăng nhập, xác thực tài khoản |
| PlantController | Thông tin cây cảnh |
| CategoryController | Danh mục sản phẩm |
| AddressController | Địa chỉ khách hàng |
| CheckoutController | Quy trình đặt hàng, thanh toán |
| OrderController | Quản lý đơn mua |
| RentalController | Quản lý đơn thuê |
| PaymentController | Thông tin thanh toán |
| StockController | Quản lý tồn kho |
| SupportController | Nghiệp vụ hỗ trợ, hậu mãi và bảo hành |
| AppController | Các yêu cầu chung của ứng dụng |

### 5.2. Services

Services thực hiện xử lý nghiệp vụ và phối hợp truy xuất dữ liệu.

Các Service được tổ chức theo những nhóm chức năng chính:

- `AuthService`: Xử lý nghiệp vụ xác thực.
- `PlantService`: Xử lý thông tin sản phẩm.
- `CategoryService`: Xử lý danh mục.
- `CheckoutService`: Xử lý nghiệp vụ đặt hàng.
- `OrderService`: Xử lý đơn mua.
- `PaymentService`: Xử lý thanh toán.
- `SupportService`: Xử lý nghiệp vụ hỗ trợ khách hàng.

### 5.3. Modules

Modules tổ chức Controllers, Services và các thành phần liên quan theo từng nhóm chức năng.

`AppModule.ts` là Module chính, được sử dụng để tổ chức các Module của ứng dụng.

### 5.4. Database

- `DatabaseConfig.ts`: Chứa cấu hình kết nối cơ sở dữ liệu.
- `DatabaseModule.ts`: Module phục vụ việc tổ chức kết nối và sử dụng cơ sở dữ liệu.
- `database/`: Chứa các thành phần liên quan đến dữ liệu.

### 5.5. Guards và DTO

- `JwtGuard.ts`: Thành phần kiểm soát quyền truy cập thông qua JWT.
- `dto/`: Chứa các đối tượng truyền dữ liệu giữa các thành phần.
- `decorators/`: Chứa các decorator hỗ trợ xử lý trong ứng dụng.

## 6. Hướng dẫn cài đặt Backend

### Bước 1. Chuẩn bị môi trường

Cài đặt:

- Node.js và npm.
- Microsoft SQL Server.
- SQL Server Management Studio.

### Bước 2. Khởi tạo cơ sở dữ liệu

Mở SQL Server Management Studio và thực hiện:

1. Kết nối đến SQL Server.
2. Mở tệp `QuanLyCayCanh.sql` nằm ở thư mục gốc `AfterSalesWarranty`.
3. Chạy script để khởi tạo cơ sở dữ liệu.
4. Kiểm tra các bảng và dữ liệu đã được tạo.

Tên cơ sở dữ liệu:

```text
QuanLyCayCanh
```

### Bước 3. Cài đặt thư viện

Mở Terminal tại thư mục `AfterSalesWarranty/backend`.

Chạy:

```bash
npm install
```

Nếu dự án có `package-lock.json` hợp lệ và cần cài đúng phiên bản phụ thuộc đã khóa, có thể sử dụng:

```bash
npm ci
```

### Bước 4. Cấu hình cơ sở dữ liệu

Kiểm tra:

```text
backend/.env
backend/src/config/DatabaseConfig.ts
```

Các thông tin cần phù hợp với máy chạy:

- Tên SQL Server hoặc instance.
- Tên cơ sở dữ liệu `QuanLyCayCanh`.
- Phương thức xác thực.
- Quyền truy cập SQL Server.

Dự án được phát triển với SQL Server sử dụng Windows Authentication. Khi chuyển sang máy khác, cần điều chỉnh thông tin kết nối cho phù hợp.

Không công khai mật khẩu, khóa JWT hoặc thông tin kết nối nhạy cảm.

### Bước 5. Khởi chạy Backend

Tại thư mục `backend`, thực hiện:

```bash
npm run start:dev
```

Nếu cấu hình hợp lệ, Backend sẽ khởi động và tiếp nhận yêu cầu từ Frontend.

Địa chỉ và cổng API được xác định theo cấu hình trong `src/main.ts` và `.env`.

## 7. Hướng dẫn kiểm tra Backend

### 7.1. Kiểm tra kết nối SQL Server

Trong thư mục `backend` có tệp:

```text
TestDatabase.cjs
```

Có thể mở tệp để xem cách kiểm tra kết nối cơ sở dữ liệu. Chỉ chạy script sau khi xác nhận nội dung và các cấu hình cần thiết.

### 7.2. Kiểm tra API

Giảng viên có thể sử dụng trình duyệt, Postman hoặc Frontend của dự án để kiểm tra API.

Các nhóm nghiệp vụ cần kiểm tra:

1. Xác thực và đăng nhập.
2. Truy xuất danh mục, sản phẩm.
3. Quản lý đơn mua và đơn thuê.
4. Quản lý thông tin thanh toán.
5. Tiếp nhận yêu cầu hỗ trợ.
6. Xác minh, phân công và xử lý hậu mãi, bảo hành.
7. Theo dõi lịch hẹn và tình trạng SLA.

**Lưu ý:** Địa chỉ endpoint, phương thức HTTP và dữ liệu đầu vào phải được đối chiếu trực tiếp với các Controller trong `src/controllers`. Không sử dụng đường dẫn API giả định.

### 7.3. Kiểm tra xác thực theo vai trò

Các tài khoản kiểm thử:

| Vai trò | Tài khoản | Mật khẩu |
|---|---|---|
| Khách hàng | `tu1` | `123` |
| Quản trị viên | `nhai1` | `1` |
| Nhân viên | `nhai2` | `2` |
| Nhân viên | `nhai3` | `3` |

Các tài khoản cần tồn tại trong cơ sở dữ liệu được bàn giao cùng dự án.

### 7.4. Kiểm tra bằng Frontend

Để kiểm tra luồng nghiệp vụ đầy đủ:

1. Khởi chạy SQL Server.
2. Khởi chạy Backend.
3. Khởi chạy Frontend.
4. Đăng nhập bằng tài khoản khách hàng.
5. Tạo yêu cầu hậu mãi hoặc bảo hành.
6. Đăng nhập bằng tài khoản quản trị viên để phân công nhân viên.
7. Đăng nhập bằng tài khoản nhân viên để xử lý yêu cầu.
8. Kiểm tra thông tin được cập nhật và lưu trữ trong SQL Server.

## 8. Kiểm thử

Thư mục `test/` chứa các tệp cấu hình và mã kiểm thử E2E:

```text
test/
├── app.e2e-spec.ts
└── jest-e2e.json
```

Để kiểm tra các script kiểm thử được hỗ trợ, mở `package.json`.

Nếu có script tương ứng, có thể chạy:

```bash
npm run test
```

Hoặc:

```bash
npm run test:e2e
```

Kết quả kiểm thử thực tế phụ thuộc vào cấu hình, dữ liệu và trạng thái hoạt động của Backend tại thời điểm chạy.

## 9. Kết quả đạt được

Backend đã được xây dựng bằng NestJS và TypeScript với các thành phần Controller, Service, Module, DTO và Guard.

Mã nguồn được tổ chức thành các nhóm chức năng phục vụ xác thực tài khoản, quản lý sản phẩm, giao dịch mua hoặc thuê, thanh toán và hỗ trợ nghiệp vụ hậu mãi, bảo hành.

Ứng dụng sử dụng SQL Server để lưu trữ và truy xuất dữ liệu phục vụ hoạt động của Website.

## 10. Lỗi thường gặp và cách khắc phục

| Vấn đề | Nguyên nhân có thể gặp | Hướng xử lý |
|---|---|---|
| Không kết nối được SQL Server | Sai tên server hoặc thiếu quyền truy cập | Kiểm tra `DatabaseConfig.ts`, `.env` và quyền Windows Authentication. |
| Backend không khởi động | Thiếu thư viện hoặc lỗi cấu hình | Chạy `npm install`, kiểm tra thông báo Terminal. |
| Frontend không gọi được API | Sai địa chỉ API hoặc cổng Backend | Kiểm tra `main.ts`, cấu hình CORS và địa chỉ API. |
| API trả về lỗi xác thực | Token hoặc quyền truy cập không hợp lệ | Kiểm tra cấu hình JWT và `JwtGuard.ts`. |
| Không truy xuất được dữ liệu | Cơ sở dữ liệu chưa được khởi tạo hoặc kết nối lỗi | Chạy script SQL và kiểm tra kết nối. |
| Xảy ra lỗi khi cập nhật dữ liệu | Dữ liệu không hợp lệ hoặc vi phạm ràng buộc | Kiểm tra DTO, dữ liệu đầu vào và các ràng buộc SQL Server. |

Đây là các tình huống cần kiểm tra khi vận hành Backend, không phải danh sách xác nhận các lỗi đã gặp trong quá trình phát triển.

## 11. Hạn chế và hướng phát triển

### Hạn chế

Backend đã được tổ chức để phục vụ các nghiệp vụ hậu mãi và bảo hành. Tuy nhiên, việc tích hợp và đồng bộ tương tác tự động giữa Website với Email, điện thoại và Chat chưa được hoàn thiện đầy đủ.

### Hướng phát triển

- Hoàn thiện kết nối và đồng bộ dữ liệu đa kênh.
- Phát triển cơ chế thông báo về tiến độ và thời hạn SLA.
- Tối ưu khả năng truy xuất và xử lý dữ liệu.
- Bổ sung kiểm thử tự động cho các API nghiệp vụ.
- Tăng cường bảo mật và khả năng triển khai trên máy chủ thực tế.

## 12. Lưu ý khi bàn giao

- Cần có tệp SQL để khởi tạo cơ sở dữ liệu.
- Cấu hình SQL Server phải phù hợp với máy kiểm tra.
- Không chia sẻ công khai `.env` có chứa thông tin nhạy cảm.
- Không cần sao chép `node_modules` hoặc `dist` khi bàn giao nếu có thể cài đặt và build lại.
- Kiểm tra các tài khoản thử nghiệm trước khi giảng viên sử dụng.
- Chạy Backend trước khi kiểm tra các chức năng từ Frontend.

---

**Sinh viên thực hiện:** Nguyễn Thị Kim Liên

**MSSV:** 1250080097

**Đề tài:** Cổng hậu mãi và bảo hành đa kênh