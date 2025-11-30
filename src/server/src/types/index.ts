import { Request } from 'express';

// Base response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination interface
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth interfaces
export interface JWTPayload {
  id: number;
  email: string;
  userType: 'user' | 'company';
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// Database entities (tương ứng với CSDL.txt)
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  idProvince?: number;
  provinceName?: string;      // Tên tỉnh từ JOIN với provinces table
  provinceFullName?: string;  // Tên đầy đủ tỉnh từ JOIN với provinces table
  phone: string;
  avatarPic?: string;
  birthDay?: Date;
  intro?: string;
  linkSocial?: string;
  sex?: 'Nam' | 'Nữ' | 'Khác';
  resetToken?: string;
  resetTokenExpiry?: Date;
}

export interface Company {
  id: number;
  nameCompany: string;
  nameAdmin: string;
  email: string;
  password: string;
  avatarPic?: string;
  phone: string;
  idProvince?: number;  // Optional - có thể null trong database
  intro?: string;
  scale?: string;
  web?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
}

// Company with job count for API responses
export interface CompanyWithJobCount extends Omit<Company, 'password'> {
  jobCount: number;
  provinceName?: string;
  provinceFullName?: string;
}

export interface Job {
  id: number;
  idCompany: number;
  idField: number;
  idProvince: number;
  nameJob: string;
  request: string;
  desc: string;
  other?: string;
  salaryMin?: number;
  salaryMax?: number;
  sex?: 'Nam' | 'Nữ' | 'Không yêu cầu';
  typeWork: string;
  education: string;
  experience: string;
  createdAt: Date;
  deletedAt?: Date;
}

export interface ApplyJob {
  id: number;
  idUser: number;
  idJob: number;
  name: string;
  email: string;
  phone: string;
  status: number; // 0: pending, 1: approved, 2: rejected
  letter?: string;
  cv?: string;
  createdAt: Date;
  deletedAt?: Date;
}

export interface Province {
  id: number;
  name: string;
  nameWithType: string;
}

// Province with job count for API responses
export interface ProvinceWithJobCount extends Province {
  jobCount: number;
}

export interface Field {
  id: number;
  name: string;
  typeField: string;
}

// Field with job count for API responses
export interface FieldWithJobCount extends Field {
  jobCount: number;
}

export interface SaveJob {
  id: number;
  idUser: number;
  idJob: number;
  createdAt: Date;
}

export interface FollowCompany {
  id: number;
  idUser: number;
  idCompany: number;
  createdAt: Date;
}

export interface Notification {
  id: number;
  idUser?: number;
  idCompany?: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  deletedAt?: Date;
}

// DTOs cho request/response
export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  idProvince?: number;
  phone?: string;
  sex?: 'Nam' | 'Nữ' | 'Khác';
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  idProvince?: number;
  phone?: string;
  avatarPic?: string;
  birthDay?: Date;
  intro?: string;
  linkSocial?: string;
  sex?: 'Nam' | 'Nữ' | 'Khác';
}

export interface CreateCompanyDTO {
  nameCompany: string;
  nameAdmin: string;
  email: string;
  password: string;
  phone: string;
  idProvince?: number;  // Không bắt buộc
  intro?: string;
  scale?: string;
  web?: string;
}

export interface UpdateCompanyDTO {
  nameCompany?: string;
  nameAdmin?: string;
  avatarPic?: string;
  phone?: string;
  idProvince?: number;
  intro?: string;
  scale?: string;
  web?: string;
}

export interface CreateJobDTO {
  idCompany: number;
  idField: number;
  idProvince: number;
  nameJob: string;
  request: string;
  desc: string;
  other?: string;
  salaryMin?: number;
  salaryMax?: number;
  sex?: 'Nam' | 'Nữ' | 'Không yêu cầu';
  typeWork: string;
  education: string;
  experience: string;
}

export interface UpdateJobDTO {
  idField?: number;
  idProvince?: number;
  nameJob?: string;
  request?: string;
  desc?: string;
  other?: string;
  salaryMin?: number;
  salaryMax?: number;
  sex?: 'Nam' | 'Nữ' | 'Không yêu cầu';
  typeWork?: string;
  education?: string;
  experience?: string;
}

export interface ApplyJobDTO {
  idUser: number;
  idJob: number;
  name: string;
  email: string;
  phone: string;
  letter?: string;
  cv?: string;
}

export interface CreateSaveJobDTO {
  idUser: number;
  idJob: number;
}

export interface SaveJobQueryParams {
  page?: number;
  limit?: number;
  idField?: number;
  idProvince?: number;
  search?: string;
  sortBy?: 'createdAt' | 'nameJob';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateFollowCompanyDTO {
  idUser: number;
  idCompany: number;
}

export interface FollowCompanyQueryParams {
  page?: number;
  limit?: number;
  idProvince?: number;
  search?: string;
  sortBy?: 'createdAt' | 'nameCompany';
  sortOrder?: 'ASC' | 'DESC';
}

// Query interfaces
export interface JobQueryParams {
  page?: number;
  limit?: number;
  idField?: number;
  idProvince?: number;
  salaryMin?: number;
  salaryMax?: number;
  typeWork?: string;
  education?: string;
  experience?: string;
  search?: string;
  sortBy?: 'createdAt' | 'salary' | 'company';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CompanyQueryParams {
  page?: number;
  limit?: number;
  idProvince?: number;
  search?: string;
  sortBy?: 'nameCompany' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

// Response với populate data
export interface JobWithDetails extends Job {
  company?: Company;
  field?: Field;
  province?: Province;
  appliedCount?: number;
  isApplied?: boolean;
  isSaved?: boolean;
}

export interface CompanyWithDetails extends Company {
  province?: Province;
  jobCount?: number;
  isFollowed?: boolean;
}

export interface SaveJobWithDetails extends SaveJob {
  job?: JobWithDetails;
}

export interface FollowCompanyWithDetails extends FollowCompany {
  company?: CompanyWithDetails;
}

// Enum types
export enum ApplyStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2
}

export enum NotificationType {
  JOB_APPLICATION = 'job_application',
  COMPANY_FOLLOW = 'company_follow',
  JOB_APPROVED = 'job_approved',
  JOB_REJECTED = 'job_rejected',
  NEW_JOB_POSTED = 'new_job_posted'
}

export enum UserType {
  USER = 'user',
  COMPANY = 'company'
}

// CV Scoring Types
export interface CVScoringRequest {
  cvFile: Express.Multer.File;
  jobId: number;
}

export interface CVScoringResult {
  score: number;
  suggestions: string[];
  analysis: {
    strengths: string[];
    weaknesses: string[];
    matchingSkills: string[];
    missingSkills: string[];
  };
  jobMatch: {
    jobTitle: string;
    companyName: string;
    requirements: string[];
  };
}

export interface CVAnalysis {
  extractedText: string;
  skills: string[];
  experience: string;
  education: string;
  keyPoints: string[];
}
