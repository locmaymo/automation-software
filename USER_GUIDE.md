# Hướng dẫn sử dụng Automation Suite

## Tổng quan

Automation Suite là phần mềm tự động hóa trình duyệt mạnh mẽ, cho phép:
- Quản lý nhiều proxy servers
- Tạo và quản lý browser profiles với fingerprint độc đáo
- Điều khiển nhiều browser sessions đồng thời
- Tạo và thực thi automation scripts
- Hệ thống Master/Slave để đồng bộ hóa actions

## Giao diện chính

### Dashboard
- Hiển thị tổng quan hệ thống
- Thống kê proxy, profiles, browsers, scripts
- Biểu đồ phân bố trạng thái
- Kết nối WebSocket real-time

### Dark/Light Mode
- Chuyển đổi theme bằng nút ở góc dưới trái
- Cài đặt được lưu tự động

## Module Proxy Manager

### Thêm Proxy
1. Click "Add Proxy"
2. Nhập thông tin:
   - Host: IP address hoặc domain
   - Port: Port number
   - Username/Password: Nếu proxy yêu cầu auth
   - Protocol: HTTP hoặc HTTPS
   - Notes: Ghi chú tùy chọn
3. Click "Add Proxy"

### Bulk Add Proxies
1. Click "Bulk Add"
2. Nhập danh sách proxy theo format:
   ```
   host:port
   host:port:username:password
   ```
3. Click "Import Proxies"

### Test Proxy
- Chọn proxy và click "Test Selected"
- Hệ thống sẽ kiểm tra tính khả dụng
- Kết quả hiển thị trong cột Status

### Quản lý Proxy
- Filter theo trạng thái: Working, Failed, Untested
- Search theo host/port
- Bulk delete các proxy không cần thiết
- Xem assignment status

## Module Profile Manager

### Tạo Profile
1. Click "Add Profile"
2. Nhập tên profile
3. Chọn proxy (tùy chọn)
4. Thêm notes nếu cần
5. Click "Create Profile"

### Bulk Create Profiles
1. Click "Bulk Create"
2. Cài đặt:
   - Số lượng profiles
   - Name prefix
   - Auto-assign proxies
3. Click "Create Profiles"

### Quản lý Fingerprint
- Mỗi profile có fingerprint độc đáo
- Click icon Settings để xem chi tiết fingerprint
- Click icon Shuffle để tạo fingerprint mới
- Fingerprint bao gồm:
  - User Agent
  - Screen resolution
  - Platform info
  - CPU cores
  - Memory
  - WebGL info
  - Timezone
  - Language

### Gán Proxy
- Dropdown "Assign Proxy" để chọn proxy
- Chỉ hiển thị proxy available
- Có thể thay đổi proxy bất kỳ lúc nào

## Module Browser Manager

### Khởi động Browser
1. Chọn profile từ "Available Profiles"
2. Click "Start" để khởi động browser
3. Browser sẽ xuất hiện trong "Browser Sessions"

### Bulk Operations
- Chọn multiple sessions bằng checkbox
- "Start Selected": Khởi động nhiều browser
- "Stop Selected": Dừng nhiều browser
- "Cleanup All": Dừng tất cả browser

### Master/Slave System
- **Set Master**: Chọn 1 browser làm master
- **Add Slave**: Thêm browser vào slave group
- **Remove Slave**: Loại bỏ khỏi slave group
- Actions thực thi trên master sẽ được đồng bộ đến slaves

### Execute Actions
1. Click "Execute Action"
2. Chọn target:
   - Master Browser: Chỉ thực thi trên master
   - All Slave Browsers: Thực thi trên tất cả slaves
   - Specific Browser: Thực thi trên browser được chọn
3. Chọn action type:
   - Navigate: Điều hướng đến URL
   - Click: Click element
   - Type: Nhập text
   - Wait: Chờ một khoảng thời gian
   - Wait for Selector: Chờ element xuất hiện
   - Get Text: Lấy text từ element
   - Screenshot: Chụp màn hình
   - Evaluate: Thực thi JavaScript
4. Nhập parameters tương ứng
5. Click "Execute"

## Module Script Manager

### Tạo Script
1. Click "Create Script"
2. Nhập thông tin cơ bản:
   - Script Name
   - Description
   - Schedule (Cron expression)
3. Thêm Actions:
   - Click "Add Action"
   - Chọn action type
   - Nhập parameters
   - Cài đặt "Stop on error"
4. Click "Create Script"

### Cron Schedule Format
```
* * * * * *
│ │ │ │ │ │
│ │ │ │ │ └── Day of week (0-6, 0=Sunday)
│ │ │ │ └──── Month (1-12)
│ │ │ └────── Day of month (1-31)
│ │ └──────── Hour (0-23)
│ └────────── Minute (0-59)
└──────────── Second (0-59)
```

Ví dụ:
- `0 0 * * * *`: Mỗi giờ
- `0 0 9 * * 1-5`: 9h sáng các ngày trong tuần
- `0 */15 * * * *`: Mỗi 15 phút

### Quản lý Scripts
- **Execute**: Chạy script ngay lập tức
- **Edit**: Chỉnh sửa script
- **Toggle**: Bật/tắt script
- **Delete**: Xóa script
- **View History**: Xem lịch sử thực thi

### Script Actions
Các action được hỗ trợ:
1. **Navigate**: Điều hướng đến URL
2. **Click**: Click element bằng CSS selector
3. **Type**: Nhập text vào input field
4. **Wait**: Chờ một khoảng thời gian (ms)
5. **Wait for Selector**: Chờ element xuất hiện
6. **Get Text**: Lấy text từ element
7. **Screenshot**: Chụp màn hình
8. **Evaluate**: Thực thi JavaScript code

## WebSocket Real-time Updates

Hệ thống sử dụng WebSocket để cập nhật real-time:
- Trạng thái browser sessions
- Kết quả script execution
- Proxy status changes
- Server notifications

Trạng thái kết nối hiển thị ở góc dưới trái:
- 🟢 Connected: Kết nối bình thường
- 🔴 Disconnected: Mất kết nối

## Tips và Best Practices

### Proxy Management
- Test proxy trước khi sử dụng
- Sử dụng proxy chất lượng cao cho stability
- Rotate proxy định kỳ để tránh bị block

### Profile Management
- Tạo profile với fingerprint đa dạng
- Sử dụng proxy khác nhau cho mỗi profile
- Backup profile data quan trọng

### Browser Automation
- Sử dụng Master/Slave cho bulk operations
- Thêm wait time hợp lý giữa các actions
- Handle errors gracefully trong scripts

### Script Development
- Test script trên ít browser trước
- Sử dụng "Stop on error" cho debugging
- Monitor script performance và success rate

### Performance Optimization
- Không chạy quá nhiều browser đồng thời
- Close browser sessions không cần thiết
- Monitor system resources

## Troubleshooting

### Browser không khởi động
- Kiểm tra proxy settings
- Đảm bảo Chrome/Chromium được cài đặt
- Check system resources

### Script execution fails
- Verify CSS selectors
- Check target website changes
- Review error logs

### Proxy connection issues
- Test proxy manually
- Check firewall settings
- Verify proxy credentials

### Performance issues
- Reduce concurrent browsers
- Close unused sessions
- Check system memory usage

