
IF DB_ID(N'QuanLyCayCanh') IS NULL
    CREATE DATABASE QuanLyCayCanh;
GO

USE QuanLyCayCanh;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
GO

CREATE TABLE VaiTro (
    MaVaiTro INT IDENTITY(1,1) PRIMARY KEY,
    TenVaiTro NVARCHAR(50) NOT NULL UNIQUE,
    MoTa NVARCHAR(255)
);

CREATE TABLE NguoiDung (
    MaNguoiDung INT IDENTITY(1,1) PRIMARY KEY,
    MaVaiTro INT NOT NULL,
    HoTen NVARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    MatKhau VARCHAR(255) NOT NULL,
    SDT VARCHAR(15),
    TrangThai BIT NOT NULL DEFAULT 1,
    NgayTao DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_NguoiDungVaiTro
        FOREIGN KEY (MaVaiTro) REFERENCES VaiTro(MaVaiTro),
    CONSTRAINT CK_NguoiDungEmail
        CHECK (Email LIKE '%_@_%._%')
);

CREATE TABLE KhachHang (
    MaKH INT IDENTITY(1,1) PRIMARY KEY,
    MaNguoiDung INT NOT NULL UNIQUE,
    NgaySinh DATE,
    GioiTinh NVARCHAR(20),
    DiemTichLuy INT NOT NULL DEFAULT 0,
    DaXacMinhDanhTinh BIT NOT NULL DEFAULT 0,
    ThoiGianXacMinh DATETIME2(0),
    CONSTRAINT FK_KhachHangNguoiDung
        FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung),
    CONSTRAINT CK_KhachHangDiem
        CHECK (DiemTichLuy >= 0)
);

CREATE TABLE NhanVien (
    MaNV INT IDENTITY(1,1) PRIMARY KEY,
    MaNguoiDung INT NOT NULL UNIQUE,
    ChucVu NVARCHAR(100),
    NgayVaoLam DATE,
    TrangThai BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_NhanVienNguoiDung
        FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung)
);

CREATE TABLE DiaChi (
    MaDiaChi INT IDENTITY(1,1) PRIMARY KEY,
    MaNguoiDung INT NOT NULL,
    TenNguoiNhan NVARCHAR(100) NOT NULL,
    SDT VARCHAR(15) NOT NULL,
    TinhThanh NVARCHAR(100) NOT NULL,
    QuanHuyen NVARCHAR(100),
    PhuongXa NVARCHAR(100),
    DiaChiChiTiet NVARCHAR(255) NOT NULL,
    MaBuuChinh VARCHAR(20),
    KinhDo DECIMAL(9,6),
    ViDo DECIMAL(9,6),
    MacDinh BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_DiaChiNguoiDung
        FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung),
    CONSTRAINT UQ_DiaChiNguoiDung UNIQUE (MaDiaChi, MaNguoiDung),
    CONSTRAINT CK_DiaChiToaDo
        CHECK (
            (KinhDo IS NULL AND ViDo IS NULL)
            OR
            (KinhDo BETWEEN -180 AND 180 AND ViDo BETWEEN -90 AND 90)
        )
);

CREATE UNIQUE INDEX UQ_DiaChiMacDinh
ON DiaChi(MaNguoiDung)
WHERE MacDinh = 1;

CREATE TABLE Kho (
    MaKho INT IDENTITY(1,1) PRIMARY KEY,
    TenKho NVARCHAR(150) NOT NULL UNIQUE,
    DiaChi NVARCHAR(255) NOT NULL,
    KinhDo DECIMAL(9,6),
    ViDo DECIMAL(9,6),
    BanKinhPhucVuKM DECIMAL(10,2),
    TrangThai BIT NOT NULL DEFAULT 1,
    CONSTRAINT CK_KhoBanKinh
        CHECK (BanKinhPhucVuKM IS NULL OR BanKinhPhucVuKM >= 0),
    CONSTRAINT CK_KhoToaDo
        CHECK (
            (KinhDo IS NULL AND ViDo IS NULL)
            OR
            (KinhDo BETWEEN -180 AND 180 AND ViDo BETWEEN -90 AND 90)
        )
);

CREATE TABLE DanhMuc (
    MaDM INT IDENTITY(1,1) PRIMARY KEY,
    MaDMCha INT NULL,
    TenDM NVARCHAR(100) NOT NULL,
    MoTa NVARCHAR(MAX),
    HinhAnh VARCHAR(500),
    TrangThai BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_DanhMucCha
        FOREIGN KEY (MaDMCha) REFERENCES DanhMuc(MaDM),
    CONSTRAINT CK_DanhMucCha
        CHECK (MaDMCha IS NULL OR MaDMCha <> MaDM)
);

CREATE UNIQUE INDEX UQ_DanhMucGoc
ON DanhMuc(TenDM)
WHERE MaDMCha IS NULL;

CREATE UNIQUE INDEX UQ_DanhMucCon
ON DanhMuc(MaDMCha, TenDM)
WHERE MaDMCha IS NOT NULL;

CREATE TABLE SanPham (
    MaSP INT IDENTITY(1,1) PRIMARY KEY,
    MaDM INT NOT NULL,
    TenSP NVARCHAR(150) NOT NULL UNIQUE,
    MoTa NVARCHAR(MAX),
    HinhAnh VARCHAR(500),
    LoaiSanPham NVARCHAR(30) NOT NULL DEFAULT N'Bán và thuê',
    GiaBan DECIMAL(18,2),
    GiaThueTheoNgay DECIMAL(18,2),
    GiaTriCay DECIMAL(18,2) NOT NULL,
    DuDieuKienBaoHanh BIT NOT NULL DEFAULT 0,
    ChieuCao NVARCHAR(50),
    NhuCauAnhSang NVARCHAR(100),
    HuongDanChamSoc NVARCHAR(MAX),
    DonViTinh NVARCHAR(20) NOT NULL DEFAULT N'Cây',
    TrangThai BIT NOT NULL DEFAULT 1,
    NgayTao DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_SanPhamDanhMuc
        FOREIGN KEY (MaDM) REFERENCES DanhMuc(MaDM),
    CONSTRAINT CK_SanPhamLoai
        CHECK (LoaiSanPham IN (N'Bán', N'Thuê', N'Bán và thuê')),
    CONSTRAINT CK_SanPhamGia
        CHECK (
            GiaTriCay > 0
            AND (GiaBan IS NULL OR GiaBan >= 0)
            AND (GiaThueTheoNgay IS NULL OR GiaThueTheoNgay >= 0)
        ),
    CONSTRAINT CK_SanPhamLoaiGia
        CHECK (
            (LoaiSanPham = N'Bán' AND GiaBan IS NOT NULL)
            OR
            (LoaiSanPham = N'Thuê' AND GiaThueTheoNgay IS NOT NULL)
            OR
            (
                LoaiSanPham = N'Bán và thuê'
                AND GiaBan IS NOT NULL
                AND GiaThueTheoNgay IS NOT NULL
            )
        )
);

CREATE TABLE TonKho (
    MaTonKho INT IDENTITY(1,1) PRIMARY KEY,
    MaKho INT NOT NULL,
    MaSP INT NOT NULL,
    SoLuongTon INT NOT NULL DEFAULT 0,
    SoLuongDangThue INT NOT NULL DEFAULT 0,
    SoLuongKhaDung AS
        (SoLuongTon - SoLuongDangThue) PERSISTED,
    NgayCapNhat DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_TonKhoKho
        FOREIGN KEY (MaKho) REFERENCES Kho(MaKho),
    CONSTRAINT FK_TonKhoSanPham
        FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP),
    CONSTRAINT UQ_TonKho UNIQUE (MaKho, MaSP),
    CONSTRAINT CK_TonKhoSoLuong
        CHECK (
            SoLuongTon >= 0
            AND SoLuongDangThue >= 0
            AND SoLuongDangThue <= SoLuongTon
        )
);

CREATE TABLE KhuyenMai (
    MaKM INT IDENTITY(1,1) PRIMARY KEY,
    TenKM NVARCHAR(150) NOT NULL UNIQUE,
    MoTa NVARCHAR(MAX),
    LoaiKM NVARCHAR(30) NOT NULL,
    NgayBatDau DATETIME2(0) NOT NULL,
    NgayKetThuc DATETIME2(0) NOT NULL,
    SoLuotToiDa INT,
    TrangThai BIT NOT NULL DEFAULT 1,
    NgayTao DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT CK_KhuyenMaiLoai
        CHECK (
            LoaiKM IN (
                N'Giảm giá',
                N'Giảm giá nhanh',
                N'Lễ Tết'
            )
        ),
    CONSTRAINT CK_KhuyenMaiNgay
        CHECK (NgayKetThuc > NgayBatDau),
    CONSTRAINT CK_KhuyenMaiLuot
        CHECK (SoLuotToiDa IS NULL OR SoLuotToiDa > 0)
);

CREATE TABLE ChinhSachDichVu (
    MaChinhSach INT IDENTITY(1,1) PRIMARY KEY,
    TenDichVu NVARCHAR(150) NOT NULL UNIQUE,
    NhomDichVu NVARCHAR(30) NOT NULL,
    HinhThuc NVARCHAR(20) NOT NULL,
    GoiApDung NVARCHAR(30) NOT NULL,
    SoNgayToiDa INT NOT NULL,
    SoGioToiDa INT NULL,
    YeuCauCayGiaTriCao BIT NOT NULL DEFAULT 0,
    YeuCauGoiCoPhi BIT NOT NULL DEFAULT 0,
    PhiMacDinh DECIMAL(18,2) NOT NULL DEFAULT 0,
    MoTaDieuKien NVARCHAR(MAX),
    HieuLucTu DATE NOT NULL DEFAULT CONVERT(DATE, GETDATE()),
    HieuLucDen DATE,
    TrangThai BIT NOT NULL DEFAULT 1,
    CONSTRAINT CK_ChinhSachNhom
        CHECK (
            NhomDichVu IN (
                N'Hậu mãi',
                N'Bảo hành',
                N'Đổi trả'
            )
        ),
    CONSTRAINT CK_ChinhSachHinhThuc
        CHECK (HinhThuc IN (N'Mua', N'Thuê')),
    CONSTRAINT CK_ChinhSachGoi
        CHECK (GoiApDung IN (N'Tất cả', N'Cơ bản', N'Cao cấp')),
    CONSTRAINT CK_ChinhSachNgay
        CHECK (SoNgayToiDa BETWEEN 1 AND 30),
    CONSTRAINT CK_ChinhSachGio
        CHECK (
            SoGioToiDa IS NULL
            OR SoGioToiDa BETWEEN 1 AND 720
        ),
    CONSTRAINT CK_ChinhSachPhi
        CHECK (PhiMacDinh >= 0),
    CONSTRAINT CK_ChinhSachHieuLuc
        CHECK (
            HieuLucDen IS NULL
            OR HieuLucDen >= HieuLucTu
        )
);

CREATE TABLE ChiTietKhuyenMai (
    MaCTKM INT IDENTITY(1,1) PRIMARY KEY,
    MaKM INT NOT NULL,
    DoiTuong NVARCHAR(30) NOT NULL,
    MaSP INT NULL,
    MaChinhSach INT NULL,
    PhanTramGiam DECIMAL(5,2),
    GiaKhuyenMai DECIMAL(18,2),
    SoLuongGioiHan INT,
    SoLuongDaDung INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_ChiTietKhuyenMaiKhuyenMai
        FOREIGN KEY (MaKM) REFERENCES KhuyenMai(MaKM),
    CONSTRAINT FK_ChiTietKhuyenMaiSanPham
        FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP),
    CONSTRAINT FK_ChiTietKhuyenMaiChinhSach
        FOREIGN KEY (MaChinhSach)
        REFERENCES ChinhSachDichVu(MaChinhSach),
    CONSTRAINT CK_ChiTietKhuyenMaiDoiTuong
        CHECK (
            (
                DoiTuong IN (N'Mua cây', N'Thuê cây')
                AND MaSP IS NOT NULL
                AND MaChinhSach IS NULL
            )
            OR
            (
                DoiTuong = N'Dịch vụ'
                AND MaSP IS NULL
                AND MaChinhSach IS NOT NULL
            )
        ),
    CONSTRAINT CK_ChiTietKhuyenMaiGiamGia
        CHECK (
            (
                PhanTramGiam IS NOT NULL
                AND GiaKhuyenMai IS NULL
                AND PhanTramGiam > 0
                AND PhanTramGiam <= 100
            )
            OR
            (
                PhanTramGiam IS NULL
                AND GiaKhuyenMai IS NOT NULL
                AND GiaKhuyenMai >= 0
            )
        ),
    CONSTRAINT CK_ChiTietKhuyenMaiSoLuong
        CHECK (
            SoLuongDaDung >= 0
            AND (
                SoLuongGioiHan IS NULL
                OR SoLuongGioiHan > 0
            )
            AND (
                SoLuongGioiHan IS NULL
                OR SoLuongDaDung <= SoLuongGioiHan
            )
        )
);

CREATE UNIQUE INDEX UQ_ChiTietKhuyenMaiSanPham
ON ChiTietKhuyenMai(MaKM, DoiTuong, MaSP)
WHERE MaSP IS NOT NULL;

