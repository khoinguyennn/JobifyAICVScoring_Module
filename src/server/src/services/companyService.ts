import { CompanyRepository } from '@/repositories/companyRepository';
import { AppError } from '@/middlewares/errorHandler';
import { Company, CompanyWithJobCount, PaginatedResponse } from '@/types';

export class CompanyService {
  private companyRepository: CompanyRepository;

  constructor() {
    this.companyRepository = new CompanyRepository();
  }

  async getCompanyById(id: number): Promise<Omit<Company, 'password'>> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new AppError('Công ty không tồn tại', 404);
    }

    // Remove password from response
    const { password, ...companyWithoutPassword } = company;
    return companyWithoutPassword;
  }

  async getAllCompanies(
    page: number = 1, 
    limit: number = 10,
    searchParams?: {
      keyword?: string;
      province?: number;
      scale?: string;
    }
  ): Promise<PaginatedResponse<CompanyWithJobCount>> {
    const { companies, total } = await this.companyRepository.findAll(page, limit, searchParams);
    
    // Companies already don't have password (CompanyWithJobCount extends Omit<Company, 'password'>)
    // and jobCount is already included
    const totalPages = Math.ceil(total / limit);

    return {
      data: companies,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async updateCompanyProfile(
    id: number, 
    updateData: {
      nameCompany?: string;
      nameAdmin?: string;
      email?: string;
      phone?: string;
      idProvince?: number;
      web?: string;
      scale?: string;
    }
  ): Promise<Omit<Company, 'password'>> {
    // Check if email is being updated and already exists
    if (updateData.email) {
      const existingCompany = await this.companyRepository.findByEmail(updateData.email);
      if (existingCompany && existingCompany.id !== id) {
        throw new AppError('Email đã được sử dụng', 409);
      }
    }

    const updated = await this.companyRepository.updateProfile(id, updateData);
    if (!updated) {
      throw new AppError('Cập nhật thông tin thất bại', 500);
    }

    // Return updated company data
    return await this.getCompanyById(id);
  }

  async updateCompanyIntro(id: number, intro: string): Promise<void> {
    const updated = await this.companyRepository.updateIntro(id, intro);
    if (!updated) {
      throw new AppError('Cập nhật giới thiệu thất bại', 500);
    }
  }

  async updateCompanyAvatar(id: number, avatarPic: string): Promise<void> {
    const updated = await this.companyRepository.updateAvatar(id, avatarPic);
    if (!updated) {
      throw new AppError('Cập nhật logo công ty thất bại', 500);
    }
  }
}



















