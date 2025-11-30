# Hướng dẫn cấu hình Email Service với Gmail SMTP

## 📧 Tổng quan
Dự án Jobify sử dụng Gmail SMTP để gửi email khôi phục mật khẩu và email chào mừng cho người dùng.

## 🔐 Cấu hình Gmail App Password

### Bước 1: Bật 2-Factor Authentication (2FA)
1. Truy cập [Google Account Security](https://myaccount.google.com/security)
2. Trong phần "Signing in to Google", bật "2-Step Verification"
3. Làm theo hướng dẫn để thiết lập 2FA

### Bước 2: Tạo App Password
1. Sau khi bật 2FA, quay lại [Google Account Security](https://myaccount.google.com/security)
2. Trong phần "Signing in to Google", chọn "App passwords"
3. Chọn "Mail" và "Other (custom name)"
4. Nhập tên: "Jobify Backend"
5. Google sẽ tạo một mật khẩu 16 ký tự
6. **Lưu mật khẩu này** - bạn sẽ không thể xem lại

### Bước 3: Cấu hình Environment Variables
Tạo file `.env` trong thư mục `src/server/` với nội dung:

```env
# Email Configuration (Gmail SMTP)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
FRONTEND_URL=http://localhost:3000
```

**Lưu ý quan trọng:**
- `EMAIL_PASSWORD` phải là App Password (16 ký tự), KHÔNG phải mật khẩu Gmail thường
- Không có dấu cách trong App Password
- Ví dụ: `abcd efgh ijkl mnop` → `abcdefghijklmnop`

## 🧪 Test Email Service

### Kiểm tra kết nối
Khi khởi động server, bạn sẽ thấy:
```
✅ Email service đã sẵn sàng
```

Nếu có lỗi:
```
❌ Lỗi kết nối email service: [chi tiết lỗi]
```

### Test gửi email
1. Đăng ký tài khoản mới → Nhận email chào mừng
2. Sử dụng tính năng "Quên mật khẩu" → Nhận email khôi phục

## 🔧 Troubleshooting

### Lỗi thường gặp:

#### 1. "Invalid login: 535-5.7.8 Username and Password not accepted"
- **Nguyên nhân:** Sử dụng mật khẩu Gmail thường thay vì App Password
- **Giải pháp:** Tạo App Password mới và sử dụng

#### 2. "Less secure app access"
- **Nguyên nhân:** Gmail đã tắt tính năng này
- **Giải pháp:** Phải sử dụng App Password với 2FA

#### 3. "Connection timeout"
- **Nguyên nhân:** Firewall hoặc network blocking
- **Giải pháp:** Kiểm tra kết nối internet và firewall

#### 4. Email không được gửi
- Kiểm tra spam folder
- Kiểm tra logs server để xem chi tiết lỗi
- Verify EMAIL_USER và EMAIL_PASSWORD trong .env

## 📨 Email Templates

### Email khôi phục mật khẩu
- **Subject:** 🔐 Khôi phục mật khẩu tài khoản Jobify
- **Template:** HTML responsive với branding Jobify
- **Expiry:** 15 phút

### Email chào mừng
- **Subject:** 🎉 Chào mừng bạn đến với Jobify! (User)
- **Subject:** 🏢 Chào mừng công ty đến với Jobify! (Company)
- **Template:** HTML responsive với hướng dẫn sử dụng

## 🔒 Security Best Practices

1. **Không commit .env file** - Đã có trong .gitignore
2. **Sử dụng App Password** - Không bao giờ dùng mật khẩu chính
3. **Rotate App Password định kỳ** - Tạo mới mỗi 6 tháng
4. **Monitor email logs** - Kiểm tra logs để phát hiện abuse
5. **Rate limiting** - Giới hạn số email gửi per IP/user

## 🚀 Production Deployment

### Cấu hình cho Production:
```env
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=production_app_password
FRONTEND_URL=https://yourdomain.com
```

### Alternatives cho Production:
- **SendGrid** - Dễ scale, analytics tốt
- **AWS SES** - Cost-effective, reliable
- **Mailgun** - Developer-friendly
- **Postmark** - High deliverability

### Migration từ Gmail:
1. Cài đặt provider mới (ví dụ: SendGrid)
2. Update EmailService constructor
3. Test thoroughly
4. Update environment variables
5. Deploy

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra logs server
2. Verify cấu hình Gmail
3. Test với email khác
4. Liên hệ team development
