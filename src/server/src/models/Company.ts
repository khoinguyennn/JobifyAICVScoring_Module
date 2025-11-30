import { Company, CreateCompanyDTO, UpdateCompanyDTO } from '@/types';
import { RowDataPacket } from 'mysql2';

/**
 * Company Model - Quản lý thông tin công ty
 */
export class CompanyModel {
  // Map từ database row sang Company object
  static fromRow(row: RowDataPacket): Company {
    return {
      id: row.id,
      nameCompany: row.nameCompany,
      nameAdmin: row.nameAdmin,
      email: row.email,
      password: row.password,
      avatarPic: row.avatarPic,
      phone: row.phone,
      idProvince: row.idProvince,
      intro: row.intro,
      scale: row.scale,
      web: row.web,
    };
  }

  // Map từ Company object sang database values
  static toRow(company: Company | CreateCompanyDTO | UpdateCompanyDTO): any {
    const row: any = {};

    if ('id' in company && company.id) row.id = company.id;
    if (company.nameCompany) row.nameCompany = company.nameCompany;
    if (company.nameAdmin) row.nameAdmin = company.nameAdmin;
    if (company.email) row.email = company.email;
    if (company.password) row.password = company.password;
    if (company.avatarPic !== undefined) row.avatarPic = company.avatarPic;
    if (company.phone) row.phone = company.phone;
    if (company.idProvince !== undefined) row.idProvince = company.idProvince;
    if (company.intro !== undefined) row.intro = company.intro;
    if (company.scale !== undefined) row.scale = company.scale;
    if (company.web !== undefined) row.web = company.web;

    return row;
  }

  // Validation functions
  static validateCreateCompany(data: CreateCompanyDTO): string[] {
    const errors: string[] = [];

    if (!data.nameCompany || data.nameCompany.trim().length < 2) {
      errors.push('Tên công ty phải có ít nhất 2 ký tự');
    }

    if (!data.nameAdmin || data.nameAdmin.trim().length < 2) {
      errors.push('Tên người quản lý phải có ít nhất 2 ký tự');
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Email không hợp lệ');
    }

    if (!data.password || data.password.length < 6) {
      errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }

    if (!data.phone || !this.isValidPhone(data.phone)) {
      errors.push('Số điện thoại không hợp lệ');
    }

    // idProvince is now optional - no validation needed

    if (data.web && !this.isValidUrl(data.web)) {
      errors.push('Website không hợp lệ');
    }

    return errors;
  }

  static validateUpdateCompany(data: UpdateCompanyDTO): string[] {
    const errors: string[] = [];

    if (data.nameCompany && data.nameCompany.trim().length < 2) {
      errors.push('Tên công ty phải có ít nhất 2 ký tự');
    }

    if (data.nameAdmin && data.nameAdmin.trim().length < 2) {
      errors.push('Tên người quản lý phải có ít nhất 2 ký tự');
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Số điện thoại không hợp lệ');
    }

    if (data.web && !this.isValidUrl(data.web)) {
      errors.push('Website không hợp lệ');
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

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Utility function để loại bỏ password khỏi response
  static sanitizeCompany(company: Company): Omit<Company, 'password'> {
    const { password, ...sanitizedCompany } = company;
    return sanitizedCompany;
  }

  static sanitizeCompanies(companies: Company[]): Omit<Company, 'password'>[] {
    return companies.map(company => this.sanitizeCompany(company));
  }

  // Scale validation
  static validateScale(scale: string): boolean {
    const validScales = [
      '1-10 nhân viên',
      '11-50 nhân viên', 
      '51-100 nhân viên',
      '101-500 nhân viên',
      '501-1000 nhân viên',
      'Trên 1000 nhân viên'
    ];
    return validScales.includes(scale);
  }
}


