import { FollowCompany } from '@/types';
import { RowDataPacket } from 'mysql2';

/**
 * FollowCompany Model - Quản lý thông tin theo dõi công ty
 */
export class FollowCompanyModel {
  // Map từ database row sang FollowCompany object
  static fromRow(row: RowDataPacket): FollowCompany {
    return {
      id: row.id,
      idUser: row.idUser,
      idCompany: row.idCompany,
      createdAt: new Date(row.createdAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
    };
  }

  // Map từ FollowCompany object sang database values
  static toRow(followCompany: FollowCompany | { idUser: number; idCompany: number }): any {
    const row: any = {};

    if ('id' in followCompany && followCompany.id) row.id = followCompany.id;
    if (followCompany.idUser) row.idUser = followCompany.idUser;
    if (followCompany.idCompany) row.idCompany = followCompany.idCompany;

    // Tự động set createdAt cho bản ghi mới
    if (!('id' in followCompany) || !followCompany.id) {
      row.createdAt = new Date();
    }

    return row;
  }

  // Validation functions
  static validateFollowCompany(data: { idUser: number; idCompany: number }): string[] {
    const errors: string[] = [];

    if (!data.idUser) {
      errors.push('ID người dùng là bắt buộc');
    }

    if (!data.idCompany) {
      errors.push('ID công ty là bắt buộc');
    }

    return errors;
  }

  // Utility functions
  static isActive(followCompany: FollowCompany): boolean {
    return !followCompany.deletedAt;
  }

  // Check if user is following this company
  static isUserFollowingCompany(follows: FollowCompany[], userId: number, companyId: number): boolean {
    return follows.some(follow => 
      follow.idUser === userId && 
      follow.idCompany === companyId && 
      this.isActive(follow)
    );
  }

  // Get follow age in days
  static getFollowAge(followCompany: FollowCompany): number {
    const now = new Date();
    const created = new Date(followCompany.createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get recent follows (within last N days)
  static getRecent(follows: FollowCompany[], days: number = 7): FollowCompany[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return follows.filter(follow => 
      new Date(follow.createdAt) >= cutoffDate && this.isActive(follow)
    );
  }

  // Get follows by user
  static getByUser(follows: FollowCompany[], userId: number): FollowCompany[] {
    return follows.filter(follow => 
      follow.idUser === userId && this.isActive(follow)
    );
  }

  // Get follows by company
  static getByCompany(follows: FollowCompany[], companyId: number): FollowCompany[] {
    return follows.filter(follow => 
      follow.idCompany === companyId && this.isActive(follow)
    );
  }

  // Count followers for a company
  static countFollowersForCompany(follows: FollowCompany[], companyId: number): number {
    return this.getByCompany(follows, companyId).length;
  }

  // Count companies followed by user
  static countCompaniesByUser(follows: FollowCompany[], userId: number): number {
    return this.getByUser(follows, userId).length;
  }

  // Get most followed companies (returns company IDs sorted by follower count)
  static getMostFollowedCompanies(follows: FollowCompany[], limit: number = 10): { companyId: number; followerCount: number }[] {
    const companyFollowerCounts = new Map<number, number>();

    // Count followers for each company
    follows
      .filter(follow => this.isActive(follow))
      .forEach(follow => {
        const currentCount = companyFollowerCounts.get(follow.idCompany) || 0;
        companyFollowerCounts.set(follow.idCompany, currentCount + 1);
      });

    // Convert to array and sort by count
    return Array.from(companyFollowerCounts.entries())
      .map(([companyId, followerCount]) => ({ companyId, followerCount }))
      .sort((a, b) => b.followerCount - a.followerCount)
      .slice(0, limit);
  }

  // Get companies that gained most followers recently
  static getRecentlyPopularCompanies(follows: FollowCompany[], days: number = 30, limit: number = 5): { companyId: number; newFollowers: number }[] {
    const recentFollows = this.getRecent(follows, days);
    const companyNewFollowers = new Map<number, number>();

    recentFollows.forEach(follow => {
      const currentCount = companyNewFollowers.get(follow.idCompany) || 0;
      companyNewFollowers.set(follow.idCompany, currentCount + 1);
    });

    return Array.from(companyNewFollowers.entries())
      .map(([companyId, newFollowers]) => ({ companyId, newFollowers }))
      .sort((a, b) => b.newFollowers - a.newFollowers)
      .slice(0, limit);
  }

  // Get user's following list with pagination support
  static getUserFollowingWithPagination(
    follows: FollowCompany[], 
    userId: number, 
    page: number = 1, 
    limit: number = 20
  ): { data: FollowCompany[]; total: number; page: number; limit: number; totalPages: number } {
    const userFollows = this.getByUser(follows, userId);
    const total = userFollows.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = userFollows.slice(offset, offset + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages
    };
  }
}