CREATE UNIQUE INDEX UQ_ChiTietKhuyenMaiDichVu
ON ChiTietKhuyenMai(MaKM, MaChinhSach)
WHERE MaChinhSach IS NOT NULL;

CREATE TABLE GioHang (
    MaGioHang INT IDENTITY(1,1) PRIMARY KEY,
    MaKH INT NOT NULL UNIQUE,
    NgayTao DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    NgayCapNhat DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_GioHangKhachHang
        FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH)
);

CREATE TABLE ChiTietGioHang (
    MaCTGH INT IDENTITY(1,1) PRIMARY KEY,
    MaGioHang INT NOT NULL,
    MaSP INT NOT NULL,
    SoLuong INT NOT NULL DEFAULT 1,
    LoaiGiaoDich NVARCHAR(20) NOT NULL,
    NgayBatDauThue DATE,
    NgayKetThucThue DATE,
    CONSTRAINT FK_ChiTietGioHangGioHang
        FOREIGN KEY (MaGioHang) REFERENCES GioHang(MaGioHang),
    CONSTRAINT FK_ChiTietGioHangSanPham
        FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP),
    CONSTRAINT CK_ChiTietGioHangSoLuong
        CHECK (SoLuong > 0),
    CONSTRAINT CK_ChiTietGioHangLoai
        CHECK (LoaiGiaoDich IN (N'Mua', N'Thuê')),
    CONSTRAINT CK_ChiTietGioHangNgay
        CHECK (
            (
                LoaiGiaoDich = N'Mua'
                AND NgayBatDauThue IS NULL
                AND NgayKetThucThue IS NULL
            )
            OR
            (
                LoaiGiaoDich = N'Thuê'
                AND NgayBatDauThue IS NOT NULL
                AND NgayKetThucThue > NgayBatDauThue
            )
        )
);

CREATE UNIQUE INDEX UQ_GioHangMua
ON ChiTietGioHang(MaGioHang, MaSP)
WHERE LoaiGiaoDich = N'Mua';

CREATE UNIQUE INDEX UQ_GioHangThue
ON ChiTietGioHang(
    MaGioHang,
    MaSP,
    NgayBatDauThue,
    NgayKetThucThue
)
WHERE LoaiGiaoDich = N'Thuê';

CREATE TABLE DonHang (
    MaDH INT IDENTITY(1,1) PRIMARY KEY,
    MaKH INT NOT NULL,
    MaNV INT NULL,
    MaDiaChiGiao INT NOT NULL,
    MaKho INT NULL,
    TrangThai NVARCHAR(40) NOT NULL DEFAULT N'Chờ xác nhận',
    GiamGiaDon DECIMAL(18,2) NOT NULL DEFAULT 0,
    PhiVanChuyen DECIMAL(18,2) NOT NULL DEFAULT 0,
    PhuongThucThanhToan NVARCHAR(40),
    TrangThaiThanhToan NVARCHAR(40)
        NOT NULL DEFAULT N'Chưa thanh toán',
    NgayGiaoDuKien DATETIME2(0),
    NgayGiaoThucTe DATETIME2(0),
    GhiChu NVARCHAR(500),
    NgayDat DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    NgayCapNhat DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_DonHangKhachHang
        FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH),
    CONSTRAINT FK_DonHangNhanVien
        FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV),
    CONSTRAINT FK_DonHangDiaChi
        FOREIGN KEY (MaDiaChiGiao) REFERENCES DiaChi(MaDiaChi),
    CONSTRAINT FK_DonHangKho
        FOREIGN KEY (MaKho) REFERENCES Kho(MaKho),
    CONSTRAINT UQ_DonHangKhachHang UNIQUE (MaDH, MaKH),
    CONSTRAINT CK_DonHangTrangThai
        CHECK (
            TrangThai IN (
                N'Chờ xác nhận',
                N'Đã xác nhận',
                N'Đang chuẩn bị',
                N'Đang giao',
                N'Đã giao',
                N'Đã hủy'
            )
        ),
    CONSTRAINT CK_DonHangTien
        CHECK (
            GiamGiaDon >= 0
            AND PhiVanChuyen >= 0
        ),
    CONSTRAINT CK_DonHangThanhToan
        CHECK (
            TrangThaiThanhToan IN (
                N'Chưa thanh toán',
                N'Đã thanh toán',
                N'Thanh toán một phần',
                N'Đã hoàn tiền'
            )
        )
);

CREATE TABLE ChiTietDonHang (
    MaCTDH INT IDENTITY(1,1) PRIMARY KEY,
    MaDH INT NOT NULL,
    MaSP INT NOT NULL,
    MaCTKM INT NULL,
    CoGoiBaoHanh BIT NOT NULL DEFAULT 0,
    CoGoiChamSoc BIT NOT NULL DEFAULT 0,
    SoLuong INT NOT NULL,
    DonGiaGoc DECIMAL(18,2) NOT NULL,
    DonGia DECIMAL(18,2) NOT NULL,
    ThanhTien AS
        CONVERT(DECIMAL(18,2), SoLuong * DonGia) PERSISTED,
    CONSTRAINT FK_ChiTietDonHangDonHang
        FOREIGN KEY (MaDH) REFERENCES DonHang(MaDH),
    CONSTRAINT FK_ChiTietDonHangSanPham
        FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP),
    CONSTRAINT FK_ChiTietDonHangKhuyenMai
        FOREIGN KEY (MaCTKM) REFERENCES ChiTietKhuyenMai(MaCTKM),
    CONSTRAINT CK_ChiTietDonHangSoLuong
        CHECK (SoLuong > 0),
    CONSTRAINT CK_ChiTietDonHangGia
        CHECK (
            DonGiaGoc >= 0
            AND DonGia >= 0
            AND DonGia <= DonGiaGoc
        ),
    CONSTRAINT UQ_ChiTietDonHangSanPham
        UNIQUE (MaCTDH, MaSP)
);

CREATE TABLE DonThue (
    MaDT INT IDENTITY(1,1) PRIMARY KEY,
    MaKH INT NOT NULL,
    MaNV INT NULL,
    MaDiaChiGiao INT NOT NULL,
    MaKho INT NULL,
    NgayBatDau DATE NOT NULL,
    NgayKetThuc DATE NOT NULL,
    NgayGiaoThucTe DATETIME2(0),
    NgayTraThucTe DATETIME2(0),
    GoiThue NVARCHAR(30) NOT NULL DEFAULT N'Cơ bản',
    XacNhanGoiCaoCap BIT NOT NULL DEFAULT 0,
    PhiGoiGoc DECIMAL(18,2) NOT NULL DEFAULT 0,
    GiamGiaGoi DECIMAL(18,2) NOT NULL DEFAULT 0,
    TienCocDuKien DECIMAL(18,2) NOT NULL DEFAULT 0,
    TienCocDaThu DECIMAL(18,2) NOT NULL DEFAULT 0,
    PhiVanChuyen DECIMAL(18,2) NOT NULL DEFAULT 0,
    PhiKhac DECIMAL(18,2) NOT NULL DEFAULT 0,
    KhachXacNhanPhiKhac BIT NOT NULL DEFAULT 0,
    TrangThai NVARCHAR(40) NOT NULL DEFAULT N'Chờ xác nhận',
    TrangThaiCoc NVARCHAR(40) NOT NULL DEFAULT N'Chưa thu',
    TrangThaiQuyetToan NVARCHAR(40)
        NOT NULL DEFAULT N'Chưa quyết toán',
    NgayQuyetToan DATETIME2(0),
    SoTienPhaiThuThem DECIMAL(18,2) NOT NULL DEFAULT 0,
    SoTienHoanKhach DECIMAL(18,2) NOT NULL DEFAULT 0,
    MaHopDong VARCHAR(60) NOT NULL UNIQUE,
    NgayXacNhanHopDong DATETIME2(0),
    GhiChu NVARCHAR(500),
    NgayTao DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_DonThueKhachHang
        FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH),
    CONSTRAINT FK_DonThueNhanVien
        FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV),
    CONSTRAINT FK_DonThueDiaChi
        FOREIGN KEY (MaDiaChiGiao) REFERENCES DiaChi(MaDiaChi),
    CONSTRAINT FK_DonThueKho
        FOREIGN KEY (MaKho) REFERENCES Kho(MaKho),
    CONSTRAINT UQ_DonThueKhachHang UNIQUE (MaDT, MaKH),
    CONSTRAINT CK_DonThueNgay
        CHECK (NgayKetThuc > NgayBatDau),
    CONSTRAINT CK_DonThueGoi
        CHECK (
            (
                GoiThue = N'Cơ bản'
                AND PhiGoiGoc = 0
                AND GiamGiaGoi = 0
                AND XacNhanGoiCaoCap = 0
            )
            OR
            (
                GoiThue = N'Cao cấp'
                AND DATEDIFF(DAY, NgayBatDau, NgayKetThuc) >= 15
                AND XacNhanGoiCaoCap = 1
                AND PhiGoiGoc > 0
                AND GiamGiaGoi <= PhiGoiGoc
            )
        ),
    CONSTRAINT CK_DonThueTien
        CHECK (
            PhiGoiGoc >= 0
            AND GiamGiaGoi >= 0
            AND TienCocDuKien >= 0
            AND TienCocDaThu >= 0
            AND PhiVanChuyen >= 0
            AND PhiKhac >= 0
        ),
    CONSTRAINT CK_DonThuePhiKhac
        CHECK (KhachXacNhanPhiKhac = 1 OR PhiKhac = 0),
    CONSTRAINT CK_DonThueQuyetToan
        CHECK (
            SoTienPhaiThuThem >= 0
            AND SoTienHoanKhach >= 0
            AND (
                SoTienPhaiThuThem = 0
                OR SoTienHoanKhach = 0
            )
        ),
    CONSTRAINT CK_DonThueTrangThai
        CHECK (
            TrangThai IN (
                N'Chờ xác nhận',
                N'Đã xác nhận',
                N'Đang thuê',
                N'Chờ trả cây',
                N'Đang tranh chấp',
                N'Đã trả',
                N'Đã hủy'
            )
        ),
    CONSTRAINT CK_DonThueTrangThaiCoc
        CHECK (
            TrangThaiCoc IN (
                N'Chưa thu',
                N'Đã thu',
                N'Đã khấu trừ',
                N'Đã hoàn'
            )
        ),
    CONSTRAINT CK_DonThueTrangThaiQuyetToan
        CHECK (
            TrangThaiQuyetToan IN (
                N'Chưa quyết toán',
                N'Chờ thanh toán',
                N'Đang tranh chấp',
                N'Đã quyết toán'
            )
        ),
    CONSTRAINT CK_DonThueNgayTra
        CHECK (
            NgayTraThucTe IS NULL
            OR (
                NgayGiaoThucTe IS NOT NULL
                AND NgayTraThucTe >= NgayGiaoThucTe
            )
        )
);

CREATE TABLE ChiTietDonThue (
    MaCTDT INT IDENTITY(1,1) PRIMARY KEY,
    MaDT INT NOT NULL,
    MaSP INT NOT NULL,
    MaCTKM INT NULL,
    MaCayThucTe VARCHAR(80),
    SoLuong INT NOT NULL DEFAULT 1,
    GiaTriCayKhiGiao DECIMAL(18,2) NOT NULL,
    GiaThueGocTheoNgay DECIMAL(18,2) NOT NULL,
    GiaThueTheoNgay DECIMAL(18,2) NOT NULL,
    TienCoc DECIMAL(18,2) NOT NULL,
    TinhTrangKhiGiao NVARCHAR(500),
    AnhKhiGiao VARCHAR(1000),
    TinhTrangKhiTra NVARCHAR(500),
    AnhKhiTra VARCHAR(1000),
    NguyenNhanHuHong NVARCHAR(500),
    TrachNhiem NVARCHAR(40)
        NOT NULL DEFAULT N'Chưa kiểm tra',
    TienBoiThuongDuKien DECIMAL(18,2) NOT NULL DEFAULT 0,
    TienBoiThuongChot DECIMAL(18,2) NOT NULL DEFAULT 0,
    KhachDongYBoiThuong BIT NOT NULL DEFAULT 0,
    NgayKiemTra DATETIME2(0),
    MaNVKiemTra INT NULL,
    CONSTRAINT FK_ChiTietDonThueDonThue
        FOREIGN KEY (MaDT) REFERENCES DonThue(MaDT),
    CONSTRAINT FK_ChiTietDonThueSanPham
        FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP),
    CONSTRAINT FK_ChiTietDonThueKhuyenMai
        FOREIGN KEY (MaCTKM) REFERENCES ChiTietKhuyenMai(MaCTKM),
    CONSTRAINT FK_ChiTietDonThueNhanVien
        FOREIGN KEY (MaNVKiemTra) REFERENCES NhanVien(MaNV),
    CONSTRAINT CK_ChiTietDonThueSoLuong
        CHECK (SoLuong = 1),
    CONSTRAINT CK_ChiTietDonThueGia
        CHECK (
            GiaTriCayKhiGiao > 0
            AND GiaThueGocTheoNgay >= 0
            AND GiaThueTheoNgay >= 0
            AND GiaThueTheoNgay <= GiaThueGocTheoNgay
            AND TienCoc >= 0
        ),
    CONSTRAINT CK_ChiTietDonThueTrachNhiem
        CHECK (
            TrachNhiem IN (
                N'Chưa kiểm tra',
                N'Không có lỗi',
                N'Lỗi cửa hàng',
                N'Lỗi khách hàng',
                N'Tranh chấp'
            )
        ),
    CONSTRAINT CK_ChiTietDonThueBoiThuong
        CHECK (
            TienBoiThuongDuKien >= 0
            AND TienBoiThuongChot >= 0
            AND (
                TienBoiThuongChot = 0
                OR (
                    TrachNhiem = N'Lỗi khách hàng'
                    AND KhachDongYBoiThuong = 1
                )
            )
        ),
    CONSTRAINT UQ_ChiTietDonThueSanPham
        UNIQUE (MaCTDT, MaSP)
);

