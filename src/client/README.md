# Jobify AI CV Scorer - Frontend

## Mô tả
Giao diện web để chấm điểm CV với AI. Cho phép người dùng tải lên CV và chọn công việc để nhận điểm số và gợi ý cải thiện.

## Tính năng
- ✅ Upload CV (hỗ trợ PDF, DOCX, JPG, PNG)
- ✅ Tìm kiếm và lọc danh sách công việc
- ✅ Chọn công việc để so sánh với CV
- ✅ Hiển thị điểm số và gợi ý cải thiện
- 🚧 Tích hợp AI để chấm điểm thực tế (đang phát triển)

## Cách chạy

### Phương pháp 1: Sử dụng Python HTTP Server (Đơn giản)
```bash
# Di chuyển vào thư mục client
cd src/client

# Chạy Python HTTP server
python -m http.server 3000

# Hoặc với Python 3
python3 -m http.server 3000
```

### Phương pháp 2: Sử dụng Node.js (Live Server)
```bash
# Cài đặt live-server globally
npm install -g live-server

# Di chuyển vào thư mục client
cd src/client

# Chạy live server
live-server --port=3000 --open=/index.html
```

### Phương pháp 3: Sử dụng VS Code Live Server Extension
1. Mở VS Code
2. Cài extension "Live Server"
3. Right-click vào file `index.html`
4. Chọn "Open with Live Server"

## Cấu hình
- **Backend API**: `http://localhost:5000/api`
- **Frontend**: `http://localhost:3000` (hoặc port bạn chọn)

## Lưu ý
1. Đảm bảo backend server đang chạy trên `http://localhost:5000`
2. CORS đã được cấu hình trong backend để cho phép frontend connect

## File structure
```
src/client/
├── index.html          # Giao diện chính
├── styles.css          # CSS styling
├── script.js           # JavaScript logic
└── README.md           # Hướng dẫn này
```

## API Dependencies
Giao diện sử dụng các API endpoint sau từ backend:
- `GET /api/jobs` - Lấy danh sách công việc
- `GET /api/jobs/{id}` - Lấy chi tiết công việc  
- `GET /api/fields` - Lấy danh sách lĩnh vực
- `GET /api/provinces` - Lấy danh sách tỉnh thành
- `POST /api/cv-score` - Chấm điểm CV (sẽ implement)





