# Hướng dẫn cài đặt phần mềm Automation Suite

## Yêu cầu hệ thống

### Phần cứng tối thiểu:
- RAM: 4GB (khuyến nghị 8GB+)
- CPU: 2 cores (khuyến nghị 4 cores+)
- Ổ cứng: 2GB dung lượng trống
- Kết nối Internet ổn định

### Phần mềm:
- Node.js 18.0+ (khuyến nghị 20.x)
- npm 8.0+
- Git (tùy chọn)

## Cài đặt

### Bước 1: Cài đặt Node.js
1. Truy cập https://nodejs.org
2. Tải và cài đặt phiên bản LTS mới nhất
3. Kiểm tra cài đặt:
```bash
node --version
npm --version
```

### Bước 2: Giải nén và cài đặt phần mềm
1. Giải nén file `automation-software.zip`
2. Mở terminal/command prompt tại thư mục đã giải nén
3. Cài đặt dependencies:
```bash
npm install
```

### Bước 3: Cài đặt dependencies cho frontend
```bash
cd frontend
npm install
cd ..
```

### Bước 4: Build frontend
```bash
cd frontend
npm run build
cd ..
```

## Khởi động phần mềm

### Khởi động server:
```bash
npm run dev:backend
```

### Truy cập giao diện web:
Mở trình duyệt và truy cập: `http://localhost:3001`

## Cấu hình

### File .env
Tạo file `.env` trong thư mục gốc với nội dung:
```
PORT=3001
DB_PATH=./database.sqlite
JWT_SECRET=your-secret-key-here
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Cấu hình Proxy
- Truy cập "Proxy Manager" để thêm proxy servers
- Hỗ trợ HTTP/HTTPS proxy với authentication

### Cấu hình Profile
- Truy cập "Profile Manager" để tạo browser profiles
- Mỗi profile có fingerprint riêng biệt
- Có thể gán proxy cho từng profile

## Sử dụng cơ bản

### 1. Quản lý Proxy
- Thêm proxy: Host, Port, Username/Password (tùy chọn)
- Test proxy để kiểm tra tính khả dụng
- Bulk import từ file text

### 2. Quản lý Profile
- Tạo profile với fingerprint ngẫu nhiên
- Gán proxy cho profile
- Bulk create nhiều profile cùng lúc

### 3. Quản lý Browser
- Khởi động browser với profile cụ thể
- Điều khiển Master/Slave browsers
- Thực thi actions trên nhiều browser

### 4. Quản lý Script
- Tạo automation scripts với GUI
- Lên lịch chạy scripts tự động
- Theo dõi kết quả thực thi

## Khắc phục sự cố

### Lỗi cài đặt dependencies:
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### Lỗi khởi động server:
- Kiểm tra port 3001 có bị chiếm dụng
- Kiểm tra quyền ghi file database
- Xem log chi tiết trong console

### Lỗi browser không khởi động:
- Cài đặt Chrome/Chromium
- Kiểm tra quyền thực thi
- Tắt antivirus tạm thời

## Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra log trong console
2. Đảm bảo đã cài đặt đúng Node.js version
3. Kiểm tra firewall/antivirus settings
4. Liên hệ support team với thông tin chi tiết lỗi

