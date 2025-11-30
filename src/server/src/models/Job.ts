import { Job, CreateJobDTO, UpdateJobDTO } from '@/types';
import { RowDataPacket } from 'mysql2';

/**
 * Job Model - Quản lý thông tin công việc
 */
export class JobModel {
  // Map từ database row sang Job object
  static fromRow(row: RowDataPacket): Job {
    return {
      id: row.id,
      idCompany: row.idCompany,
      idField: row.idField,
      idProvince: row.idProvince,
      nameJob: row.nameJob,
      request: row.request,
      desc: row.desc,
      other: row.other,
      salaryMin: row.salaryMin,
      salaryMax: row.salaryMax,
      sex: row.sex,
      typeWork: row.typeWork,
      education: row.education,
      experience: row.experience,
      createdAt: new Date(row.createdAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
    };
  }

  // Map từ Job object sang database values
  static toRow(job: Job | CreateJobDTO | UpdateJobDTO): any {
    const row: any = {};

    if ('id' in job && job.id) row.id = job.id;
    if ('idCompany' in job && job.idCompany !== undefined) row.idCompany = job.idCompany;
    if (job.idField !== undefined) row.idField = job.idField;
    if (job.idProvince !== undefined) row.idProvince = job.idProvince;
    if (job.nameJob) row.nameJob = job.nameJob;
    if (job.request) row.request = job.request;
    if (job.desc) row.desc = job.desc;
    if (job.other !== undefined) row.other = job.other;
    if (job.salaryMin !== undefined) row.salaryMin = job.salaryMin;
    if (job.salaryMax !== undefined) row.salaryMax = job.salaryMax;
    if (job.sex !== undefined) row.sex = job.sex;
    if (job.typeWork) row.typeWork = job.typeWork;
    if (job.education) row.education = job.education;
    if (job.experience) row.experience = job.experience;

    // Tự động set createdAt cho job mới
    if ('id' in job && !job.id) {
      row.createdAt = new Date();
    }

    return row;
  }

  // Validation functions
  static validateCreateJob(data: CreateJobDTO): string[] {
    const errors: string[] = [];

    if (!data.idCompany) {
      errors.push('ID công ty là bắt buộc');
    }

    if (!data.idField) {
      errors.push('Lĩnh vực công việc là bắt buộc');
    }

    if (!data.idProvince) {
      errors.push('Tỉnh/thành phố là bắt buộc');
    }

    if (!data.nameJob || data.nameJob.trim().length < 5) {
      errors.push('Tên công việc phải có ít nhất 5 ký tự');
    }

    if (!data.request || data.request.trim().length < 10) {
      errors.push('Yêu cầu công việc phải có ít nhất 10 ký tự');
    }

    if (!data.desc || data.desc.trim().length < 10) {
      errors.push('Mô tả công việc phải có ít nhất 10 ký tự');
    }

    if (!data.typeWork) {
      errors.push('Loại hình công việc là bắt buộc');
    }

    if (!data.education) {
      errors.push('Trình độ học vấn là bắt buộc');
    }

    if (!data.experience) {
      errors.push('Kinh nghiệm làm việc là bắt buộc');
    }

    // Validate salary
    if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
      if (data.salaryMin < 0) {
        errors.push('Mức lương tối thiểu không thể âm');
      }
      if (data.salaryMax < 0) {
        errors.push('Mức lương tối đa không thể âm');
      }
      if (data.salaryMin > data.salaryMax) {
        errors.push('Mức lương tối thiểu không thể lớn hơn mức lương tối đa');
      }
    }

    return errors;
  }

  static validateUpdateJob(data: UpdateJobDTO): string[] {
    const errors: string[] = [];

    if (data.nameJob && data.nameJob.trim().length < 5) {
      errors.push('Tên công việc phải có ít nhất 5 ký tự');
    }

    if (data.request && data.request.trim().length < 10) {
      errors.push('Yêu cầu công việc phải có ít nhất 10 ký tự');
    }

    if (data.desc && data.desc.trim().length < 10) {
      errors.push('Mô tả công việc phải có ít nhất 10 ký tự');
    }

    // Validate salary
    if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
      if (data.salaryMin < 0) {
        errors.push('Mức lương tối thiểu không thể âm');
      }
      if (data.salaryMax < 0) {
        errors.push('Mức lương tối đa không thể âm');
      }
      if (data.salaryMin > data.salaryMax) {
        errors.push('Mức lương tối thiểu không thể lớn hơn mức lương tối đa');
      }
    }

    return errors;
  }

  // Helper functions
  static formatSalary(salaryMin?: number, salaryMax?: number): string {
    if (!salaryMin && !salaryMax) return 'Thỏa thuận';
    
    const formatNumber = (num: number): string => {
      return new Intl.NumberFormat('vi-VN').format(num);
    };

    if (salaryMin && salaryMax) {
      return `${formatNumber(salaryMin)} - ${formatNumber(salaryMax)} VNĐ`;
    } else if (salaryMin) {
      return `Từ ${formatNumber(salaryMin)} VNĐ`;
    } else if (salaryMax) {
      return `Lên tới ${formatNumber(salaryMax)} VNĐ`;
    }

    return 'Thỏa thuận';
  }

  // Validation cho các enum values
  static validateSex(sex: string): boolean {
    const validSex = ['Nam', 'Nữ', 'Không yêu cầu'];
    return validSex.includes(sex);
  }

  static validateTypeWork(typeWork: string): boolean {
    const validTypes = [
      'Toàn thời gian',
      'Bán thời gian', 
      'Thực tập',
      'Freelance',
      'Hợp đồng'
    ];
    return validTypes.includes(typeWork);
  }

  static validateEducation(education: string): boolean {
    const validEducation = [
      'Không yêu cầu',
      'Trung học phổ thông',
      'Trung cấp',
      'Cao đẳng',
      'Đại học',
      'Thạc sĩ',
      'Tiến sĩ'
    ];
    return validEducation.includes(education);
  }

  static validateExperience(experience: string): boolean {
    const validExperience = [
      'Không yêu cầu',
      'Dưới 1 năm',
      '1-2 năm',
      '2-5 năm',
      '5-10 năm',
      'Trên 10 năm'
    ];
    return validExperience.includes(experience);
  }

  // Utility function để check job còn active không
  static isActive(job: Job): boolean {
    return !job.deletedAt;
  }

  // Get job age in days
  static getJobAge(job: Job): number {
    const now = new Date();
    const created = new Date(job.createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

