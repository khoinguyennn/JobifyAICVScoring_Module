import nodemailer from 'nodemailer';
import { AppError } from '@/middlewares/errorHandler';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // App Password, không phải mật khẩu Gmail thường
      },
    });
  }

  /**
   * Gửi email khôi phục mật khẩu
   */
  async sendResetPasswordEmail(
    toEmail: string,
    userName: string,
    resetUrl: string
  ): Promise<void> {
    try {
      const htmlTemplate = this.getResetPasswordTemplate(userName, resetUrl);

      const mailOptions = {
        from: {
          name: 'Jobify - Nền tảng tìm việc',
          address: process.env.EMAIL_USER!,
        },
        to: toEmail,
        subject: '🔐 Khôi phục mật khẩu tài khoản Jobify',
        html: htmlTemplate,
        text: `
Xin chào ${userName},

Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản Jobify của mình.

Vui lòng nhấn vào link sau để đặt lại mật khẩu:
${resetUrl}

Link này sẽ hết hạn sau 15 phút.

Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.

Trân trọng,
Đội ngũ Jobify
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email đã được gửi thành công:', info.messageId);
      console.log('📧 Gửi đến:', toEmail);
      console.log('🔗 Reset URL:', resetUrl);

    } catch (error) {
      console.error('❌ Lỗi khi gửi email:', error);
      throw new AppError('Không thể gửi email khôi phục mật khẩu', 500);
    }
  }

  /**
   * Template HTML cho email khôi phục mật khẩu
   */
  private getResetPasswordTemplate(userName: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Khôi phục mật khẩu - Jobify</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 10px;
        }
        .title {
            color: #374151;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
            color: #6b7280;
            font-size: 16px;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .reset-button {
            display: inline-block;
            padding: 15px 30px;
            background-color: #8b5cf6;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            transition: background-color 0.3s;
        }
        .reset-button:hover {
            background-color: #7c3aed;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #9ca3af;
            text-align: center;
        }
        .security-note {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 14px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo" style="font-size: 32px; font-weight: bold; color: #8b5cf6; margin-bottom: 10px; text-align: center;">
                🟣 Jobify
            </div>
            <h1 class="title">Khôi phục mật khẩu</h1>
        </div>

        <div class="content">
            <p>Xin chào <strong>${userName}</strong>,</p>
            
            <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản Jobify của bạn.</p>
            
            <p>Để đặt lại mật khẩu, vui lòng nhấn vào nút bên dưới:</p>
        </div>

        <div class="button-container">
            <a href="${resetUrl}" class="reset-button" style="display: inline-block; padding: 15px 30px; background-color: #8b5cf6; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                🔐 Đặt lại mật khẩu
            </a>
        </div>

        <div class="warning">
            <strong>⚠️ Lưu ý quan trọng:</strong>
            <ul>
                <li>Link này chỉ có hiệu lực trong <strong>15 phút</strong></li>
                <li>Chỉ sử dụng được <strong>một lần duy nhất</strong></li>
                <li>Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này</li>
            </ul>
        </div>

        <div class="security-note">
            <strong>🛡️ Bảo mật tài khoản:</strong><br>
            Nếu bạn không yêu cầu khôi phục mật khẩu, có thể ai đó đang cố gắng truy cập tài khoản của bạn. 
            Vui lòng kiểm tra và thay đổi mật khẩu nếu cần thiết.
        </div>

        <div class="footer">
            <p>
                <strong>Jobify</strong> - Nền tảng tìm việc hàng đầu Việt Nam<br>
                Email này được gửi tự động, vui lòng không trả lời.
            </p>
            <p>
                Nếu bạn gặp khó khăn, hãy liên hệ: 
                <a href="mailto:support@jobify.vn" style="color: #8b5cf6;">support@jobify.vn</a>
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Kiểm tra kết nối email
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service đã sẵn sàng');
      return true;
    } catch (error) {
      console.error('❌ Lỗi kết nối email service:', error);
      return false;
    }
  }

  /**
   * Gửi email chào mừng khi đăng ký (tùy chọn)
   */
  async sendWelcomeEmail(
    toEmail: string,
    userName: string,
    userType: 'user' | 'company'
  ): Promise<void> {
    try {
      const subject = userType === 'user' 
        ? '🎉 Chào mừng bạn đến với Jobify!' 
        : '🏢 Chào mừng công ty đến với Jobify!';

      const htmlTemplate = this.getWelcomeTemplate(userName, userType);

      const mailOptions = {
        from: {
          name: 'Jobify - Nền tảng tìm việc',
          address: process.env.EMAIL_USER!,
        },
        to: toEmail,
        subject,
        html: htmlTemplate,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email chào mừng đã được gửi:', info.messageId);

    } catch (error) {
      console.error('❌ Lỗi khi gửi email chào mừng:', error);
      // Không throw error vì email chào mừng không critical
    }
  }

  /**
   * Template HTML cho email chào mừng
   */
  private getWelcomeTemplate(userName: string, userType: 'user' | 'company'): string {
    const isCompany = userType === 'company';
    
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chào mừng đến với Jobify</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 10px;
        }
        .title {
            color: #374151;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
            color: #6b7280;
            font-size: 16px;
        }
        .features {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .feature-item {
            margin: 10px 0;
            padding-left: 20px;
            position: relative;
        }
        .feature-item::before {
            content: "✅";
            position: absolute;
            left: 0;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .cta-button {
            display: inline-block;
            padding: 15px 30px;
            background-color: #8b5cf6;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #9ca3af;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo" style="font-size: 32px; font-weight: bold; color: #8b5cf6; margin-bottom: 10px; text-align: center;">
                🟣 Jobify
            </div>
            <h1 class="title">Chào mừng ${isCompany ? 'công ty' : 'bạn'} đến với Jobify!</h1>
        </div>

        <div class="content">
            <p>Xin chào <strong>${userName}</strong>,</p>
            
            <p>Cảm ơn bạn đã đăng ký tài khoản ${isCompany ? 'nhà tuyển dụng' : 'ứng viên'} tại Jobify!</p>
            
            ${isCompany ? `
            <p>Với tài khoản nhà tuyển dụng, bạn có thể:</p>
            <div class="features">
                <div class="feature-item">Đăng tin tuyển dụng không giới hạn</div>
                <div class="feature-item">Quản lý hồ sơ ứng viên</div>
                <div class="feature-item">Tìm kiếm ứng viên phù hợp</div>
                <div class="feature-item">Xây dựng thương hiệu tuyển dụng</div>
            </div>
            ` : `
            <p>Với tài khoản ứng viên, bạn có thể:</p>
            <div class="features">
                <div class="feature-item">Tìm kiếm hàng ngàn việc làm</div>
                <div class="feature-item">Tạo hồ sơ chuyên nghiệp</div>
                <div class="feature-item">Ứng tuyển nhanh chóng</div>
                <div class="feature-item">Nhận thông báo việc làm phù hợp</div>
            </div>
            `}
        </div>

        <div class="button-container">
            <a href="${process.env.FRONTEND_URL}" class="cta-button" style="display: inline-block; padding: 15px 30px; background-color: #8b5cf6; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                🚀 Bắt đầu ngay
            </a>
        </div>

        <div class="footer">
            <p>
                <strong>Jobify</strong> - Nền tảng tìm việc hàng đầu Việt Nam<br>
                Chúc bạn thành công trong hành trình ${isCompany ? 'tuyển dụng' : 'tìm việc'}!
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
}