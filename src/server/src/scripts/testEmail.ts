import dotenv from 'dotenv';
import { EmailService } from '../services/emailService';

// Load environment variables
dotenv.config();

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');

  // Kiểm tra environment variables
  console.log('📋 Environment Variables:');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`);
  console.log(`EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set'}`);
  console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Thiếu cấu hình email. Vui lòng kiểm tra file .env');
    console.log('📖 Xem hướng dẫn tại: EMAIL_SETUP.md');
    process.exit(1);
  }

  const emailService = new EmailService();

  try {
    // Test 1: Kiểm tra kết nối
    console.log('🔌 Test 1: Kiểm tra kết nối SMTP...');
    const isConnected = await emailService.verifyConnection();
    
    if (!isConnected) {
      console.error('❌ Không thể kết nối đến Gmail SMTP');
      process.exit(1);
    }

    // Test 2: Gửi email khôi phục mật khẩu
    console.log('\n📧 Test 2: Gửi email khôi phục mật khẩu...');
    const testEmail = process.env.EMAIL_USER; // Gửi đến chính email của mình
    const resetToken = 'test_token_' + Date.now();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    await emailService.sendResetPasswordEmail(
      testEmail!,
      'Test User',
      resetUrl
    );

    console.log('\n✅ Test email khôi phục mật khẩu đã pass! Email service hoạt động bình thường.');
    console.log('📬 Vui lòng kiểm tra hộp thư email của bạn.');
    console.log('📁 Nếu không thấy email, hãy kiểm tra thư mục Spam/Junk.');

  } catch (error) {
    console.error('\n❌ Test thất bại:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Kiểm tra EMAIL_USER và EMAIL_PASSWORD trong .env');
    console.log('2. Đảm bảo sử dụng App Password, không phải mật khẩu Gmail thường');
    console.log('3. Kiểm tra kết nối internet');
    console.log('4. Xem hướng dẫn chi tiết tại: EMAIL_SETUP.md');
    process.exit(1);
  }
}

// Chạy test
testEmailService().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