CREATE UNIQUE INDEX UQ_CayTheoDonThue
ON ChiTietDonThue(MaDT, MaCayThucTe)
WHERE MaCayThucTe IS NOT NULL;

CREATE TABLE ThanhToan (
    MaTT INT IDENTITY(1,1) PRIMARY KEY,
    MaDH INT NULL,
    MaDT INT NULL,
    LoaiThanhToan NVARCHAR(40) NOT NULL,
    SoTien DECIMAL(18,2) NOT NULL,
    PhuongThuc NVARCHAR(40) NOT NULL,
    MaGiaoDich VARCHAR(150),
    TrangThai NVARCHAR(40)
        NOT NULL DEFAULT N'Chờ thanh toán',
    ThoiGian DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    GhiChu NVARCHAR(500),
    CONSTRAINT FK_ThanhToanDonHang
        FOREIGN KEY (MaDH) REFERENCES DonHang(MaDH),
    CONSTRAINT FK_ThanhToanDonThue
        FOREIGN KEY (MaDT) REFERENCES DonThue(MaDT),
    CONSTRAINT CK_ThanhToanSoTien
        CHECK (SoTien > 0),
    CONSTRAINT CK_ThanhToanPhuongThuc
        CHECK (
            PhuongThuc IN (
                N'Thanh toán khi nhận hàng',
                N'Chuyển khoản',
                N'VNPay',
                N'MoMo',
                N'Tiền mặt'
            )
        ),
    CONSTRAINT CK_ThanhToanTrangThai
        CHECK (
            TrangThai IN (
                N'Chờ thanh toán',
                N'Đã thanh toán',
                N'Thất bại'
            )
        ),
    CONSTRAINT CK_ThanhToanDoiTuong
        CHECK (
            (
                MaDH IS NOT NULL
                AND MaDT IS NULL
                AND LoaiThanhToan IN (
                    N'Mua hàng',
                    N'Hoàn tiền'
                )
            )
            OR
            (
                MaDT IS NOT NULL
                AND MaDH IS NULL
                AND LoaiThanhToan IN (
                    N'Đặt cọc',
                    N'Tiền thuê',
                    N'Dịch vụ',
                    N'Bồi thường',
                    N'Hoàn cọc',
                    N'Hoàn tiền'
                )
            )
        )
);

CREATE UNIQUE INDEX UQ_ThanhToanGiaoDich
ON ThanhToan(PhuongThuc, MaGiaoDich)
WHERE MaGiaoDich IS NOT NULL;

CREATE TABLE DanhGia (
    MaDG INT IDENTITY(1,1) PRIMARY KEY,
    MaKH INT NOT NULL,
    MaSP INT NOT NULL,
    SoSao INT NOT NULL,
    NoiDung NVARCHAR(500),
    NgayDanhGia DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    TrangThai BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_DanhGiaKhachHang
        FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH),
    CONSTRAINT FK_DanhGiaSanPham
        FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP),
    CONSTRAINT CK_DanhGiaSoSao
        CHECK (SoSao BETWEEN 1 AND 5),
    CONSTRAINT UQ_DanhGia UNIQUE (MaKH, MaSP)
);

CREATE TABLE KenhHoTro (
    MaKenh INT IDENTITY(1,1) PRIMARY KEY,
    TenKenh NVARCHAR(100) NOT NULL UNIQUE,
    TrangThai BIT NOT NULL DEFAULT 1
);

CREATE TABLE YeuCauHauMai (
    MaYC INT IDENTITY(1,1) PRIMARY KEY,
    MaKH INT NOT NULL,
    MaDH INT NULL,
    MaDT INT NULL,
    MaCTDH INT NULL,
    MaCTDT INT NULL,
    MaChinhSach INT NULL,
    MaNVTiepNhan INT NULL,
    MaNVXuLy INT NULL,
    MaKenhTiepNhan INT NOT NULL,
    NhomYeuCau NVARCHAR(30) NOT NULL,
    LoaiYeuCau NVARCHAR(100) NOT NULL,
    TieuDe NVARCHAR(200) NOT NULL,
    MoTa NVARCHAR(MAX),
    MucDo NVARCHAR(30) NOT NULL DEFAULT N'Trung bình',
    TrangThai NVARCHAR(40) NOT NULL DEFAULT N'Mới tạo',
    NgayTao DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    HanPhanHoi DATETIME2(0),
    HanXuLy DATETIME2(0),
    NgayPhanHoiDau DATETIME2(0),
    NgayDong DATETIME2(0),
    KetQua NVARCHAR(MAX),
    CONSTRAINT FK_YeuCauKhachHang
        FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH),
    CONSTRAINT FK_YeuCauChinhSach
        FOREIGN KEY (MaChinhSach)
        REFERENCES ChinhSachDichVu(MaChinhSach),
    CONSTRAINT FK_YeuCauNhanVienTiepNhan
        FOREIGN KEY (MaNVTiepNhan) REFERENCES NhanVien(MaNV),
    CONSTRAINT FK_YeuCauNhanVienXuLy
        FOREIGN KEY (MaNVXuLy) REFERENCES NhanVien(MaNV),
    CONSTRAINT FK_YeuCauKenhHoTro
        FOREIGN KEY (MaKenhTiepNhan) REFERENCES KenhHoTro(MaKenh),
    CONSTRAINT FK_YeuCauChiTietDonHang
        FOREIGN KEY (MaCTDH) REFERENCES ChiTietDonHang(MaCTDH),
    CONSTRAINT FK_YeuCauChiTietDonThue
        FOREIGN KEY (MaCTDT) REFERENCES ChiTietDonThue(MaCTDT),
    CONSTRAINT FK_YeuCauDonHangKhachHang
        FOREIGN KEY (MaDH, MaKH)
        REFERENCES DonHang(MaDH, MaKH),
    CONSTRAINT FK_YeuCauDonThueKhachHang
        FOREIGN KEY (MaDT, MaKH)
        REFERENCES DonThue(MaDT, MaKH),
    CONSTRAINT CK_YeuCauLienKet
        CHECK (
            (
                MaDH IS NOT NULL
                AND MaCTDH IS NOT NULL
                AND MaDT IS NULL
                AND MaCTDT IS NULL
            )
            OR
            (
                MaDT IS NOT NULL
                AND MaCTDT IS NOT NULL
                AND MaDH IS NULL
                AND MaCTDH IS NULL
            )
        ),
    CONSTRAINT CK_YeuCauNhom
        CHECK (
            NhomYeuCau IN (
                N'Hậu mãi',
                N'Bảo hành',
                N'Đổi trả',
                N'Khiếu nại'
            )
        ),
    CONSTRAINT CK_YeuCauMucDo
        CHECK (
            MucDo IN (
                N'Thấp',
                N'Trung bình',
                N'Cao',
                N'Khẩn cấp'
            )
        ),
    CONSTRAINT CK_YeuCauTrangThai
        CHECK (
            TrangThai IN (
                N'Mới tạo',
                N'Đã tiếp nhận',
                N'Đang xác minh',
                N'Đang xử lý',
                N'Chờ khách hàng',
                N'Đã xử lý',
                N'Đã đóng',
                N'Từ chối',
                N'Đã hủy'
            )
        ),
    CONSTRAINT CK_YeuCauSLA
        CHECK (
            (HanPhanHoi IS NULL OR HanPhanHoi >= NgayTao)
            AND
            (HanXuLy IS NULL OR HanXuLy >= NgayTao)
        )
);

CREATE TABLE BaoHanh (
    MaBH INT IDENTITY(1,1) PRIMARY KEY,
    MaYC INT NOT NULL UNIQUE,
    NgayBatDau DATETIME2(0) NOT NULL,
    NgayHetHan DATETIME2(0) NOT NULL,
    NguyenNhan NVARCHAR(500),
    KetQuaKiemTra NVARCHAR(MAX),
    HuongXuLy NVARCHAR(40),
    TrangThai NVARCHAR(40) NOT NULL DEFAULT N'Chờ xác minh',
    MaNVXacMinh INT NULL,
    NgayXacMinh DATETIME2(0),
    CONSTRAINT FK_BaoHanhYeuCau
        FOREIGN KEY (MaYC) REFERENCES YeuCauHauMai(MaYC),
    CONSTRAINT FK_BaoHanhNhanVien
        FOREIGN KEY (MaNVXacMinh) REFERENCES NhanVien(MaNV),
    CONSTRAINT CK_BaoHanhHuongXuLy
        CHECK (
            HuongXuLy IS NULL
            OR HuongXuLy IN (
                N'Sửa chữa',
                N'Chăm sóc',
                N'Thay cây',
                N'Hoàn tiền',
                N'Từ chối'
            )
        ),
    CONSTRAINT CK_BaoHanhTrangThai
        CHECK (
            TrangThai IN (
                N'Chờ xác minh',
                N'Đủ điều kiện',
                N'Từ chối',
                N'Đang xử lý',
                N'Hoàn tất'
            )
        ),
    CONSTRAINT CK_BaoHanhNgay
        CHECK (
            NgayHetHan > NgayBatDau
            AND NgayHetHan <= DATEADD(DAY, 30, NgayBatDau)
        )
);

CREATE TABLE LichSuTrangThai (
    MaLSTS BIGINT IDENTITY(1,1) PRIMARY KEY,
    MaYC INT NOT NULL,
    TrangThaiCu NVARCHAR(40),
    TrangThaiMoi NVARCHAR(40) NOT NULL,
    MaNguoiThayDoi INT NOT NULL,
    LyDo NVARCHAR(MAX),
    ThoiGian DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_LichSuTrangThaiYeuCau
        FOREIGN KEY (MaYC) REFERENCES YeuCauHauMai(MaYC),
    CONSTRAINT FK_LichSuTrangThaiNguoiDung
        FOREIGN KEY (MaNguoiThayDoi) REFERENCES NguoiDung(MaNguoiDung)
);

CREATE TABLE LichSuTuongTac (
    MaTuongTac BIGINT IDENTITY(1,1) PRIMARY KEY,
    MaYC INT NOT NULL,
    MaNguoiDung INT NULL,
    MaKenh INT NOT NULL,
    MaTinNhanNgoai VARCHAR(150),
    NguoiGuiNgoai NVARCHAR(150),
    LoaiTuongTac NVARCHAR(40) NOT NULL DEFAULT N'Tin nhắn',
    NoiDung NVARCHAR(MAX),
    TepDinhKem VARCHAR(1000),
    ThoiGian DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_LichSuTuongTacYeuCau
        FOREIGN KEY (MaYC) REFERENCES YeuCauHauMai(MaYC),
    CONSTRAINT FK_LichSuTuongTacNguoiDung
        FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung),
    CONSTRAINT FK_LichSuTuongTacKenh
        FOREIGN KEY (MaKenh) REFERENCES KenhHoTro(MaKenh),
    CONSTRAINT CK_LichSuTuongTacLoai
        CHECK (
            LoaiTuongTac IN (
                N'Tin nhắn',
                N'Cuộc gọi',
                N'Email',
                N'Tệp',
                N'Hình ảnh',
                N'Ghi chú'
            )
        ),
    CONSTRAINT CK_LichSuTuongTacNguoiGui
        CHECK (
            MaNguoiDung IS NOT NULL
            OR NguoiGuiNgoai IS NOT NULL
        )
);

CREATE UNIQUE INDEX UQ_LichSuTuongTacNgoai
ON LichSuTuongTac(MaKenh, MaTinNhanNgoai)
WHERE MaTinNhanNgoai IS NOT NULL;

