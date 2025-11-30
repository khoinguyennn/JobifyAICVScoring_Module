import { SaveJob } from '@/types';
import { RowDataPacket } from 'mysql2';

/**
 * SaveJob Model - Quản lý thông tin công việc đã lưu
 */
export class SaveJobModel {
  // Map từ database row sang SaveJob object
  static fromRow(row: RowDataPacket): SaveJob {
    return {
      id: row.id,
      idUser: row.idUser,
      idJob: row.idJob,
      createdAt: new Date(row.createdAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
    };
  }

  // Map từ SaveJob object sang database values
  static toRow(saveJob: SaveJob | { idUser: number; idJob: number }): any {
    const row: any = {};

    if ('id' in saveJob && saveJob.id) row.id = saveJob.id;
    if (saveJob.idUser) row.idUser = saveJob.idUser;
    if (saveJob.idJob) row.idJob = saveJob.idJob;

    // Tự động set createdAt cho bản ghi mới
    if (!('id' in saveJob) || !saveJob.id) {
      row.createdAt = new Date();
    }

    return row;
  }

  // Validation functions
  static validateSaveJob(data: { idUser: number; idJob: number }): string[] {
    const errors: string[] = [];

    if (!data.idUser) {
      errors.push('ID người dùng là bắt buộc');
    }

    if (!data.idJob) {
      errors.push('ID công việc là bắt buộc');
    }

    return errors;
  }

  // Utility functions
  static isActive(saveJob: SaveJob): boolean {
    return !saveJob.deletedAt;
  }

  // Check if user has saved this job
  static hasUserSavedJob(savedJobs: SaveJob[], userId: number, jobId: number): boolean {
    return savedJobs.some(save => 
      save.idUser === userId && 
      save.idJob === jobId && 
      this.isActive(save)
    );
  }

  // Get save age in days
  static getSaveAge(saveJob: SaveJob): number {
    const now = new Date();
    const created = new Date(saveJob.createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get recent saves (within last N days)
  static getRecent(savedJobs: SaveJob[], days: number = 7): SaveJob[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return savedJobs.filter(save => 
      new Date(save.createdAt) >= cutoffDate && this.isActive(save)
    );
  }

  // Get saves by user
  static getByUser(savedJobs: SaveJob[], userId: number): SaveJob[] {
    return savedJobs.filter(save => 
      save.idUser === userId && this.isActive(save)
    );
  }

  // Get saves by job
  static getByJob(savedJobs: SaveJob[], jobId: number): SaveJob[] {
    return savedJobs.filter(save => 
      save.idJob === jobId && this.isActive(save)
    );
  }

  // Count saves for a job
  static countSavesForJob(savedJobs: SaveJob[], jobId: number): number {
    return this.getByJob(savedJobs, jobId).length;
  }

  // Count saves by user
  static countSavesByUser(savedJobs: SaveJob[], userId: number): number {
    return this.getByUser(savedJobs, userId).length;
  }

  // Get most saved jobs (returns job IDs sorted by save count)
  static getMostSavedJobs(savedJobs: SaveJob[], limit: number = 10): { jobId: number; saveCount: number }[] {
    const jobSaveCounts = new Map<number, number>();

    // Count saves for each job
    savedJobs
      .filter(save => this.isActive(save))
      .forEach(save => {
        const currentCount = jobSaveCounts.get(save.idJob) || 0;
        jobSaveCounts.set(save.idJob, currentCount + 1);
      });

    // Convert to array and sort by count
    return Array.from(jobSaveCounts.entries())
      .map(([jobId, saveCount]) => ({ jobId, saveCount }))
      .sort((a, b) => b.saveCount - a.saveCount)
      .slice(0, limit);
  }
}


