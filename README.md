# QuanLyCayCanh - Hệ thống quản lý cho thuê và bán cây cảnh

Hệ thống quản lý cổng hậu mãi và bảo hành đa kênh cho mua thuê cây cảnh.

## Cấu trúc dự án

```
DAPTTK/
├── frontend/                 # Next.js 14 Frontend
│   ├── src/
│   │   ├── pages/           # Next.js App Router pages
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── guards/          # Route guards
│   │   ├── types/           # TypeScript types
│   │   ├── lib/             # Library configs
│   │   ├── utils/           # Utility functions
│   │   └── styles/          # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── Dockerfile
├── backend/                  # NestJS Backend
│   ├── src/
│   │   ├── auth/            # Authentication module
│   │   ├── public/          # Public APIs
│   │   ├── customer/        # Customer APIs
│   │   ├── staff/           # Staff APIs
│   │   ├── admin/           # Admin APIs
│   │   ├── business/        # Business logic
│   │   ├── database/        # Database entities
│   │   ├── common/          # Common utilities
│   │   ├── integrations/    # External integrations
│   │   └── redis/           # Redis module
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── database/                 # SQL Scripts
│   ├── scripts/
│   │   ├── 01-create-database.sql
│   │   ├── 02-create-tables.sql
│   │   ├── 03-create-constraints.sql
│   │   ├── 04-create-views.sql
│   │   ├── 05-create-triggers.sql
│   │   ├── 06-create-procedures.sql
│   │   └── 07-seed-data.sql
│   └── QuanLyCayCanh.sql    # Complete database script
├── docker/                   # Docker configs
│   ├── sqlserver/
│   └── redis/
├── docker-compose.yml
└── README.md
```

## Yêu cầu hệ thống

- Node.js 20+
- Docker & Docker Compose
- SQL Server 2022 (hoặc dùng Docker)
- Redis 7 (hoặc dùng Docker)

## Cách chạy dự án

### 1. Chạy với Docker Compose (Khuyên dùng)

```bash
# Clone project
cd DAPTTK

# Chạy tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

Sau khi chạy, truy cập:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs (Swagger): http://localhost:3001/api

### 2. Chạy thủ công (Development)

#### Backend
```bash
cd backend

# Cài đặt dependencies
npm install

# Copy environment variables
cp .env.example .env

# Chỉnh sửa .env với cấu hình database của bạn
# DB_HOST=localhost
# DB_PORT=1433
# DB_USERNAME=sa
# DB_PASSWORD=YourStrong@Passw0rd
# DB_NAME=QuanLyCayCanh

# Chạy database (nếu chưa có)
# Chạy file database/QuanLyCayCanh.sql trên SQL Server

# Chạy development server
npm run start:dev
```

#### Frontend
```bash
cd frontend

# Cài đặt dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Chạy development server
npm run dev
```

### 3. Khởi tạo Database

Chạy file SQL theo thứ tự trong `database/scripts/` hoặc chạy file `database/QuanLyCayCanh.sql` hoàn chỉnh:

```bash
# Trên SQL Server Management Studio hoặc sqlcmd
sqlcmd -S localhost -U sa -P 'YourStrong@Passw0rd' -i database/QuanLyCayCanh.sql
```

## Tài khoản mặc định (sau khi seed data)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@quanlycaycanh.test | 123456 |
| Nhân viên | nhanvien1@quanlycaycanh.test | 123456 |
| Khách hàng | khach1@quanlycaycanh.test | 123456 |

## Tính năng chính

### Khách hàng
- Xem sản phẩm (cây cảnh) với giá mua, giá thuê, giá cọc
- Giỏ hàng hỗ trợ cả mua và thuê trong cùng một giỏ
- Chọn ngày thuê, gói thuê (Cơ bản/Cao cấp)
- Chọn dịch vụ đi kèm (bảo hành, chăm sóc, tư vấn)
- Thanh toán đa phương thức (COD, VNPay, MoMo, Chuyển khoản)
- Theo dõi đơn hàng, đơn thuê
- Tạo yêu cầu hậu mãi, bảo hành, đổi trả đa kênh
- Xem lịch sử bảo hành, lịch chăm sóc

### Nhân viên
- Quản lý đơn hàng (xác nhận, giao hàng)
- Quản lý đơn thuê (bàn giao, kiểm tra, quyết toán)
- Xử lý yêu cầu hậu mãi, bảo hành
- Lên lịch chăm sóc cây
- Theo dõi SLA

### Quản trị viên
- Quản lý người dùng, phân quyền
- Quản lý sản phẩm, danh mục, kho, tồn kho
- Quản lý khuyến mãi, chính sách dịch vụ
- Báo cáo doanh thu, thống kê
- Cài đặt hệ thống

## Database Schema

Database được thiết kế theo chuẩn SQL Server với các bảng chính:
- **VaiTro, NguoiDung, KhachHang, NhanVien** - Quản lý người dùng
- **SanPham, DanhMuc, TonKho, Kho** - Quản lý sản phẩm & kho
- **GioHang, ChiTietGioHang** - Giỏ hàng (hỗ trợ mua & thuê)
- **DonHang, ChiTietDonHang** - Đơn hàng mua
- **DonThue, ChiTietDonThue** - Đơn thuê (có hợp đồng, cọc, quyết toán)
- **ThanhToan** - Thanh toán đa loại (mua, thuê, cọc, dịch vụ, bồi thường)
- **YeuCauHauMai, BaoHanh, LichHenChamSoc** - Hậu mãi & bảo hành đa kênh
- **KhuyenMai, ChiTietKhuyenMai, ChinhSachDichVu** - Khuyến mãi & chính sách
- **DanhGia, KenhHoTro** - Đánh giá & kênh hỗ trợ

## Công nghệ sử dụng

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Axios, SWR, Zustand
- React Hook Form + Zod

### Backend
- NestJS 10
- TypeORM
- SQL Server (mssql)
- Redis (caching, session)
- JWT Authentication
- Passport.js
- Class Validator + Transformer

## Triển khai Production

```bash
# Build images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Biến môi trường Production quan trọng

```env
# Backend
NODE_ENV=production
JWT_SECRET=your-very-secure-random-secret-key
DB_HOST=your-sql-server-host
DB_PASSWORD=your-secure-db-password
REDIS_HOST=your-redis-host

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Cấu trúc Database quan trọng

Xem file `database/QuanLyCayCanh.sql` để hiểu đầy đủ schema. Các điểm nổi bật:

1. **Sản phẩm** có 3 loại: `Bán`, `Thuê`, `Bán và thuê` - mỗi loại yêu cầu giá tương ứng
2. **Giỏ hàng** hỗ trợ trộn lẫn mua và thuê, thuê cần chọn ngày bắt đầu/kết thúc
3. **Đơn thuê** có quy trình: Xác nhận → Bàn giao → Đang thuê → Chờ trả → Kiểm tra → Quyết toán
4. **Hậu mãi/Bảo hành** liên kết chặt chẽ với đơn hàng/đơn thuê và chính sách dịch vụ
5. **SLA** được tính toán tự động qua view `vwQuyenLoiYeuCau`
6. **Quyết toán thuê** tự động tính tiền thuê thực tế, bồi thường, hoàn cọc qua stored procedure `spQuyetToanThue`

## Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## License

MIT License - Xem file LICENSE để biết thêm chi tiết.