CREATE TABLE LichHenChamSoc (
    MaLich INT IDENTITY(1,1) PRIMARY KEY,
    MaYC INT NOT NULL,
    MaNV INT NULL,
    LoaiCongViec NVARCHAR(50) NOT NULL,
    NgayHen DATETIME2(0) NOT NULL,
    NgayHoanTat DATETIME2(0),
    DiaDiem NVARCHAR(500),
    PhiDuKien DECIMAL(18,2) NOT NULL DEFAULT 0,
    PhiThucTe DECIMAL(18,2) NOT NULL DEFAULT 0,
    KhachDongYPhi BIT NOT NULL DEFAULT 0,
    TrangThai NVARCHAR(40) NOT NULL DEFAULT N'Chờ xác nhận',
    KetQua NVARCHAR(MAX),
    CONSTRAINT FK_LichHenYeuCau
        FOREIGN KEY (MaYC) REFERENCES YeuCauHauMai(MaYC),
    CONSTRAINT FK_LichHenNhanVien
        FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV),
    CONSTRAINT CK_LichHenCongViec
        CHECK (
            LoaiCongViec IN (
                N'Bón phân',
                N'Tưới nước',
                N'Cắt tỉa',
                N'Trồng cây',
                N'Thay đất',
                N'Chăm sóc',
                N'Kiểm tra'
            )
        ),
    CONSTRAINT CK_LichHenPhi
        CHECK (
            PhiDuKien >= 0
            AND PhiThucTe >= 0
            AND (
                PhiThucTe = 0
                OR KhachDongYPhi = 1
            )
        ),
    CONSTRAINT CK_LichHenTrangThai
        CHECK (
            TrangThai IN (
                N'Chờ xác nhận',
                N'Đã xác nhận',
                N'Đang thực hiện',
                N'Hoàn tất',
                N'Đã hủy'
            )
        ),
    CONSTRAINT CK_LichHenNgay
        CHECK (
            NgayHoanTat IS NULL
            OR NgayHoanTat >= NgayHen
        )
);
GO

CREATE INDEX IX_DonHangKhachHang
ON DonHang(MaKH);

CREATE INDEX IX_DonThueKhachHang
ON DonThue(MaKH);

CREATE INDEX IX_ChiTietDonHang
ON ChiTietDonHang(MaDH);

CREATE INDEX IX_ChiTietDonThue
ON ChiTietDonThue(MaDT);

CREATE INDEX IX_ChiTietDonThueSanPham
ON ChiTietDonThue(MaSP);

CREATE INDEX IX_YeuCauKhachHang
ON YeuCauHauMai(MaKH);

CREATE INDEX IX_YeuCauDonThue
ON YeuCauHauMai(MaDT);

CREATE INDEX IX_YeuCauDonHang
ON YeuCauHauMai(MaDH);

CREATE INDEX IX_YeuCauNhanVien
ON YeuCauHauMai(MaNVXuLy, TrangThai);

CREATE INDEX IX_LichSuTuongTac
ON LichSuTuongTac(MaYC, ThoiGian);

CREATE INDEX IX_LichHenChamSoc
ON LichHenChamSoc(MaYC);

CREATE INDEX IX_ThanhToanDonThue
ON ThanhToan(MaDT, TrangThai);
GO

CREATE VIEW vwTonKho
AS
SELECT
    TK.MaTonKho,
    K.MaKho,
    K.TenKho,
    SP.MaSP,
    SP.TenSP,
    TK.SoLuongTon,
    TK.SoLuongDangThue,
    TK.SoLuongKhaDung
FROM TonKho TK
JOIN Kho K ON K.MaKho = TK.MaKho
JOIN SanPham SP ON SP.MaSP = TK.MaSP;
GO

CREATE VIEW vwTongTienDonHang
AS
SELECT
    DH.MaDH,
    COALESCE(SUM(CT.ThanhTien), 0) AS TienHang,
    DH.GiamGiaDon,
    DH.PhiVanChuyen,
    CONVERT(
        DECIMAL(18,2),
        CASE
            WHEN COALESCE(SUM(CT.ThanhTien), 0)
                 + DH.PhiVanChuyen - DH.GiamGiaDon < 0
            THEN 0
            ELSE COALESCE(SUM(CT.ThanhTien), 0)
                 + DH.PhiVanChuyen - DH.GiamGiaDon
        END
    ) AS TongPhaiTra
FROM DonHang DH
LEFT JOIN ChiTietDonHang CT ON CT.MaDH = DH.MaDH
GROUP BY
    DH.MaDH,
    DH.GiamGiaDon,
    DH.PhiVanChuyen;
GO

CREATE VIEW vwQuyenLoiYeuCau
AS
WITH DuLieu AS (
    SELECT
        YC.MaYC,
        YC.MaKH,
        YC.NhomYeuCau,
        YC.LoaiYeuCau,
        YC.NgayTao,
        CS.TenDichVu,
        CS.SoNgayToiDa,
        CS.SoGioToiDa,
        CS.NhomDichVu,
        CS.HinhThuc,
        CS.GoiApDung,
        CS.YeuCauCayGiaTriCao,
        CS.YeuCauGoiCoPhi,
        CS.TrangThai AS TrangThaiChinhSach,
        SP.DuDieuKienBaoHanh,
        CTDH.CoGoiBaoHanh,
        CTDH.CoGoiChamSoc,
        DT.GoiThue,
        DT.XacNhanGoiCaoCap,
        DT.NgayKetThuc,
        CASE
            WHEN YC.MaDH IS NOT NULL
            THEN DH.NgayGiaoThucTe
            ELSE DT.NgayGiaoThucTe
        END AS MocBatDau,
        YC.MaDH,
        YC.MaDT
    FROM YeuCauHauMai YC
    LEFT JOIN ChinhSachDichVu CS
        ON CS.MaChinhSach = YC.MaChinhSach
    LEFT JOIN DonHang DH
        ON DH.MaDH = YC.MaDH
    LEFT JOIN DonThue DT
        ON DT.MaDT = YC.MaDT
    LEFT JOIN ChiTietDonHang CTDH
        ON CTDH.MaCTDH = YC.MaCTDH
    LEFT JOIN ChiTietDonThue CTDT
        ON CTDT.MaCTDT = YC.MaCTDT
    LEFT JOIN SanPham SP
        ON SP.MaSP = COALESCE(CTDH.MaSP, CTDT.MaSP)
),
ThoiHan AS (
    SELECT
        *,
        CASE
            WHEN MocBatDau IS NULL THEN NULL
            WHEN SoGioToiDa IS NOT NULL
            THEN DATEADD(HOUR, SoGioToiDa, MocBatDau)
            ELSE DATEADD(DAY, SoNgayToiDa, MocBatDau)
        END AS HanChinhSach
    FROM DuLieu
)
SELECT
    MaYC,
    MaKH,
    NhomYeuCau,
    LoaiYeuCau,
    TenDichVu,
    SoNgayToiDa,
    SoGioToiDa,
    MocBatDau,
    CASE
        WHEN MaDT IS NOT NULL
             AND HanChinhSach > CAST(NgayKetThuc AS DATETIME2(0))
        THEN CAST(NgayKetThuc AS DATETIME2(0))
        ELSE HanChinhSach
    END AS MocHetHan,
    CONVERT(
        BIT,
        CASE
            WHEN TenDichVu IS NULL THEN 0
            WHEN TrangThaiChinhSach = 0 THEN 0
            WHEN MocBatDau IS NULL THEN 0
            WHEN MaDH IS NOT NULL AND HinhThuc <> N'Mua' THEN 0
            WHEN MaDT IS NOT NULL AND HinhThuc <> N'Thuê' THEN 0
            WHEN NhomYeuCau <> NhomDichVu THEN 0
            WHEN YeuCauCayGiaTriCao = 1
                 AND DuDieuKienBaoHanh = 0 THEN 0
            WHEN MaDH IS NOT NULL
                 AND YeuCauGoiCoPhi = 1
                 AND NhomDichVu = N'Bảo hành'
                 AND CoGoiBaoHanh = 0 THEN 0
            WHEN MaDH IS NOT NULL
                 AND YeuCauGoiCoPhi = 1
                 AND NhomDichVu = N'Hậu mãi'
                 AND CoGoiChamSoc = 0 THEN 0
            WHEN MaDT IS NOT NULL
                 AND GoiApDung = N'Cao cấp'
                 AND GoiThue <> N'Cao cấp' THEN 0
            WHEN MaDT IS NOT NULL
                 AND GoiApDung = N'Cơ bản'
                 AND GoiThue <> N'Cơ bản' THEN 0
            WHEN MaDT IS NOT NULL
                 AND YeuCauGoiCoPhi = 1
                 AND XacNhanGoiCaoCap = 0 THEN 0
            WHEN NgayTao >= HanChinhSach THEN 0
            WHEN MaDT IS NOT NULL
                 AND NgayTao >= CAST(NgayKetThuc AS DATETIME2(0))
            THEN 0
            ELSE 1
        END
    ) AS ConQuyenLoi
FROM ThoiHan;
GO

CREATE VIEW vwQuyetToanThue
AS
WITH GiaThue AS (
    SELECT
        DT.MaDT,
        SUM(
            CONVERT(DECIMAL(18,2),
                DATEDIFF(DAY, DT.NgayBatDau, DT.NgayKetThuc)
            ) * CT.GiaThueTheoNgay
        ) AS TienThueDuKien,
        SUM(
            CONVERT(
                DECIMAL(18,2),
                CASE
                    WHEN DT.NgayTraThucTe IS NULL
                    THEN DATEDIFF(
                        DAY, DT.NgayBatDau, DT.NgayKetThuc
                    )
                    WHEN DT.NgayGiaoThucTe IS NULL
                    THEN DATEDIFF(
                        DAY, DT.NgayBatDau, DT.NgayKetThuc
                    )
                    WHEN DATEDIFF(
                        DAY,
                        CAST(DT.NgayGiaoThucTe AS DATE),
                        CAST(DT.NgayTraThucTe AS DATE)
                    ) < DATEDIFF(
                        DAY, DT.NgayBatDau, DT.NgayKetThuc
                    )
                    THEN DATEDIFF(
                        DAY, DT.NgayBatDau, DT.NgayKetThuc
                    )
                    ELSE DATEDIFF(
                        DAY,
                        CAST(DT.NgayGiaoThucTe AS DATE),
                        CAST(DT.NgayTraThucTe AS DATE)
                    )
                END
            ) * CT.GiaThueTheoNgay
        ) AS TienThueThucTe,
        SUM(CT.TienCoc) AS TienCocDuKien,
        SUM(CT.TienBoiThuongChot) AS TienBoiThuong
    FROM DonThue DT
    JOIN ChiTietDonThue CT ON CT.MaDT = DT.MaDT
    GROUP BY DT.MaDT
),
DichVu AS (
    SELECT
        YC.MaDT,
        SUM(
            CASE
                WHEN L.TrangThai = N'Hoàn tất'
                THEN L.PhiThucTe
                ELSE 0
            END
        ) AS PhiChamSoc
    FROM LichHenChamSoc L
    JOIN YeuCauHauMai YC ON YC.MaYC = L.MaYC
    WHERE YC.MaDT IS NOT NULL
    GROUP BY YC.MaDT
),
GiaoDich AS (
    SELECT
        MaDT,
        SUM(
            CASE
                WHEN LoaiThanhToan = N'Đặt cọc'
                     AND TrangThai = N'Đã thanh toán'
                THEN SoTien
                ELSE 0
            END
        ) AS CocDaThu,
        SUM(
            CASE
                WHEN LoaiThanhToan IN (
                    N'Tiền thuê',
                    N'Dịch vụ',
                    N'Bồi thường'
                )
                AND TrangThai = N'Đã thanh toán'
                THEN SoTien
                ELSE 0
            END
        ) AS DaThanhToan,
        SUM(
            CASE
                WHEN LoaiThanhToan IN (N'Hoàn cọc', N'Hoàn tiền')
                     AND TrangThai = N'Đã thanh toán'
                THEN SoTien
                ELSE 0
            END
        ) AS DaHoan
    FROM ThanhToan
    WHERE MaDT IS NOT NULL
    GROUP BY MaDT
)
SELECT
    DT.MaDT,
    DT.MaKH,
    DT.TrangThai,
    DT.GoiThue,
    G.TienThueDuKien,
    G.TienThueThucTe,
    DT.PhiGoiGoc - DT.GiamGiaGoi AS PhiGoi,
    COALESCE(DV.PhiChamSoc, 0) AS PhiChamSoc,
    DT.PhiVanChuyen,
    DT.PhiKhac,
    G.TienBoiThuong,
    G.TienCocDuKien,
    COALESCE(TT.CocDaThu, 0) AS CocDaThu,
    COALESCE(TT.DaThanhToan, 0) AS DaThanhToan,
    COALESCE(TT.DaHoan, 0) AS DaHoan,
    CONVERT(
        DECIMAL(18,2),
        G.TienThueThucTe
        + DT.PhiGoiGoc
        - DT.GiamGiaGoi
        + COALESCE(DV.PhiChamSoc, 0)
        + DT.PhiVanChuyen
        + DT.PhiKhac
        + G.TienBoiThuong
    ) AS TongChiPhi,
    CONVERT(
        DECIMAL(18,2),
        G.TienThueThucTe
        + DT.PhiGoiGoc
        - DT.GiamGiaGoi
        + COALESCE(DV.PhiChamSoc, 0)
        + DT.PhiVanChuyen
        + DT.PhiKhac
        + G.TienBoiThuong
        - COALESCE(TT.CocDaThu, 0)
        - COALESCE(TT.DaThanhToan, 0)
        + COALESCE(TT.DaHoan, 0)
    ) AS SoDuQuyetToan
FROM DonThue DT
JOIN GiaThue G ON G.MaDT = DT.MaDT
LEFT JOIN DichVu DV ON DV.MaDT = DT.MaDT
LEFT JOIN GiaoDich TT ON TT.MaDT = DT.MaDT;
GO

