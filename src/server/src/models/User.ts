import { User, CreateUserDTO, UpdateUserDTO } from '@/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * User Model - Quản lý thông tin người dùng
 */
export class UserModel {
  // Map từ database row sang User object
  static fromRow(row: RowDataPacket): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      idProvince: row.idProvince,
      provinceName: row.provinceName,        // Từ JOIN với provinces table
      provinceFullName: row.provinceFullName, // Từ JOIN với provinces table
      phone: row.phone,
      avatarPic: row.avatarPic,
      birthDay: row.birthDay ? new Date(row.birthDay) : undefined,
      intro: row.intro,
      linkSocial: row.linkSocial,
      sex: row.sex,
    };
  }

  // Map từ User object sang database values
  static toRow(user: User | CreateUserDTO | UpdateUserDTO): any {
    const row: any = {};

    if ('id' in user && user.id) row.id = user.id;
    if (user.name) row.name = user.name;
    if (user.email) row.email = user.email;
    if ('password' in user && user.password) row.password = user.password;
    if (user.idProvince !== undefined) row.idProvince = user.idProvince;
    if (user.phone) row.phone = user.phone;
    if ('avatarPic' in user && user.avatarPic !== undefined) row.avatarPic = user.avatarPic;
    if ('birthDay' in user && user.birthDay !== undefined) {
      console.log('Setting birthDay:', user.birthDay); // Debug
      row.birthDay = user.birthDay;
    }
    if ('intro' in user && user.intro !== undefined) row.intro = user.intro;
    if ('linkSocial' in user && user.linkSocial !== undefined) row.linkSocial = user.linkSocial;
    if (user.sex !== undefined) row.sex = user.sex;

    return row;
  }

  // Validation functions
  static validateCreateUser(data: CreateUserDTO): string[] {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Tên phải có ít nhất 2 ký tự');
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Email không hợp lệ');
    }

    if (!data.password || data.password.length < 6) {
      errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Số điện thoại không hợp lệ');
    }

    return errors;
  }

  static validateUpdateUser(data: UpdateUserDTO): string[] {
    const errors: string[] = [];

    if (data.name && data.name.trim().length < 2) {
      errors.push('Tên phải có ít nhất 2 ký tự');
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Email không hợp lệ');
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Số điện thoại không hợp lệ');
    }

    return errors;
  }

  // Helper functions
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Utility functions để loại bỏ password khỏi response
  static sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  static sanitizeUsers(users: User[]): Omit<User, 'password'>[] {
    return users.map(user => this.sanitizeUser(user));
  }
}
