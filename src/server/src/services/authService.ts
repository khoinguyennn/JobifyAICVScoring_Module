import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '@/repositories/authRepository';
import { AppError } from '@/middlewares/errorHandler';
import { User, Company, JWTPayload } from '@/types';
import { EmailService } from './emailService';

export class AuthService {
  private authRepository: AuthRepository;
  private emailService: EmailService;

  constructor() {
    this.authRepository = new AuthRepository();
    this.emailService = new EmailService();
  }

  // ===== USER AUTHENTICATION =====

  async loginUser(email: string, password: string): Promise<{ user: Omit<User, 'password'>, token: string }> {
    // Tìm user theo email
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throw new AppError('Email không tồn tại', 404);
    }

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Mật khẩu không chính xác', 401);
    }

    // Tạo JWT token
    const token = this.generateToken(user.id, user.email, 'user');

    // Loại bỏ password khỏi response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async registerUser(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    idProvince?: number;
  }): Promise<{ user: Omit<User, 'password'>, token: string }> {
    // Kiểm tra email đã tồn tại
    const existingUser = await this.authRepository.findUserByEmail(userData.email);
    if (existingUser) {
      throw new AppError('Email đã được sử dụng', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Tạo user mới
    const userId = await this.authRepository.createUser({
      ...userData,
      password: hashedPassword,
    });

    // Lấy thông tin user vừa tạo
    const newUser = await this.authRepository.findUserById(userId);
    if (!newUser) {
      throw new AppError('Lỗi tạo tài khoản', 500);
    }

    // Tạo token
    const token = this.generateToken(newUser.id, newUser.email, 'user');

    // Loại bỏ password
    const { password: _, ...userWithoutPassword } = newUser;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async changeUserPassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    // Tìm user
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404);
    }

    // Kiểm tra mật khẩu cũ
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new AppError('Mật khẩu cũ không chính xác', 401);
    }

    // Hash mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu
    const updated = await this.authRepository.updateUserPassword(userId, hashedNewPassword);
    if (!updated) {
      throw new AppError('Cập nhật mật khẩu thất bại', 500);
    }
  }

  // ===== COMPANY AUTHENTICATION =====

  async loginCompany(email: string, password: string): Promise<{ company: Omit<Company, 'password'>, token: string }> {
    // Tìm company theo email
    const company = await this.authRepository.findCompanyByEmail(email);
    if (!company) {
      throw new AppError('Email không tồn tại', 404);
    }

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(password, company.password);
    if (!isPasswordValid) {
      throw new AppError('Mật khẩu không chính xác', 401);
    }

    // Tạo JWT token
    const token = this.generateToken(company.id, company.email, 'company');

    // Loại bỏ password khỏi response
    const { password: _, ...companyWithoutPassword } = company;

    return {
      company: companyWithoutPassword,
      token,
    };
  }

  async registerCompany(companyData: {
    nameCompany: string;
    nameAdmin: string;
    email: string;
    password: string;
    phone: string;
    idProvince: number;
    scale?: string;
  }): Promise<{ company: Omit<Company, 'password'>, token: string }> {
    // Kiểm tra email đã tồn tại
    const existingCompany = await this.authRepository.findCompanyByEmail(companyData.email);
    if (existingCompany) {
      throw new AppError('Email đã được sử dụng', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(companyData.password, 10);

    // Tạo company mới
    const companyId = await this.authRepository.createCompany({
      ...companyData,
      password: hashedPassword,
    });

    // Lấy thông tin company vừa tạo
    const newCompany = await this.authRepository.findCompanyById(companyId);
    if (!newCompany) {
      throw new AppError('Lỗi tạo tài khoản công ty', 500);
    }

    // Tạo token
    const token = this.generateToken(newCompany.id, newCompany.email, 'company');

    // Loại bỏ password
    const { password: _, ...companyWithoutPassword } = newCompany;

    return {
      company: companyWithoutPassword,
      token,
    };
  }

  async changeCompanyPassword(companyId: number, oldPassword: string, newPassword: string): Promise<void> {
    // Tìm company
    const company = await this.authRepository.findCompanyById(companyId);
    if (!company) {
      throw new AppError('Công ty không tồn tại', 404);
    }

    // Kiểm tra mật khẩu cũ
    const isOldPasswordValid = await bcrypt.compare(oldPassword, company.password);
    if (!isOldPasswordValid) {
      throw new AppError('Mật khẩu cũ không chính xác', 401);
    }

    // Hash mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu
    const updated = await this.authRepository.updateCompanyPassword(companyId, hashedNewPassword);
    if (!updated) {
      throw new AppError('Cập nhật mật khẩu thất bại', 500);
    }
  }

  // ===== UTILITIES =====

  private generateToken(id: number, email: string, userType: 'user' | 'company'): string {
    const payload: JWTPayload = { id, email, userType };
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!secret) {
      throw new AppError('JWT secret không được cấu hình', 500);
    }

    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError('JWT secret không được cấu hình', 500);
    }

    try {
      return jwt.verify(token, secret) as JWTPayload;
    } catch (error) {
      throw new AppError('Token không hợp lệ', 401);
    }
  }

  // ===== PASSWORD RESET =====

  async forgotPassword(email: string): Promise<void> {
    // Tìm user theo email
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throw new AppError('Email không tồn tại trong hệ thống', 404);
    }

    // Tạo reset token
    const resetToken = this.generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    // Lưu token vào database
    await this.authRepository.saveResetToken(user.id, resetToken, resetTokenExpiry);

    // Gửi email khôi phục mật khẩu
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    try {
      await this.emailService.sendResetPasswordEmail(email, user.name, resetUrl);
    } catch (emailError) {
      // Log lỗi nhưng không throw để không block user experience
      console.error('Lỗi khi gửi email khôi phục:', emailError);
      
      // Fallback: Log thông tin để admin có thể hỗ trợ manual
      console.log('=== FALLBACK: EMAIL KHÔI PHỤC MẬT KHẨU ===');
      console.log(`Gửi đến: ${email}`);
      console.log(`Tên: ${user.name}`);
      console.log(`Link khôi phục: ${resetUrl}`);
      console.log(`Token hết hạn sau: 15 phút`);
      console.log('==========================================');
      
      // Vẫn throw error để user biết có vấn đề
      throw new AppError('Không thể gửi email khôi phục. Vui lòng thử lại sau.', 500);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Tìm user theo reset token
    const user = await this.authRepository.findUserByResetToken(token);
    if (!user) {
      throw new AppError('Token khôi phục không hợp lệ hoặc đã hết hạn', 400);
    }

    // Kiểm tra token expiry
    if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
      throw new AppError('Token khôi phục đã hết hạn', 400);
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu và xóa reset token
    await this.authRepository.updatePasswordAndClearToken(user.id, hashedPassword);
  }

  private generateResetToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  // ===== COMPANY PASSWORD RESET =====

  async forgotCompanyPassword(email: string): Promise<void> {
    // Tìm company theo email
    const company = await this.authRepository.findCompanyByEmail(email);
    if (!company) {
      throw new AppError('Email không tồn tại trong hệ thống', 404);
    }

    // Tạo reset token
    const resetToken = this.generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    // Lưu token vào database
    await this.authRepository.saveCompanyResetToken(company.id, resetToken, resetTokenExpiry);

    // Gửi email khôi phục mật khẩu
    const resetUrl = `${process.env.FRONTEND_URL}/employer/reset-password/${resetToken}`;
    
    try {
      await this.emailService.sendResetPasswordEmail(email, company.nameCompany, resetUrl);
    } catch (emailError) {
      // Log lỗi nhưng không throw để không block user experience
      console.error('Lỗi khi gửi email khôi phục cho company:', emailError);
      
      // Fallback: Log thông tin để admin có thể hỗ trợ manual
      console.log('=== FALLBACK: EMAIL KHÔI PHỤC MẬT KHẨU COMPANY ===');
      console.log(`Gửi đến: ${email}`);
      console.log(`Tên công ty: ${company.nameCompany}`);
      console.log(`Link khôi phục: ${resetUrl}`);
      console.log(`Token hết hạn sau: 15 phút`);
      console.log('===============================================');
      
      // Vẫn throw error để user biết có vấn đề
      throw new AppError('Không thể gửi email khôi phục. Vui lòng thử lại sau.', 500);
    }
  }

  async resetCompanyPassword(token: string, newPassword: string): Promise<void> {
    // Tìm company theo reset token
    const company = await this.authRepository.findCompanyByResetToken(token);
    if (!company) {
      throw new AppError('Token khôi phục không hợp lệ hoặc đã hết hạn', 400);
    }

    // Kiểm tra token expiry
    if (company.resetTokenExpiry && new Date() > company.resetTokenExpiry) {
      throw new AppError('Token khôi phục đã hết hạn', 400);
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu và xóa reset token
    await this.authRepository.updateCompanyPasswordAndClearToken(company.id, hashedPassword);
  }
}