CREATE VIEW vwSLAYeuCau
AS
SELECT
    MaYC,
    TrangThai,
    HanPhanHoi,
    HanXuLy,
    CONVERT(
        BIT,
        CASE
            WHEN HanPhanHoi IS NULL THEN 0
            WHEN NgayPhanHoiDau IS NOT NULL
                 AND NgayPhanHoiDau > HanPhanHoi THEN 1
            WHEN NgayPhanHoiDau IS NULL
                 AND SYSDATETIME() > HanPhanHoi THEN 1
            ELSE 0
        END
    ) AS QuaHanPhanHoi,
    CONVERT(
        BIT,
        CASE
            WHEN HanXuLy IS NULL THEN 0
            WHEN NgayDong IS NOT NULL
                 AND NgayDong > HanXuLy THEN 1
            WHEN NgayDong IS NULL
                 AND TrangThai NOT IN (
                     N'Đã đóng',
                     N'Từ chối',
                     N'Đã hủy'
                 )
                 AND SYSDATETIME() > HanXuLy THEN 1
            ELSE 0
        END
    ) AS QuaHanXuLy
FROM YeuCauHauMai;
GO

CREATE TRIGGER trgChiTietDonThue
ON ChiTietDonThue
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted I
        JOIN SanPham SP ON SP.MaSP = I.MaSP
        WHERE SP.LoaiSanPham = N'Bán'
    )
    BEGIN
        THROW 50001,
            N'Sản phẩm chỉ bán không thể cho thuê.',
            1;
    END;

    IF EXISTS (
        SELECT 1
        FROM inserted I
        JOIN DonThue DT ON DT.MaDT = I.MaDT
        WHERE I.MaCayThucTe IS NULL
          AND DT.TrangThai IN (
              N'Đang thuê',
              N'Chờ trả cây',
              N'Đã trả'
          )
    )
    BEGIN
        THROW 50002,
            N'Cây đã bàn giao phải có mã nhận diện.',
            1;
    END;
END;
GO

CREATE TRIGGER trgYeuCauHauMai
ON YeuCauHauMai
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted I
        LEFT JOIN ChiTietDonHang CT
            ON CT.MaCTDH = I.MaCTDH
        WHERE I.MaDH IS NOT NULL
          AND (
              CT.MaCTDH IS NULL
              OR CT.MaDH <> I.MaDH
          )
    )
    BEGIN
        THROW 50003,
            N'Cây không thuộc đơn mua đã chọn.',
            1;
    END;

    IF EXISTS (
        SELECT 1
        FROM inserted I
        LEFT JOIN ChiTietDonThue CT
            ON CT.MaCTDT = I.MaCTDT
        WHERE I.MaDT IS NOT NULL
          AND (
              CT.MaCTDT IS NULL
              OR CT.MaDT <> I.MaDT
          )
    )
    BEGIN
        THROW 50004,
            N'Cây không thuộc đơn thuê đã chọn.',
            1;
    END;

    IF EXISTS (
        SELECT 1
        FROM inserted I
        JOIN ChinhSachDichVu CS
            ON CS.MaChinhSach = I.MaChinhSach
        WHERE
            (
                I.MaDH IS NOT NULL
                AND CS.HinhThuc <> N'Mua'
            )
            OR
            (
                I.MaDT IS NOT NULL
                AND CS.HinhThuc <> N'Thuê'
            )
            OR
            (
                I.NhomYeuCau <> CS.NhomDichVu
                AND I.NhomYeuCau <> N'Khiếu nại'
            )
    )
    BEGIN
        THROW 50005,
            N'Chính sách không phù hợp với yêu cầu.',
            1;
    END;
END;
GO

CREATE TRIGGER trgBaoHanh
ON BaoHanh
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted I
        JOIN YeuCauHauMai YC ON YC.MaYC = I.MaYC
        WHERE YC.NhomYeuCau <> N'Bảo hành'
    )
    BEGIN
        THROW 50006,
            N'Phiếu bảo hành phải thuộc yêu cầu bảo hành.',
            1;
    END;
END;
GO

CREATE TRIGGER trgLichHenChamSoc
ON LichHenChamSoc
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted I
        JOIN YeuCauHauMai YC ON YC.MaYC = I.MaYC
        WHERE YC.NhomYeuCau <> N'Hậu mãi'
    )
    BEGIN
        THROW 50007,
            N'Lịch chăm sóc phải thuộc yêu cầu hậu mãi.',
            1;
    END;
END;
GO

CREATE PROCEDURE spQuyetToanThue
    @MaDT INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @SoDu DECIMAL(18,2);
    DECLARE @TongChiPhi DECIMAL(18,2);
    DECLARE @TrangThai NVARCHAR(40);
    DECLARE @TrangThaiQuyetToan NVARCHAR(40);

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT
            @TrangThai = TrangThai,
            @TrangThaiQuyetToan = TrangThaiQuyetToan
        FROM DonThue WITH (UPDLOCK, HOLDLOCK)
        WHERE MaDT = @MaDT;

        IF @TrangThai IS NULL
            THROW 50011, N'Không tồn tại đơn thuê.', 1;

        IF @TrangThai NOT IN (N'Chờ trả cây', N'Đã trả')
            THROW 50012, N'Đơn chưa ở trạng thái trả cây.', 1;

        IF EXISTS (
            SELECT 1
            FROM ChiTietDonThue
            WHERE MaDT = @MaDT
              AND (
                  NgayKiemTra IS NULL
                  OR TrachNhiem IN (
                      N'Chưa kiểm tra',
                      N'Tranh chấp'
                  )
              )
        )
            THROW 50013,
                N'Chưa kiểm tra xong hoặc còn tranh chấp.',
                1;

        IF EXISTS (
            SELECT 1
            FROM DonThue
            WHERE MaDT = @MaDT
              AND NgayTraThucTe IS NULL
        )
            THROW 50014,
                N'Chưa ghi nhận ngày trả cây.',
                1;

        IF EXISTS (
            SELECT 1
            FROM ThanhToan
            WHERE MaDT = @MaDT
              AND TrangThai = N'Chờ thanh toán'
        )
            THROW 50015,
                N'Còn giao dịch thanh toán đang chờ.',
                1;

        SELECT
            @TongChiPhi = TongChiPhi,
            @SoDu = SoDuQuyetToan
        FROM vwQuyetToanThue
        WHERE MaDT = @MaDT;

        IF @TongChiPhi IS NULL
            THROW 50016,
                N'Đơn thuê chưa có chi tiết.',
                1;

        UPDATE DonThue
        SET
            SoTienPhaiThuThem =
                CASE
                    WHEN @SoDu > 0 THEN @SoDu
                    ELSE 0
                END,
            SoTienHoanKhach =
                CASE
                    WHEN @SoDu < 0 THEN -@SoDu
                    ELSE 0
                END,
            TrangThaiQuyetToan =
                CASE
                    WHEN @SoDu = 0 THEN N'Đã quyết toán'
                    ELSE N'Chờ thanh toán'
                END,
            NgayQuyetToan =
                CASE
                    WHEN @SoDu = 0 THEN SYSDATETIME()
                    ELSE NULL
                END
        WHERE MaDT = @MaDT;

        COMMIT TRANSACTION;

        SELECT
            MaDT,
            TrangThaiQuyetToan,
            SoTienPhaiThuThem,
            SoTienHoanKhach
        FROM DonThue
        WHERE MaDT = @MaDT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO

INSERT INTO VaiTro (TenVaiTro, MoTa)
VALUES
(N'Quản trị viên', N'Quản lý toàn bộ hệ thống'),
(N'Nhân viên', N'Quản lý đơn hàng và dịch vụ'),
(N'Khách hàng', N'Mua cây và thuê cây');
GO

DECLARE @MatKhau VARCHAR(255);

SET @MatKhau =
'$2y$12$WoRSRjI0heLVkX3aIyO93eqD726rfrF2nKAPilzZ0XR1c0MP3uZwm';

INSERT INTO NguoiDung (
    MaVaiTro,
    HoTen,
    Email,
    MatKhau,
    SDT
)
SELECT
    VT.MaVaiTro,
    V.HoTen,
    V.Email,
    @MatKhau,
    V.SDT
FROM (VALUES
    (
        N'Quản trị viên',
        N'Quản trị viên',
        'admin@quanlycaycanh.test',
        '0900000001'
    ),
    (
        N'Nhân viên',
        N'Nguyễn Văn An',
        'nhanvien1@quanlycaycanh.test',
        '0900000002'
    ),
    (
        N'Nhân viên',
        N'Trần Thị Bình',
        'nhanvien2@quanlycaycanh.test',
        '0900000003'
    ),
    (
        N'Khách hàng',
        N'Lê Minh Khang',
        'khach1@quanlycaycanh.test',
        '0900000004'
    ),
    (
        N'Khách hàng',
        N'Phạm Ngọc Mai',
        'khach2@quanlycaycanh.test',
        '0900000005'
    ),
    (
        N'Khách hàng',
        N'Hoàng Gia Huy',
        'khach3@quanlycaycanh.test',
        '0900000006'
    )
) V(TenVaiTro, HoTen, Email, SDT)
JOIN VaiTro VT
    ON VT.TenVaiTro = V.TenVaiTro;
GO

INSERT INTO NhanVien (
    MaNguoiDung,
    ChucVu,
    NgayVaoLam
)
SELECT
    ND.MaNguoiDung,
    V.ChucVu,
    V.NgayVaoLam
FROM (VALUES
    (
        'nhanvien1@quanlycaycanh.test',
        N'Nhân viên bán hàng',
        CONVERT(DATE, '20260110', 112)
    ),
    (
        'nhanvien2@quanlycaycanh.test',
        N'Nhân viên hậu mãi và bảo hành',
        CONVERT(DATE, '20260215', 112)
    )
) V(Email, ChucVu, NgayVaoLam)
JOIN NguoiDung ND
    ON ND.Email = V.Email;

INSERT INTO KhachHang (
    MaNguoiDung,
    NgaySinh,
    GioiTinh
)
SELECT
    ND.MaNguoiDung,
    V.NgaySinh,
    V.GioiTinh
FROM (VALUES
    (
        'khach1@quanlycaycanh.test',
        CONVERT(DATE, '20020412', 112),
        N'Nam'
    ),
    (
        'khach2@quanlycaycanh.test',
        CONVERT(DATE, '20010820', 112),
        N'Nữ'
    ),
    (
        'khach3@quanlycaycanh.test',
        CONVERT(DATE, '20031105', 112),
        N'Nam'
    )
) V(Email, NgaySinh, GioiTinh)
JOIN NguoiDung ND
    ON ND.Email = V.Email;
GO

INSERT INTO DanhMuc (TenDM, MoTa)
VALUES
(N'Cây cảnh để bàn', N'Cây cảnh trang trí bàn làm việc'),
(N'Cây cảnh nội thất', N'Cây trang trí trong nhà'),
(N'Cây phong thủy', N'Cây cảnh phong thủy'),
(N'Cây bonsai', N'Cây bonsai nghệ thuật'),
(N'Cây cảnh sân vườn', N'Cây trang trí sân vườn'),
(N'Cây cảnh cao cấp', N'Cây cảnh giá trị cao'),
(N'Cây cảnh cho thuê', N'Cây phục vụ nhu cầu thuê');
GO

INSERT INTO Kho (
    TenKho,
    DiaChi,
    BanKinhPhucVuKM
)
VALUES
(
    N'Kho cây cảnh chính',
    N'Địa chỉ kho mẫu tại Thành phố Hồ Chí Minh',
    20
),
(
    N'Kho cây cảnh dự phòng',
    N'Địa chỉ kho dự phòng tại Thành phố Hồ Chí Minh',
    15
);
GO

INSERT INTO SanPham (
    MaDM,
    TenSP,
    MoTa,
    LoaiSanPham,
    GiaBan,
    GiaThueTheoNgay,
    GiaTriCay,
    DuDieuKienBaoHanh,
    NhuCauAnhSang,
    HuongDanChamSoc
)
SELECT
    DM.MaDM,
    V.TenSP,
    V.MoTa,
    V.LoaiSanPham,
    V.GiaBan,
    V.GiaThueTheoNgay,
    V.GiaTriCay,
    V.DuDieuKienBaoHanh,
    V.NhuCauAnhSang,
    V.HuongDanChamSoc
