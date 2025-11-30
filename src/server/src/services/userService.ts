import { UserRepository } from '@/repositories/userRepository';
import { AppError } from '@/middlewares/errorHandler';
import { User, UpdateUserDTO, PaginationParams, PaginatedResponse } from '@/types';
import { UserModel } from '@/models/User';
import bcrypt from 'bcrypt';

/**
 * UserService - Business logic cho User operations
 */
export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getUserById(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404);
    }

    return UserModel.sanitizeUser(user);
  }

  async updateUserProfile(id: number, updateData: UpdateUserDTO): Promise<Omit<User, 'password'>> {
    // Validate input data
    const errors = UserModel.validateUpdateUser(updateData);
    if (errors.length > 0) {
      throw new AppError(`Dữ liệu không hợp lệ: ${errors.join(', ')}`, 400);
    }

    // Check if email is being updated and already exists
    if (updateData.email) {
      const emailExists = await this.userRepository.emailExists(updateData.email, id);
      if (emailExists) {
        throw new AppError('Email đã được sử dụng bởi người dùng khác', 409);
      }
    }

    // Check if phone is being updated and already exists
    if (updateData.phone) {
      const phoneExists = await this.userRepository.phoneExists(updateData.phone, id);
      if (phoneExists) {
        throw new AppError('Số điện thoại đã được sử dụng bởi người dùng khác', 409);
      }
    }

    const updatedUser = await this.userRepository.update(id, updateData);
    if (!updatedUser) {
      throw new AppError('Cập nhật thông tin thất bại', 500);
    }

    return UserModel.sanitizeUser(updatedUser);
  }

  async updateUserIntro(id: number, intro: string): Promise<Omit<User, 'password'>> {
    const updatedUser = await this.userRepository.update(id, { intro });
    if (!updatedUser) {
      throw new AppError('Cập nhật giới thiệu thất bại', 500);
    }

    return UserModel.sanitizeUser(updatedUser);
  }

  async updateUserAvatar(id: number, avatarPic: string): Promise<Omit<User, 'password'>> {
    const updatedUser = await this.userRepository.update(id, { avatarPic });
    if (!updatedUser) {
      throw new AppError('Cập nhật ảnh đại diện thất bại', 500);
    }

    return UserModel.sanitizeUser(updatedUser);
  }

  async updatePassword(id: number, currentPassword: string, newPassword: string): Promise<void> {
    // Get user with password for verification
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AppError('Mật khẩu hiện tại không chính xác', 400);
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new AppError('Mật khẩu mới phải có ít nhất 6 ký tự', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const updated = await this.userRepository.updatePassword(id, hashedPassword);
    if (!updated) {
      throw new AppError('Cập nhật mật khẩu thất bại', 500);
    }
  }

  async getAllUsers(params: PaginationParams & { search?: string; idProvince?: number }): Promise<PaginatedResponse<Omit<User, 'password'>>> {
    const result = await this.userRepository.findAll(params);
    
    return {
      ...result,
      data: UserModel.sanitizeUsers(result.data)
    };
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    newUsersThisMonth: number;
    usersByProvince: { provinceName: string; count: number }[];
  }> {
    return await this.userRepository.getStats();
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404);
    }

    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new AppError('Xóa người dùng thất bại', 500);
    }
  }

  async checkEmailExists(email: string, excludeId?: number): Promise<boolean> {
    return await this.userRepository.emailExists(email, excludeId);
  }

  async checkPhoneExists(phone: string, excludeId?: number): Promise<boolean> {
    return await this.userRepository.phoneExists(phone, excludeId);
  }
}


