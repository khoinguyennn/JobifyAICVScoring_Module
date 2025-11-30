import { pool } from '@/config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { 
  FollowCompany, 
  CreateFollowCompanyDTO, 
  FollowCompanyQueryParams,
  FollowCompanyWithDetails,
  PaginatedResponse 
} from '@/types';

export class FollowCompanyRepository {
  /**
   * Tạo một record theo dõi công ty mới
   */
  async create(followCompanyData: CreateFollowCompanyDTO): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO follow_company (idUser, idCompany, createdAt) VALUES (?, ?, NOW())`,
      [followCompanyData.idUser, followCompanyData.idCompany]
    );
    return result.insertId;
  }

  /**
   * Xóa record theo dõi công ty (hủy theo dõi)
   */
  async delete(idUser: number, idCompany: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM follow_company WHERE idUser = ? AND idCompany = ?`,
      [idUser, idCompany]
    );
    return result.affectedRows > 0;
  }

  /**
   * Kiểm tra xem user đã theo dõi company này chưa
   */
  async exists(idUser: number, idCompany: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM follow_company WHERE idUser = ? AND idCompany = ? LIMIT 1`,
      [idUser, idCompany]
    );
    return rows.length > 0;
  }

  /**
   * Lấy danh sách công ty đã theo dõi của user với thông tin chi tiết
   */
  async findByUser(
    idUser: number, 
    params: FollowCompanyQueryParams = {}
  ): Promise<PaginatedResponse<FollowCompanyWithDetails>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['fc.idUser = ?'];
    let queryParams: any[] = [idUser];

    // Add filters
    if (params.idProvince) {
      whereConditions.push('c.idProvince = ?');
      queryParams.push(params.idProvince);
    }

    if (params.search) {
      whereConditions.push('(c.nameCompany LIKE ? OR c.intro LIKE ?)');
      const searchPattern = `%${params.search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Build ORDER BY clause
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'DESC';
    let orderByClause = '';
    
    if (sortBy === 'createdAt') {
      orderByClause = `ORDER BY fc.createdAt ${sortOrder}`;
    } else if (sortBy === 'nameCompany') {
      orderByClause = `ORDER BY c.nameCompany ${sortOrder}`;
    } else {
      orderByClause = `ORDER BY fc.createdAt DESC`;
    }

    // Get total count
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total 
       FROM follow_company fc
       LEFT JOIN companies c ON fc.idCompany = c.id
       ${whereClause}`,
      queryParams
    );
    const total = countRows[0].total;

    // Get data with pagination
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        fc.id, fc.idUser, fc.idCompany, fc.createdAt,
        c.id as companyId, c.nameCompany, c.nameAdmin, c.email, c.avatarPic, 
        c.phone, c.idProvince, c.intro, c.scale, c.web,
        p.id as provinceId, p.name as provinceName, p.nameWithType as provinceFullName,
        (SELECT COUNT(*) FROM jobs WHERE idCompany = c.id AND deletedAt IS NULL) as jobCount,
        (SELECT COUNT(*) FROM follow_company WHERE idCompany = c.id) as followerCount
       FROM follow_company fc
       LEFT JOIN companies c ON fc.idCompany = c.id
       LEFT JOIN provinces p ON c.idProvince = p.id
       ${whereClause}
       ${orderByClause}
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const followedCompanies: FollowCompanyWithDetails[] = rows.map(row => ({
      id: row.id,
      idUser: row.idUser,
      idCompany: row.idCompany,
      createdAt: new Date(row.createdAt),
      company: {
        id: row.companyId,
        nameCompany: row.nameCompany,
        nameAdmin: row.nameAdmin, // Không hide admin name vì user đã follow
        email: row.email, // Có thể hiển thị email công khai
        password: '', // Không expose password
        avatarPic: row.avatarPic,
        phone: row.phone, // Hiển thị phone công khai
        idProvince: row.idProvince,
        intro: row.intro,
        scale: row.scale,
        web: row.web,
        province: row.provinceId ? {
          id: row.provinceId,
          name: row.provinceName,
          nameWithType: row.provinceFullName
        } : undefined,
        jobCount: row.jobCount,
        isFollowed: true // Đã theo dõi rồi nên luôn true
      }
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data: followedCompanies,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Lấy số lượng công ty đã theo dõi của user
   */
  async getCountByUser(idUser: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM follow_company WHERE idUser = ?`,
      [idUser]
    );
    return rows[0].count;
  }

  /**
   * Lấy số lượng người theo dõi của một công ty
   */
  async getFollowerCount(idCompany: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM follow_company WHERE idCompany = ?`,
      [idCompany]
    );
    return rows[0].count;
  }

  /**
   * Lấy thống kê công ty được theo dõi nhiều nhất
   */
  async getPopularFollowedCompanies(limit: number = 10): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        c.id, c.nameCompany, c.avatarPic, c.scale, c.web,
        COUNT(fc.id) as followerCount
       FROM follow_company fc
       LEFT JOIN companies c ON fc.idCompany = c.id
       GROUP BY fc.idCompany
       ORDER BY followerCount DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  /**
   * Lấy danh sách user theo dõi một công ty (cho company xem ai follow họ)
   */
  async getFollowersByCompany(
    idCompany: number, 
    params: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<any>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM follow_company WHERE idCompany = ?`,
      [idCompany]
    );
    const total = countRows[0].total;

    // Get data
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        fc.id, fc.createdAt,
        u.id as userId, u.name, u.avatarPic, u.phone, u.intro,
        p.name as provinceName
       FROM follow_company fc
       LEFT JOIN users u ON fc.idUser = u.id
       LEFT JOIN provinces p ON u.idProvince = p.id
       WHERE fc.idCompany = ?
       ORDER BY fc.createdAt DESC
       LIMIT ? OFFSET ?`,
      [idCompany, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: rows,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Xóa tất cả follows của một user (khi user bị xóa)
   */
  async deleteByUser(idUser: number): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM follow_company WHERE idUser = ?`,
      [idUser]
    );
    return result.affectedRows;
  }

  /**
   * Xóa tất cả follows của một company (khi company bị xóa)
   */
  async deleteByCompany(idCompany: number): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM follow_company WHERE idCompany = ?`,
      [idCompany]
    );
    return result.affectedRows;
  }

  /**
   * Kiểm tra các company mà user đã follow (để populate isFollowed field)
   */
  async getFollowedCompanyIds(idUser: number): Promise<number[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT idCompany FROM follow_company WHERE idUser = ?`,
      [idUser]
    );
    return rows.map(row => row.idCompany);
  }
}

export const followCompanyRepository = new FollowCompanyRepository();