FROM (VALUES
    (
        N'Cây cảnh để bàn',
        N'Cây Sen Đá',
        N'Cây nhỏ trang trí bàn',
        N'Bán',
        CONVERT(DECIMAL(18,2),80000),
        CONVERT(DECIMAL(18,2),NULL),
        CONVERT(DECIMAL(18,2),80000),
        0,
        N'Ánh sáng gián tiếp',
        N'Tưới ít nước'
    ),
    (
        N'Cây cảnh để bàn',
        N'Cây Xương Rồng Mini',
        N'Cây xương rồng nhỏ',
        N'Bán',
        65000,
        NULL,
        65000,
        0,
        N'Ánh sáng tự nhiên',
        N'Tưới khi đất khô'
    ),
    (
        N'Cây cảnh nội thất',
        N'Cây Kim Tiền',
        N'Cây cảnh trang trí nội thất',
        N'Bán và thuê',
        350000,
        15000,
        350000,
        0,
        N'Ánh sáng gián tiếp',
        N'Tưới vừa phải'
    ),
    (
        N'Cây cảnh nội thất',
        N'Cây Trầu Bà',
        N'Cây xanh trang trí trong nhà',
        N'Bán và thuê',
        180000,
        10000,
        180000,
        0,
        N'Ánh sáng gián tiếp',
        N'Giữ đất ẩm'
    ),
    (
        N'Cây phong thủy',
        N'Cây Phát Tài',
        N'Cây cảnh phong thủy',
        N'Bán và thuê',
        450000,
        20000,
        450000,
        0,
        N'Ánh sáng vừa',
        N'Tưới định kỳ'
    ),
    (
        N'Cây phong thủy',
        N'Cây Lưỡi Hổ',
        N'Cây cảnh dễ chăm sóc',
        N'Bán và thuê',
        220000,
        12000,
        220000,
        0,
        N'Ánh sáng gián tiếp',
        N'Tưới vừa phải'
    ),
    (
        N'Cây cảnh nội thất',
        N'Cây Bàng Singapore',
        N'Cây trang trí phòng khách',
        N'Bán và thuê',
        850000,
        35000,
        850000,
        0,
        N'Ánh sáng tự nhiên gián tiếp',
        N'Tưới khi đất mặt khô'
    ),
    (
        N'Cây cảnh sân vườn',
        N'Cây Cau Cảnh',
        N'Cây trang trí sân vườn',
        N'Bán và thuê',
        1200000,
        50000,
        1200000,
        0,
        N'Ánh sáng tự nhiên',
        N'Giữ độ ẩm đất phù hợp'
    ),
    (
        N'Cây bonsai',
        N'Bonsai Tùng La Hán',
        N'Cây bonsai nghệ thuật giá trị cao',
        N'Bán và thuê',
        5000000,
        100000,
        5000000,
        1,
        N'Ánh sáng tự nhiên',
        N'Cắt tỉa định kỳ'
    ),
    (
        N'Cây bonsai',
        N'Bonsai Mai Chiếu Thủy',
        N'Cây bonsai nghệ thuật',
        N'Bán và thuê',
        6500000,
        120000,
        6500000,
        1,
        N'Ánh sáng tự nhiên',
        N'Giữ độ ẩm và cắt tỉa'
    ),
    (
        N'Cây cảnh cao cấp',
        N'Cây Tùng Cổ Thụ',
        N'Cây cảnh cao cấp',
        N'Bán và thuê',
        12000000,
        200000,
        12000000,
        1,
        N'Ánh sáng tự nhiên',
        N'Cần chăm sóc chuyên môn'
    ),
    (
        N'Cây cảnh cho thuê',
        N'Cây Cọ Nhật Trang Trí',
        N'Cây trang trí sự kiện',
        N'Thuê',
        NULL,
        30000,
        750000,
        0,
        N'Ánh sáng vừa',
        N'Giữ đất ẩm vừa phải'
    )
) V(
    TenDM,
    TenSP,
    MoTa,
    LoaiSanPham,
    GiaBan,
    GiaThueTheoNgay,
    GiaTriCay,
    DuDieuKienBaoHanh,
    NhuCauAnhSang,
    HuongDanChamSoc
)
JOIN DanhMuc DM
    ON DM.TenDM = V.TenDM;
GO

INSERT INTO TonKho (
    MaKho,
    MaSP,
    SoLuongTon,
    SoLuongDangThue
)
SELECT
    K.MaKho,
    SP.MaSP,
    V.SoLuong,
    0
FROM (VALUES
    (N'Cây Sen Đá',20),
    (N'Cây Xương Rồng Mini',25),
    (N'Cây Kim Tiền',15),
    (N'Cây Trầu Bà',18),
    (N'Cây Phát Tài',12),
    (N'Cây Lưỡi Hổ',16),
    (N'Cây Bàng Singapore',8),
    (N'Cây Cau Cảnh',6),
    (N'Bonsai Tùng La Hán',3),
    (N'Bonsai Mai Chiếu Thủy',2),
    (N'Cây Tùng Cổ Thụ',2),
    (N'Cây Cọ Nhật Trang Trí',10)
) V(TenSP, SoLuong)
JOIN SanPham SP
    ON SP.TenSP = V.TenSP
JOIN Kho K
    ON K.TenKho = N'Kho cây cảnh chính';
GO

INSERT INTO KenhHoTro (TenKenh)
VALUES
(N'Website'),
(N'Ứng dụng di động'),
(N'Điện thoại hỗ trợ'),
(N'Email'),
(N'Chat trực tuyến');
GO

INSERT INTO ChinhSachDichVu (
    TenDichVu,
    NhomDichVu,
    HinhThuc,
    GoiApDung,
    SoNgayToiDa,
    SoGioToiDa,
    YeuCauCayGiaTriCao,
    YeuCauGoiCoPhi,
    PhiMacDinh,
    MoTaDieuKien
)
VALUES
(
    N'Tư vấn chăm sóc cây sau mua',
    N'Hậu mãi', N'Mua', N'Tất cả',
    30, NULL, 0, 0, 0,
    N'Tư vấn miễn phí trong 30 ngày'
),
(
    N'Tư vấn tưới nước và bón phân sau mua',
    N'Hậu mãi', N'Mua', N'Tất cả',
    15, NULL, 0, 0, 0,
    N'Tư vấn miễn phí trong 15 ngày'
),
(
    N'Hỗ trợ trồng cây sau mua',
    N'Hậu mãi', N'Mua', N'Tất cả',
    7, NULL, 0, 0, 0,
    N'Hỗ trợ trong 7 ngày, có thể phát sinh phí'
),
(
    N'Chăm sóc cây tại nhà sau mua',
    N'Hậu mãi', N'Mua', N'Tất cả',
    30, NULL, 0, 1, 300000,
    N'Cần đăng ký gói dịch vụ'
),
(
    N'Bảo hành chất lượng cây sau mua',
    N'Bảo hành', N'Mua', N'Tất cả',
    30, NULL, 1, 1, 200000,
    N'Cây giá trị cao và có quyền lợi bảo hành'
),
(
    N'Đổi trả cây sau mua',
    N'Đổi trả', N'Mua', N'Tất cả',
    3, NULL, 0, 0, 0,
    N'Yêu cầu trong 3 ngày sau khi nhận'
),
(
    N'Báo cây hư hỏng khi nhận',
    N'Đổi trả', N'Mua', N'Tất cả',
    2, 48, 0, 0, 0,
    N'Báo trong 48 giờ và cung cấp hình ảnh'
),
(
    N'Tư vấn chăm sóc cây thuê',
    N'Hậu mãi', N'Thuê', N'Tất cả',
    30, NULL, 0, 0, 0,
    N'Tối đa 30 ngày và không vượt thời hạn thuê'
),
(
    N'Tư vấn bón phân và tưới nước gói cơ bản',
    N'Hậu mãi', N'Thuê', N'Cơ bản',
    10, NULL, 0, 0, 0,
    N'Tối đa 10 ngày'
),
(
    N'Tư vấn bón phân và tưới nước gói cao cấp',
    N'Hậu mãi', N'Thuê', N'Cao cấp',
    15, NULL, 0, 0, 0,
    N'Tối đa 15 ngày'
),
(
    N'Chăm sóc cây tại nơi thuê',
    N'Hậu mãi', N'Thuê', N'Cao cấp',
    30, NULL, 0, 1, 300000,
    N'Thuê ít nhất 15 ngày, có gói cao cấp'
),
(
    N'Bảo hành cây giá trị cao khi thuê',
    N'Bảo hành', N'Thuê', N'Cao cấp',
    30, NULL, 1, 1, 200000,
    N'Tối đa 30 ngày và không vượt thời gian thuê'
),
(
    N'Báo cây thuê hư hỏng khi giao',
    N'Đổi trả', N'Thuê', N'Tất cả',
    2, 48, 0, 0, 0,
    N'Báo hư hỏng trong 48 giờ để xác minh lỗi giao hàng'
);
GO

INSERT INTO KhuyenMai (
    TenKM,
    MoTa,
    LoaiKM,
    NgayBatDau,
    NgayKetThuc,
    SoLuotToiDa
)
VALUES
(
    N'Giảm giá cây cảnh',
    N'Khuyến mãi một số cây bán',
    N'Giảm giá',
    '20260101',
    '20271231',
    100
),
(
    N'Khuyến mãi thuê cây',
    N'Giảm giá thuê cây theo ngày',
    N'Giảm giá',
    '20260101',
    '20271231',
    100
),
(
    N'Ưu đãi dịch vụ cao cấp',
    N'Giảm giá gói chăm sóc và bảo hành',
    N'Giảm giá',
    '20260101',
    '20271231',
    100
);
GO

INSERT INTO ChiTietKhuyenMai (
    MaKM,
    DoiTuong,
    MaSP,
    PhanTramGiam,
    SoLuongGioiHan
)
SELECT
    KM.MaKM,
    V.DoiTuong,
    SP.MaSP,
    V.PhanTramGiam,
    V.SoLuongGioiHan
FROM (VALUES
    (
        N'Giảm giá cây cảnh',
        N'Mua cây',
        N'Cây Kim Tiền',
        CONVERT(DECIMAL(5,2),10),
        30
    ),
    (
        N'Giảm giá cây cảnh',
        N'Mua cây',
        N'Cây Trầu Bà',
        15,
        30
    ),
    (
        N'Giảm giá cây cảnh',
        N'Mua cây',
        N'Cây Bàng Singapore',
        10,
        20
    ),
    (
        N'Khuyến mãi thuê cây',
        N'Thuê cây',
        N'Cây Kim Tiền',
        10,
        30
    ),
    (
        N'Khuyến mãi thuê cây',
        N'Thuê cây',
        N'Cây Cau Cảnh',
        10,
        20
    ),
    (
        N'Khuyến mãi thuê cây',
        N'Thuê cây',
        N'Bonsai Tùng La Hán',
        5,
        10
    )
) V(
    TenKM,
    DoiTuong,
    TenSP,
    PhanTramGiam,
    SoLuongGioiHan
)
JOIN KhuyenMai KM
    ON KM.TenKM = V.TenKM
JOIN SanPham SP
    ON SP.TenSP = V.TenSP;

INSERT INTO ChiTietKhuyenMai (
    MaKM,
    DoiTuong,
    MaChinhSach,
    PhanTramGiam,
    SoLuongGioiHan
)
SELECT
    KM.MaKM,
    N'Dịch vụ',
    CS.MaChinhSach,
    V.PhanTramGiam,
    V.SoLuongGioiHan
FROM (VALUES
    (
        N'Ưu đãi dịch vụ cao cấp',
        N'Chăm sóc cây tại nơi thuê',
        CONVERT(DECIMAL(5,2),10),
        30
    ),
    (
        N'Ưu đãi dịch vụ cao cấp',
        N'Bảo hành cây giá trị cao khi thuê',
        10,
        30
    ),
    (
        N'Ưu đãi dịch vụ cao cấp',
        N'Chăm sóc cây tại nhà sau mua',
        10,
        30
    )
) V(
    TenKM,
    TenDichVu,
    PhanTramGiam,
    SoLuongGioiHan
)
JOIN KhuyenMai KM
    ON KM.TenKM = V.TenKM
JOIN ChinhSachDichVu CS
    ON CS.TenDichVu = V.TenDichVu;
GO



-- CAP NHAT GIA THEO THONG NHAT
DECLARE @BangGiaMoi TABLE (
    TenSP NVARCHAR(150) PRIMARY KEY,
    GiaBan DECIMAL(18,2) NULL,
    GiaThueTheoNgay DECIMAL(18,2) NULL,
    GiaTriCay DECIMAL(18,2) NOT NULL
);

-- Thêm bảng giá mới, không tự tạo MaSP
INSERT INTO @BangGiaMoi (
    TenSP,
    GiaBan,
    GiaThueTheoNgay,
    GiaTriCay
)
VALUES
(N'Cây Sen Đá', 95000, NULL, 95000),
(N'Cây Xương Rồng Mini', 85000, NULL, 85000),
(N'Cây Kim Tiền', 350000, 15000, 350000),
(N'Cây Trầu Bà', 220000, 12000, 220000),
(N'Cây Phát Tài', 500000, 25000, 500000),
(N'Cây Lưỡi Hổ', 280000, 15000, 280000),
(N'Cây Bàng Singapore', 950000, 40000, 950000),
(N'Cây Cau Cảnh', 1350000, 55000, 1350000),
(N'Bonsai Tùng La Hán', 5500000, 120000, 5500000),
(N'Bonsai Mai Chiếu Thủy', 7000000, 150000, 7000000),
(N'Cây Tùng Cổ Thụ', 13000000, 250000, 13000000),
(N'Cây Cọ Nhật Trang Trí', NULL, 35000, 900000);

