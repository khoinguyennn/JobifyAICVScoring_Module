import { JobRepository } from '@/repositories/jobRepository';
import { AppError } from '@/middlewares/errorHandler';
import { Job, CreateJobDTO, UpdateJobDTO, JobQueryParams, JobWithDetails, PaginatedResponse } from '@/types';
import { JobModel } from '@/models/Job';

/**
 * JobService - Business logic cho Job operations
 */
export class JobService {
  private jobRepository: JobRepository;

  constructor() {
    this.jobRepository = new JobRepository();
  }

  async getAllJobs(params: JobQueryParams, userId?: number): Promise<PaginatedResponse<JobWithDetails>> {
    return await this.jobRepository.findAll(params, userId);
  }

  async getJobById(id: number, userId?: number): Promise<JobWithDetails | null> {
    const job = await this.jobRepository.findById(id, userId);
    if (!job) {
      throw new AppError('Không tìm thấy công việc', 404);
    }
    return job;
  }

  async createJob(jobData: CreateJobDTO): Promise<Job> {
    // Validate input data
    const errors = JobModel.validateCreateJob(jobData);
    if (errors.length > 0) {
      throw new AppError(`Dữ liệu không hợp lệ: ${errors.join(', ')}`, 400);
    }

    return await this.jobRepository.create(jobData);
  }

  async updateJob(id: number, jobData: UpdateJobDTO, companyId: number): Promise<JobWithDetails | null> {
    // Check if job exists and belongs to this company
    const existingJob = await this.jobRepository.findById(id);
    if (!existingJob) {
      throw new AppError('Không tìm thấy công việc', 404);
    }
    
    if (existingJob.idCompany !== companyId) {
      throw new AppError('Bạn không có quyền cập nhật công việc này', 403);
    }

    // Validate input data
    const errors = JobModel.validateUpdateJob(jobData);
    if (errors.length > 0) {
      throw new AppError(`Dữ liệu không hợp lệ: ${errors.join(', ')}`, 400);
    }

    return await this.jobRepository.update(id, jobData);
  }

  async deleteJob(id: number, companyId: number): Promise<void> {
    // Check if job exists and belongs to this company
    const existingJob = await this.jobRepository.findById(id);
    if (!existingJob) {
      throw new AppError('Không tìm thấy công việc', 404);
    }
    
    if (existingJob.idCompany !== companyId) {
      throw new AppError('Bạn không có quyền xóa công việc này', 403);
    }

    const deleted = await this.jobRepository.delete(id);
    if (!deleted) {
      throw new AppError('Xóa công việc thất bại', 500);
    }
  }

  async hideJob(id: number, companyId: number): Promise<void> {
    // Check if job exists and belongs to this company
    const existingJob = await this.jobRepository.findById(id);
    if (!existingJob) {
      throw new AppError('Không tìm thấy công việc', 404);
    }
    
    if (existingJob.idCompany !== companyId) {
      throw new AppError('Bạn không có quyền ẩn công việc này', 403);
    }

    // Check if job is already hidden
    if (existingJob.deletedAt) {
      throw new AppError('Công việc đã được ẩn trước đó', 400);
    }

    const hidden = await this.jobRepository.hide(id);
    if (!hidden) {
      throw new AppError('Ẩn công việc thất bại', 500);
    }
  }

  async unhideJob(id: number, companyId: number): Promise<void> {
    // Find job including hidden ones
    const existingJob = await this.jobRepository.findByIdIncludingDeleted(id);
    if (!existingJob) {
      throw new AppError('Không tìm thấy công việc', 404);
    }
    
    if (existingJob.idCompany !== companyId) {
      throw new AppError('Bạn không có quyền khôi phục công việc này', 403);
    }

    // Check if job is actually hidden
    if (!existingJob.deletedAt) {
      throw new AppError('Công việc không ở trạng thái ẩn', 400);
    }

    const unhidden = await this.jobRepository.unhide(id);
    if (!unhidden) {
      throw new AppError('Khôi phục công việc thất bại', 500);
    }
  }

  async getJobsByCompany(companyId: number, params: JobQueryParams): Promise<PaginatedResponse<JobWithDetails>> {
    return await this.jobRepository.findByCompany(companyId, params);
  }


  async getJobStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    newJobsThisMonth: number;
    jobsByField: { fieldName: string; count: number }[];
    jobsByProvince: { provinceName: string; count: number }[];
  }> {
    return await this.jobRepository.getStats();
  }

  async checkJobExists(id: number): Promise<boolean> {
    const job = await this.jobRepository.findById(id);
    return !!job && JobModel.isActive(job);
  }

  async checkCompanyOwnsJob(jobId: number, companyId: number): Promise<boolean> {
    const job = await this.jobRepository.findById(jobId);
    return !!job && job.idCompany === companyId;
  }
}

