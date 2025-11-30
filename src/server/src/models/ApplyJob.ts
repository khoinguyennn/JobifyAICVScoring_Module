import { ApplyJob, ApplyJobDTO, ApplyStatus } from '@/types';
import { RowDataPacket } from 'mysql2';

/**
 * ApplyJob Model - Quản lý thông tin ứng tuyển công việc
 */
export class ApplyJobModel {
  // Map từ database row sang ApplyJob object
  static fromRow(row: RowDataPacket): ApplyJob {
    return {
      id: row.id,
      idUser: row.idUser,
      idJob: row.idJob,
      name: row.name,
      email: row.email,
      phone: row.phone,
      status: row.status,
      letter: row.letter,
      cv: row.cv,
      createdAt: new Date(row.createdAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
    };
  }

  // Map từ ApplyJob object sang database values
  static toRow(applyJob: ApplyJob | ApplyJobDTO): any {
    const row: any = {};

    if ('id' in applyJob && applyJob.id) row.id = applyJob.id;
    if (applyJob.idUser) row.idUser = applyJob.idUser;
    if (applyJob.idJob) row.idJob = applyJob.idJob;
    if (applyJob.name) row.name = applyJob.name;
    if (applyJob.email) row.email = applyJob.email;
    if (applyJob.phone) row.phone = applyJob.phone;
    if ('status' in applyJob) row.status = applyJob.status;
    if (applyJob.letter !== undefined) row.letter = applyJob.letter;
    if (applyJob.cv !== undefined) row.cv = applyJob.cv;

    // Tự động set createdAt và status cho đơn ứng tuyển mới
    if (!('id' in applyJob) || !applyJob.id) {
      row.createdAt = new Date();
      row.status = row.status || ApplyStatus.PENDING;
    }

    return row;
  }

  // Validation functions
  static validateApplyJob(data: ApplyJobDTO): string[] {
    const errors: string[] = [];

    if (!data.idUser) {
      errors.push('ID người dùng là bắt buộc');
    }

    if (!data.idJob) {
      errors.push('ID công việc là bắt buộc');
    }

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Tên phải có ít nhất 2 ký tự');
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Email không hợp lệ');
    }

    if (!data.phone || !this.isValidPhone(data.phone)) {
      errors.push('Số điện thoại không hợp lệ');
    }

    if (data.letter && data.letter.length > 10000) {
      errors.push('Thư xin việc không được vượt quá 10.000 ký tự');
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

  // Status helper functions
  static getStatusText(status: ApplyStatus): string {
    switch (status) {
      case ApplyStatus.PENDING:
        return 'Đang chờ duyệt';
      case ApplyStatus.APPROVED:
        return 'Đã duyệt';
      case ApplyStatus.REJECTED:
        return 'Đã từ chối';
      default:
        return 'Không xác định';
    }
  }

  static getStatusColor(status: ApplyStatus): string {
    switch (status) {
      case ApplyStatus.PENDING:
        return 'warning';
      case ApplyStatus.APPROVED:
        return 'success';
      case ApplyStatus.REJECTED:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  static isValidStatus(status: number): boolean {
    return Object.values(ApplyStatus).includes(status);
  }

  // Utility functions
  static isPending(applyJob: ApplyJob): boolean {
    return applyJob.status === ApplyStatus.PENDING;
  }

  static isApproved(applyJob: ApplyJob): boolean {
    return applyJob.status === ApplyStatus.APPROVED;
  }

  static isRejected(applyJob: ApplyJob): boolean {
    return applyJob.status === ApplyStatus.REJECTED;
  }

  static isActive(applyJob: ApplyJob): boolean {
    return !applyJob.deletedAt;
  }

  // Get apply age in days
  static getApplyAge(applyJob: ApplyJob): number {
    const now = new Date();
    const created = new Date(applyJob.createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Check if user has already applied for this job
  static hasUserApplied(applications: ApplyJob[], userId: number, jobId: number): boolean {
    return applications.some(app => 
      app.idUser === userId && 
      app.idJob === jobId && 
      this.isActive(app)
    );
  }

  // Get applications by status
  static getByStatus(applications: ApplyJob[], status: ApplyStatus): ApplyJob[] {
    return applications.filter(app => app.status === status && this.isActive(app));
  }

  // Get recent applications (within last N days)
  static getRecent(applications: ApplyJob[], days: number = 7): ApplyJob[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return applications.filter(app => 
      new Date(app.createdAt) >= cutoffDate && this.isActive(app)
    );
  }
}