BEGIN TRY
    BEGIN TRANSACTION;

    -- Kiểm tra tất cả sản phẩm cần cập nhật đều tồn tại
    IF EXISTS (
        SELECT 1
        FROM @BangGiaMoi B
        LEFT JOIN SanPham SP ON SP.TenSP = B.TenSP
        WHERE SP.MaSP IS NULL
    )
    BEGIN
        THROW 50020,
            N'Có sản phẩm chưa tồn tại trong database.',
            1;
    END;

    -- Cập nhật giá theo tên sản phẩm, giữ nguyên MaSP
    UPDATE SP
    SET
        SP.GiaBan = B.GiaBan,
        SP.GiaThueTheoNgay = B.GiaThueTheoNgay,
        SP.GiaTriCay = B.GiaTriCay
    FROM SanPham SP
    INNER JOIN @BangGiaMoi B
        ON SP.TenSP = B.TenSP;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;



-- BO SUNG DU LIEU CHO CAC BANG GIAO DICH

SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    -- Thêm 2 khách hàng để có 5 khách hàng kiểm thử
    DECLARE @RoleKH INT = (SELECT MaVaiTro FROM VaiTro WHERE TenVaiTro=N'Khách hàng');
    DECLARE @Hash VARCHAR(255) = (SELECT TOP 1 MatKhau FROM NguoiDung WHERE Email='khach1@quanlycaycanh.test');
    INSERT INTO NguoiDung(MaVaiTro,HoTen,Email,MatKhau,SDT)
    VALUES (@RoleKH,N'Đỗ Thảo Vy','khach4@quanlycaycanh.test',@Hash,'0900000007'),
           (@RoleKH,N'Vũ Anh Tuấn','khach5@quanlycaycanh.test',@Hash,'0900000008');
    INSERT INTO KhachHang(MaNguoiDung,NgaySinh,GioiTinh)
    SELECT MaNguoiDung,CONVERT(DATE,'20000101',112),N'Nữ'
    FROM NguoiDung WHERE Email='khach4@quanlycaycanh.test';
    INSERT INTO KhachHang(MaNguoiDung,NgaySinh,GioiTinh)
    SELECT MaNguoiDung,CONVERT(DATE,'19991215',112),N'Nam'
    FROM NguoiDung WHERE Email='khach5@quanlycaycanh.test';

    -- Tạo thêm 2 khuyến mãi để có tối thiểu 5 chương trình
    INSERT INTO KhuyenMai(TenKM,MoTa,LoaiKM,NgayBatDau,NgayKetThuc,SoLuotToiDa)
    VALUES (N'Ưu đãi cuối tuần',N'Ưu đãi theo dịp',N'Giảm giá nhanh','20260101','20271231',50),
           (N'Tết xanh',N'Khuyến mãi cây cảnh dịp Tết',N'Lễ Tết','20260101','20271231',60);

    DECLARE @NV INT = (
        SELECT TOP (1) NV.MaNV FROM NhanVien NV
        JOIN NguoiDung ND ON ND.MaNguoiDung=NV.MaNguoiDung
        WHERE ND.Email='nhanvien1@quanlycaycanh.test'
    );
    DECLARE @NVHM INT = (
        SELECT TOP (1) NV.MaNV FROM NhanVien NV
        JOIN NguoiDung ND ON ND.MaNguoiDung=NV.MaNguoiDung
        WHERE ND.Email='nhanvien2@quanlycaycanh.test'
    );
    DECLARE @NDNVHM INT = (
        SELECT MaNguoiDung FROM NguoiDung WHERE Email='nhanvien2@quanlycaycanh.test'
    );
    DECLARE @Kho INT=(SELECT MaKho FROM Kho WHERE TenKho=N'Kho cây cảnh chính');
    DECLARE @Kenh INT=(SELECT MaKenh FROM KenhHoTro WHERE TenKenh=N'Website');
    DECLARE @CSBH INT=(SELECT MaChinhSach FROM ChinhSachDichVu WHERE TenDichVu=N'Bảo hành chất lượng cây sau mua');
    DECLARE @CSCS INT=(SELECT MaChinhSach FROM ChinhSachDichVu WHERE TenDichVu=N'Tư vấn chăm sóc cây sau mua');
    IF @NV IS NULL OR @NVHM IS NULL OR @Kho IS NULL OR @Kenh IS NULL OR @CSBH IS NULL OR @CSCS IS NULL
        THROW 51001,N'Thiếu dữ liệu nền.',1;

    -- Mỗi khách hàng có một địa chỉ và một giỏ hàng
    INSERT INTO DiaChi(MaNguoiDung,TenNguoiNhan,SDT,TinhThanh,QuanHuyen,PhuongXa,DiaChiChiTiet,MacDinh)
    SELECT ND.MaNguoiDung,ND.HoTen,ND.SDT,N'Thành phố Hồ Chí Minh',N'Quận mẫu',N'Phường mẫu',
           CONCAT(N'Địa chỉ kiểm thử ',ND.Email),1
    FROM KhachHang KH JOIN NguoiDung ND ON ND.MaNguoiDung=KH.MaNguoiDung;

    INSERT INTO GioHang(MaKH)
    SELECT MaKH FROM KhachHang;

    -- Năm sản phẩm khác nhau trong năm giỏ
    ;WITH C AS (
        SELECT KH.MaKH, GH.MaGioHang, ROW_NUMBER() OVER(ORDER BY KH.MaKH) AS rn
        FROM KhachHang KH JOIN GioHang GH ON GH.MaKH=KH.MaKH
    ), P AS (
        SELECT MaSP,ROW_NUMBER() OVER(ORDER BY MaSP) AS rn
        FROM SanPham WHERE LoaiSanPham IN(N'Bán',N'Bán và thuê')
    )
    INSERT INTO ChiTietGioHang(MaGioHang,MaSP,SoLuong,LoaiGiaoDich)
    SELECT C.MaGioHang,P.MaSP,1,N'Mua' FROM C JOIN P ON P.rn=C.rn WHERE C.rn<=5;

    -- Năm đơn mua cây bonsai: đảm bảo có quyền lợi bảo hành
    DECLARE @Mua TABLE(rn INT PRIMARY KEY,MaKH INT,MaDiaChi INT,MaDH INT NULL,MaSP INT NULL,MaCTDH INT NULL);
    INSERT INTO @Mua(rn,MaKH,MaDiaChi)
    SELECT ROW_NUMBER() OVER(ORDER BY KH.MaKH), KH.MaKH, DC.MaDiaChi
    FROM KhachHang KH JOIN DiaChi DC ON DC.MaNguoiDung=KH.MaNguoiDung
    WHERE DC.MacDinh=1;

    DECLARE @i INT=1,@KH INT,@DC INT,@DH INT,@DT INT,@SP INT,@CT INT;
    DECLARE @Bonsai INT=(SELECT MaSP FROM SanPham WHERE TenSP=N'Bonsai Tùng La Hán');
    DECLARE @KimTien INT=(SELECT MaSP FROM SanPham WHERE TenSP=N'Cây Kim Tiền');
    DECLARE @CoNhat INT=(SELECT MaSP FROM SanPham WHERE TenSP=N'Cây Cọ Nhật Trang Trí');
    IF @Bonsai IS NULL OR @KimTien IS NULL OR @CoNhat IS NULL
        THROW 51002,N'Thiếu sản phẩm dữ liệu gốc.',1;

    WHILE @i<=5
    BEGIN
        SELECT @KH=MaKH,@DC=MaDiaChi FROM @Mua WHERE rn=@i;
        INSERT INTO DonHang(MaKH,MaNV,MaDiaChiGiao,MaKho,TrangThai,GiamGiaDon,PhiVanChuyen,
                            PhuongThucThanhToan,TrangThaiThanhToan,NgayGiaoThucTe,NgayDat,GhiChu)
        VALUES(@KH,@NV,@DC,@Kho,CASE WHEN @i=1 THEN N'Đã giao' ELSE N'Chờ xác nhận' END,
               0,0,N'Chuyển khoản',CASE WHEN @i=1 THEN N'Đã thanh toán' ELSE N'Chưa thanh toán' END,
               CASE WHEN @i=1 THEN CONVERT(DATETIME2(0),'20261020') ELSE NULL END,
               '20261018',CONCAT(N'DEMO đơn mua thứ ',@i));
        SET @DH=CONVERT(INT,SCOPE_IDENTITY());
        INSERT INTO ChiTietDonHang(MaDH,MaSP,CoGoiBaoHanh,CoGoiChamSoc,SoLuong,DonGiaGoc,DonGia)
        SELECT @DH,MaSP,1,0,1,GiaBan,GiaBan FROM SanPham WHERE MaSP=@Bonsai;
        SET @CT=CONVERT(INT,SCOPE_IDENTITY());
        UPDATE @Mua SET MaDH=@DH,MaSP=@Bonsai,MaCTDH=@CT WHERE rn=@i;
        SET @i=@i+1;
    END;

    -- Năm đơn thuê. Đơn thứ nhất đã trả đủ và hoàn toàn bộ cọc,
    -- đơn thứ hai đang thuê, ba đơn còn lại chờ xác nhận
    DECLARE @Thue TABLE(rn INT PRIMARY KEY,MaKH INT,MaDiaChi INT,MaDT INT NULL,MaSP INT NULL,MaCTDT INT NULL);
    INSERT INTO @Thue(rn,MaKH,MaDiaChi)
    SELECT rn,MaKH,MaDiaChi FROM @Mua;
    SET @i=1;
    WHILE @i<=5
    BEGIN
        SELECT @KH=MaKH,@DC=MaDiaChi FROM @Thue WHERE rn=@i;
        SET @SP=CASE WHEN @i IN(1,3,5) THEN @KimTien ELSE @CoNhat END;
        DECLARE @GiaThue DECIMAL(18,2),@GiaTri DECIMAL(18,2),@Coc DECIMAL(18,2);
        SELECT @GiaThue=GiaThueTheoNgay,@GiaTri=GiaTriCay,
               @Coc=CONVERT(DECIMAL(18,2),GiaTriCay*1.5)
        FROM SanPham WHERE MaSP=@SP;
        INSERT INTO DonThue(
            MaKH,MaNV,MaDiaChiGiao,MaKho,NgayBatDau,NgayKetThuc,
            NgayGiaoThucTe,NgayTraThucTe,GoiThue,TienCocDuKien,TienCocDaThu,
            TrangThai,TrangThaiCoc,TrangThaiQuyetToan,NgayQuyetToan,MaHopDong,GhiChu
        )
        VALUES(
            @KH,@NV,@DC,@Kho,
            CASE WHEN @i=1 THEN '20261018' WHEN @i=2 THEN '20261027' ELSE '20261110' END,
            CASE WHEN @i=1 THEN '20261023' WHEN @i=2 THEN '20261105' ELSE '20261116' END,
            CASE WHEN @i=1 THEN '20261018' WHEN @i=2 THEN '20261027' ELSE NULL END,
            CASE WHEN @i=1 THEN '20261023' ELSE NULL END,
            N'Cơ bản',@Coc,CASE WHEN @i<=2 THEN @Coc ELSE 0 END,
            CASE WHEN @i=1 THEN N'Đã trả' WHEN @i=2 THEN N'Đang thuê' ELSE N'Chờ xác nhận' END,
            CASE WHEN @i=1 THEN N'Đã hoàn' WHEN @i=2 THEN N'Đã thu' ELSE N'Chưa thu' END,
            CASE WHEN @i=1 THEN N'Đã quyết toán' ELSE N'Chưa quyết toán' END,
            CASE WHEN @i=1 THEN '20261024' ELSE NULL END,
            CONCAT('DEMO-HOPDONG-',@i),CONCAT(N'DEMO thuê thứ ',@i)
        );
        SET @DT=CONVERT(INT,SCOPE_IDENTITY());
        INSERT INTO ChiTietDonThue(
            MaDT,MaSP,MaCayThucTe,SoLuong,GiaTriCayKhiGiao,
            GiaThueGocTheoNgay,GiaThueTheoNgay,TienCoc,
            TinhTrangKhiGiao,TinhTrangKhiTra,TrachNhiem,NgayKiemTra,MaNVKiemTra
        )
        VALUES(
            @DT,@SP,
            CASE WHEN @i<=2 THEN CONCAT('DEMO-CAY-',@i) ELSE NULL END,
            1,@GiaTri,@GiaThue,@GiaThue,@Coc,
            CASE WHEN @i<=2 THEN N'Cây khỏe, không hư hỏng' ELSE NULL END,
            CASE WHEN @i=1 THEN N'Cây tốt, không hư hỏng' ELSE NULL END,
            CASE WHEN @i=1 THEN N'Không có lỗi' ELSE N'Chưa kiểm tra' END,
            CASE WHEN @i=1 THEN '20261024' ELSE NULL END,
            CASE WHEN @i=1 THEN @NV ELSE NULL END
        );
        SET @CT=CONVERT(INT,SCOPE_IDENTITY());
        UPDATE @Thue SET MaDT=@DT,MaSP=@SP,MaCTDT=@CT WHERE rn=@i;
        SET @i=@i+1;
    END;

    -- Năm giao dịch thực: mua, cọc, tiền thuê, hoàn cọc, cọc đơn đang thuê
    DECLARE @DH1 INT=(SELECT MaDH FROM @Mua WHERE rn=1);
    DECLARE @DT1 INT=(SELECT MaDT FROM @Thue WHERE rn=1);
    DECLARE @DT2 INT=(SELECT MaDT FROM @Thue WHERE rn=2);
    DECLARE @Coc1 DECIMAL(18,2)=(SELECT TienCoc FROM ChiTietDonThue WHERE MaDT=@DT1);
    DECLARE @Coc2 DECIMAL(18,2)=(SELECT TienCoc FROM ChiTietDonThue WHERE MaDT=@DT2);
    DECLARE @TienThue1 DECIMAL(18,2)=(
        SELECT CONVERT(DECIMAL(18,2),DATEDIFF(DAY,DT.NgayBatDau,DT.NgayKetThuc))*CT.GiaThueTheoNgay
        FROM DonThue DT JOIN ChiTietDonThue CT ON CT.MaDT=DT.MaDT WHERE DT.MaDT=@DT1
    );
    INSERT INTO ThanhToan(MaDH,LoaiThanhToan,SoTien,PhuongThuc,MaGiaoDich,TrangThai,ThoiGian)
    SELECT @DH1,N'Mua hàng',TongPhaiTra,N'Chuyển khoản','DEMO-TT-MUA',N'Đã thanh toán','20261019'
    FROM vwTongTienDonHang WHERE MaDH=@DH1;
    INSERT INTO ThanhToan(MaDT,LoaiThanhToan,SoTien,PhuongThuc,MaGiaoDich,TrangThai,ThoiGian)
    VALUES (@DT1,N'Đặt cọc',@Coc1,N'Chuyển khoản','DEMO-THU-COC-1',N'Đã thanh toán','20261017'),
           (@DT1,N'Tiền thuê',@TienThue1,N'Chuyển khoản','DEMO-THU-THUE-1',N'Đã thanh toán','20261017'),
           (@DT1,N'Hoàn cọc',@Coc1,N'Chuyển khoản','DEMO-HOAN-COC-1',N'Đã thanh toán','20261024'),
           (@DT2,N'Đặt cọc',@Coc2,N'Chuyển khoản','DEMO-THU-COC-2',N'Đã thanh toán','20261026');

    -- Năm đánh giá, mỗi khách một đánh giá (dữ liệu kiểm thử)
    INSERT INTO DanhGia(MaKH,MaSP,SoSao,NoiDung,NgayDanhGia,TrangThai)
    SELECT MaKH,MaSP,CASE WHEN rn%2=0 THEN 4 ELSE 5 END,
           CONCAT(N'Đánh giá demo của khách thứ ',rn),DATEADD(DAY,rn,'20261021'),1
    FROM @Mua;

    -- Mỗi đơn mua có một bảo hành và một yêu cầu chăm sóc
    -- 10 yêu cầu, 5 phiếu bảo hành, 5 lịch chăm sóc
    DECLARE @YC TABLE(rn INT,Loai NVARCHAR(20),MaYC INT);
    SET @i=1;
    WHILE @i<=5
    BEGIN
        SELECT @KH=MaKH,@DH=MaDH,@CT=MaCTDH FROM @Mua WHERE rn=@i;
        DECLARE @NgayYC DATETIME2(0)=DATEADD(DAY,@i,'20261021');
        INSERT INTO YeuCauHauMai(
            MaKH,MaDH,MaCTDH,MaChinhSach,MaNVTiepNhan,MaNVXuLy,MaKenhTiepNhan,
            NhomYeuCau,LoaiYeuCau,TieuDe,MoTa,MucDo,TrangThai,NgayTao,
            HanPhanHoi,HanXuLy,NgayPhanHoiDau
        )
        VALUES(@KH,@DH,@CT,@CSBH,@NVHM,@NVHM,@Kenh,
               N'Bảo hành',N'Kiểm tra chất lượng cây',CONCAT(N'DEMO bảo hành thứ ',@i),
               N'Đề nghị kiểm tra và tư vấn tình trạng lá cây',N'Trung bình',N'Đang xử lý',
               @NgayYC,DATEADD(DAY,1,@NgayYC),DATEADD(DAY,5,@NgayYC),@NgayYC);
        DECLARE @YCBH INT=CONVERT(INT,SCOPE_IDENTITY());
        INSERT INTO @YC(rn,Loai,MaYC) VALUES(@i,N'Bảo hành',@YCBH);
        INSERT INTO BaoHanh(MaYC,NgayBatDau,NgayHetHan,NguyenNhan,KetQuaKiemTra,HuongXuLy,TrangThai,MaNVXacMinh,NgayXacMinh)
        VALUES(@YCBH,'20261020','20261115',N'Kiểm tra lá cây',N'Đã xác minh ban đầu',N'Chăm sóc',N'Đang xử lý',@NVHM,@NgayYC);

        INSERT INTO YeuCauHauMai(
            MaKH,MaDH,MaCTDH,MaChinhSach,MaNVTiepNhan,MaNVXuLy,MaKenhTiepNhan,
            NhomYeuCau,LoaiYeuCau,TieuDe,MoTa,MucDo,TrangThai,NgayTao,
            HanPhanHoi,HanXuLy,NgayPhanHoiDau
        )
        VALUES(@KH,@DH,@CT,@CSCS,@NVHM,@NVHM,@Kenh,
               N'Hậu mãi',N'Tư vấn chăm sóc',CONCAT(N'DEMO chăm sóc thứ ',@i),
               N'Nhờ hướng dẫn tưới nước và bón phân',N'Thấp',N'Đã tiếp nhận',
               @NgayYC,DATEADD(DAY,1,@NgayYC),DATEADD(DAY,5,@NgayYC),@NgayYC);
        DECLARE @YCCS INT=CONVERT(INT,SCOPE_IDENTITY());
        INSERT INTO @YC(rn,Loai,MaYC) VALUES(@i,N'Hậu mãi',@YCCS);
        INSERT INTO LichHenChamSoc(MaYC,MaNV,LoaiCongViec,NgayHen,NgayHoanTat,DiaDiem,PhiDuKien,PhiThucTe,KhachDongYPhi,TrangThai,KetQua)
        VALUES(@YCCS,@NVHM,N'Chăm sóc',DATEADD(DAY,2,@NgayYC),DATEADD(HOUR,1,DATEADD(DAY,2,@NgayYC)),
               N'Tư vấn tại cửa hàng',0,0,0,N'Hoàn tất',N'Đã hướng dẫn khách chăm sóc cây');
        SET @i=@i+1;
    END;

    -- 10 bản ghi lịch sử trạng thái và tương tác (mỗi yêu cầu một bản ghi)
    INSERT INTO LichSuTrangThai(MaYC,TrangThaiCu,TrangThaiMoi,MaNguoiThayDoi,LyDo,ThoiGian)
    SELECT MaYC,NULL,N'Mới tạo',@NDNVHM,N'Tạo yêu cầu demo',DATEADD(DAY,rn,'20261021')
    FROM @YC;

    INSERT INTO LichSuTuongTac(MaYC,MaNguoiDung,MaKenh,LoaiTuongTac,NoiDung,ThoiGian)
    SELECT YC.MaYC,ND.MaNguoiDung,@Kenh,N'Tin nhắn',
           CONCAT(N'Trao đổi về yêu cầu ',YC.Loai),DATEADD(DAY,YC.rn,'20261021')
    FROM @YC YC
    JOIN YeuCauHauMai Y ON Y.MaYC=YC.MaYC
    JOIN KhachHang KH ON KH.MaKH=Y.MaKH
    JOIN NguoiDung ND ON ND.MaNguoiDung=KH.MaNguoiDung;

    -- Đối chiếu quyết toán thuê hoàn cọc: phải bằng 0
    IF EXISTS(SELECT 1 FROM vwQuyetToanThue WHERE MaDT=@DT1 AND SoDuQuyetToan<>0)
       OR NOT EXISTS(SELECT 1 FROM vwQuyetToanThue WHERE MaDT=@DT1)
        THROW 51003,N'Đơn thuê đã hoàn cọc chưa cân bằng.',1;

    COMMIT TRANSACTION;
    PRINT N'HOÀN TẤT: Tạo database, bảng và dữ liệu kiểm thử.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

