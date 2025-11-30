import { pool } from '@/config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { 
  SaveJob, 
  CreateSaveJobDTO, 
  SaveJobQueryParams,
  SaveJobWithDetails,
  PaginatedResponse 
} from '@/types';

export class JobSaveRepository {
  /**
   * Tạo một record lưu công việc mới
   */
  async create(saveJobData: CreateSaveJobDTO): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO save_job (idUser, idJob, createdAt) VALUES (?, ?, NOW())`,
      [saveJobData.idUser, saveJobData.idJob]
    );
    return result.insertId;
  }

  /**
   * Xóa record lưu công việc (hủy lưu)
   */
  async delete(idUser: number, idJob: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM save_job WHERE idUser = ? AND idJob = ?`,
      [idUser, idJob]
    );
    return result.affectedRows > 0;
  }

  /**
   * Kiểm tra xem user đã lưu job này chưa
   */
  async exists(idUser: number, idJob: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM save_job WHERE idUser = ? AND idJob = ? LIMIT 1`,
      [idUser, idJob]
    );
    return rows.length > 0;
  }

  /**
   * Lấy danh sách công việc đã lưu của user với thông tin chi tiết
   */
  async findByUser(
    idUser: number, 
    params: SaveJobQueryParams = {}
  ): Promise<PaginatedResponse<SaveJobWithDetails>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['sj.idUser = ?'];
    let queryParams: any[] = [idUser];

    // Add filters
    if (params.idField) {
      whereConditions.push('j.idField = ?');
      queryParams.push(params.idField);
    }

    if (params.idProvince) {
      whereConditions.push('j.idProvince = ?');
      queryParams.push(params.idProvince);
    }

    if (params.search) {
      whereConditions.push('(j.nameJob LIKE ? OR c.nameCompany LIKE ?)');
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
      orderByClause = `ORDER BY sj.createdAt ${sortOrder}`;
    } else if (sortBy === 'nameJob') {
      orderByClause = `ORDER BY j.nameJob ${sortOrder}`;
    } else {
      orderByClause = `ORDER BY sj.createdAt DESC`;
    }

    // Get total count
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total 
       FROM save_job sj
       LEFT JOIN jobs j ON sj.idJob = j.id
       LEFT JOIN companies c ON j.idCompany = c.id
       ${whereClause}`,
      queryParams
    );
    const total = countRows[0].total;

    // Get data with pagination
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        sj.id, sj.idUser, sj.idJob, sj.createdAt,
        j.id as jobId, j.nameJob, j.desc, j.salaryMin, j.salaryMax, 
        j.typeWork, j.education, j.experience, j.createdAt as jobCreatedAt,
        c.id as companyId, c.nameCompany, c.avatarPic as companyAvatar, 
        c.scale, c.web,
        f.id as fieldId, f.name as fieldName, f.typeField,
        p.id as provinceId, p.name as provinceName, p.nameWithType as provinceFullName,
        (SELECT COUNT(*) FROM apply_job WHERE idJob = j.id) as appliedCount
       FROM save_job sj
       LEFT JOIN jobs j ON sj.idJob = j.id
       LEFT JOIN companies c ON j.idCompany = c.id
       LEFT JOIN fields f ON j.idField = f.id
       LEFT JOIN provinces p ON j.idProvince = p.id
       ${whereClause}
       ${orderByClause}
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const savedJobs: SaveJobWithDetails[] = rows.map(row => ({
      id: row.id,
      idUser: row.idUser,
      idJob: row.idJob,
      createdAt: new Date(row.createdAt),
      job: {
        id: row.jobId,
        idCompany: row.companyId,
        idField: row.fieldId,
        idProvince: row.provinceId,
        nameJob: row.nameJob,
        request: '', // Không lấy request để tiết kiệm bandwidth
        desc: row.desc,
        salaryMin: row.salaryMin,
        salaryMax: row.salaryMax,
        typeWork: row.typeWork,
        education: row.education,
        experience: row.experience,
        createdAt: new Date(row.jobCreatedAt),
        company: {
          id: row.companyId,
          nameCompany: row.nameCompany,
          nameAdmin: '', // Không expose thông tin admin
          email: '', // Không expose email
          password: '', // Không expose password
          avatarPic: row.companyAvatar,
          phone: '', // Không expose phone
          idProvince: row.provinceId,
          scale: row.scale,
          web: row.web
        },
        field: {
          id: row.fieldId,
          name: row.fieldName,
          typeField: row.typeField
        },
        province: {
          id: row.provinceId,
          name: row.provinceName,
          nameWithType: row.provinceFullName
        },
        appliedCount: row.appliedCount,
        isSaved: true // Đã lưu rồi nên luôn true
      }
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data: savedJobs,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Lấy số lượng công việc đã lưu của user
   */
  async getCountByUser(idUser: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM save_job WHERE idUser = ?`,
      [idUser]
    );
    return rows[0].count;
  }

  /**
   * Lấy thống kê công việc được lưu nhiều nhất
   */
  async getPopularSavedJobs(limit: number = 10): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        j.id, j.nameJob, c.nameCompany,
        COUNT(sj.id) as saveCount
       FROM save_job sj
       LEFT JOIN jobs j ON sj.idJob = j.id
       LEFT JOIN companies c ON j.idCompany = c.id
       GROUP BY sj.idJob
       ORDER BY saveCount DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  /**
   * Xóa tất cả saved jobs của một user (khi user bị xóa)
   */
  async deleteByUser(idUser: number): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM save_job WHERE idUser = ?`,
      [idUser]
    );
    return result.affectedRows;
  }

  /**
   * Xóa tất cả saved jobs của một job (khi job bị xóa)
   */
  async deleteByJob(idJob: number): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM save_job WHERE idJob = ?`,
      [idJob]
    );
    return result.affectedRows;
  }
}

export const jobSaveRepository = new JobSaveRepository();