SELECT T.name AS TenBang, SUM(P.rows) AS SoLuong
FROM sys.tables T
JOIN sys.partitions P ON P.object_id=T.object_id AND P.index_id IN(0,1)
GROUP BY T.name
ORDER BY T.name;
GO

SELECT DT.MaDT,DT.MaHopDong,DT.TienCocDaThu,V.TienThueThucTe,
       V.CocDaThu,V.DaThanhToan,V.DaHoan,V.SoDuQuyetToan
FROM DonThue DT LEFT JOIN vwQuyetToanThue V ON V.MaDT=DT.MaDT
ORDER BY DT.MaDT;
GO

USE QuanLyCayCanh;
GO

IF COL_LENGTH('dbo.NguoiDung', 'TenDangNhap') IS NULL
BEGIN
    ALTER TABLE dbo.NguoiDung
    ADD TenDangNhap VARCHAR(50) NULL;
END;
GO

UPDATE dbo.NguoiDung
SET TenDangNhap = CONCAT('nhai', MaNguoiDung)
WHERE TenDangNhap IS NULL;
GO

IF EXISTS (
    SELECT 1
    FROM dbo.NguoiDung
    GROUP BY TenDangNhap
    HAVING COUNT(*) > 1
)
BEGIN
    THROW 50001, N'Tên đăng nhập bị trùng, cần kiểm tra trước khi tạo UNIQUE.', 1;
END;
GO

IF EXISTS (
    SELECT 1
    FROM dbo.NguoiDung
    WHERE TenDangNhap IS NULL
)
BEGIN
    THROW 50002, N'Còn người dùng chưa có tên đăng nhập.', 1;
END;
GO

ALTER TABLE dbo.NguoiDung
ALTER COLUMN TenDangNhap VARCHAR(50) NOT NULL;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UQ_NguoiDungTenDangNhap'
      AND object_id = OBJECT_ID('dbo.NguoiDung')
)
BEGIN
    CREATE UNIQUE INDEX UQ_NguoiDungTenDangNhap
    ON dbo.NguoiDung(TenDangNhap);
END;
GO

SELECT
    MaNguoiDung,
    TenDangNhap,
    HoTen,
    Email
FROM dbo.NguoiDung
ORDER BY MaNguoiDung;
```

Ví dụ kết quả:

| MaNguoiDung | TenDangNhap |
|---|---|
| 1 | nhai1 |
| 2 | nhai2 |
| 3 | nhai3 |

Đây là tên đăng nhập được tạo tự động cho các tài khoản cũ, không phải tên đăng nhập cuối cùng bắt buộc sử dụng. Sau này có thể đổi sang tên riêng, miễn không trùng.

**Lưu ý:** Hãy sao lưu database trước khi chạy. Script này thay đổi cấu trúc bảng `NguoiDung`, nhưng không xóa dữ liệu hiện có.

## 3. Bước 2: Đổi Backend sang đăng nhập bằng tên người dùng

### File `backend/src/services/AuthService.ts`

Thay toàn bộ nội dung bằng:

<CodeBlock language="typescript" editable>
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseConfig } from '../config/DatabaseConfig';
import * as sql from 'mssql/msnodesqlv8';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseConfig,
    private readonly jwt: JwtService,
  ) {}

  async login(tenDangNhap: string, matKhau: string) {
    if (!tenDangNhap?.trim() || !matKhau) {
      throw new UnauthorizedException(
        'Vui lòng nhập tên đăng nhập và mật khẩu',
      );
    }

    const result = await this.database
      .getConnection()
      .request()
      .input('TenDangNhap', sql.VarChar(50), tenDangNhap.trim())
      .query(`
        SELECT
          ND.MaNguoiDung,
          ND.TenDangNhap,
          ND.HoTen,
          ND.Email,
          ND.MatKhau,
          ND.TrangThai,
          VT.TenVaiTro,
          KH.MaKH,
          NV.MaNV
        FROM dbo.NguoiDung ND
        INNER JOIN dbo.VaiTro VT
          ON VT.MaVaiTro = ND.MaVaiTro
        LEFT JOIN dbo.KhachHang KH
          ON KH.MaNguoiDung = ND.MaNguoiDung
        LEFT JOIN dbo.NhanVien NV
          ON NV.MaNguoiDung = ND.MaNguoiDung
        WHERE ND.TenDangNhap = @TenDangNhap
      `);

    const user = result.recordset[0];

    if (!user || !user.TrangThai) {
      throw new UnauthorizedException(
        'Tên đăng nhập hoặc mật khẩu không đúng',
      );
    }

    const hash = String(user.MatKhau).replace(/^\$2y\$/, '$2b$');
    const validPassword = await bcrypt.compare(matKhau, hash);

    if (!validPassword) {
      throw new UnauthorizedException(
        'Tên đăng nhập hoặc mật khẩu không đúng',
      );
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.MaNguoiDung,
      role: user.TenVaiTro,
      maKH: user.MaKH,
      maNV: user.MaNV,
    });

    return {
      accessToken,
      user: {
        MaNguoiDung: user.MaNguoiDung,
        TenDangNhap: user.TenDangNhap,
        HoTen: user.HoTen,
        Email: user.Email,
        TenVaiTro: user.TenVaiTro,
        MaKH: user.MaKH,
        MaNV: user.MaNV,
      },
    };
  }
}
