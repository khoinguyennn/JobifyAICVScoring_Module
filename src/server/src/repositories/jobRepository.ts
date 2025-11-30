import { pool } from '@/config/database';
import { Job, CreateJobDTO, UpdateJobDTO, JobQueryParams, JobWithDetails, PaginatedResponse } from '@/types';
import { JobModel } from '@/models/Job';
import { CompanyModel } from '@/models/Company';
import { FieldModel } from '@/models/Field';
import { ProvinceModel } from '@/models/Province';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * JobRepository - Xử lý truy vấn database cho Job
 */
export class JobRepository {
  // Tìm job theo ID với thông tin chi tiết
  async findById(id: number, userId?: number): Promise<JobWithDetails | null> {
    let query = `
      SELECT 
        j.*,
        c.nameCompany, c.avatarPic as companyAvatar, c.scale, c.web,
        f.name as fieldName, f.typeField,
        p.name as provinceName, p.nameWithType as provinceFullName
    `;

    if (userId) {
      query += `,
        CASE WHEN sj.id IS NOT NULL THEN TRUE ELSE FALSE END as isSaved,
        CASE WHEN aj.id IS NOT NULL THEN TRUE ELSE FALSE END as isApplied
      `;
    }

    query += `
      FROM jobs j
      LEFT JOIN companies c ON j.idCompany = c.id
      LEFT JOIN fields f ON j.idField = f.id  
      LEFT JOIN provinces p ON j.idProvince = p.id
    `;

    if (userId) {
      query += `
        LEFT JOIN save_job sj ON j.id = sj.idJob AND sj.idUser = ? AND sj.deletedAt IS NULL
        LEFT JOIN apply_job aj ON j.id = aj.idJob AND aj.idUser = ? AND aj.deletedAt IS NULL
      `;
    }

    query += ` WHERE j.id = ? AND j.deletedAt IS NULL`;

    const params = userId ? [userId, userId, id] : [id];
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    
    if (rows.length === 0) return null;

    const row = rows[0];
    const job = JobModel.fromRow(row);

    return {
      ...job,
      company: {
        id: row.idCompany,
        nameCompany: row.nameCompany,
        avatarPic: row.companyAvatar,
        scale: row.scale,
        web: row.web
      },
      field: {
        id: row.idField,
        name: row.fieldName,
        typeField: row.typeField
      },
      province: {
        id: row.idProvince,
        name: row.provinceName,
        nameWithType: row.provinceFullName
      },
      isSaved: userId ? Boolean(row.isSaved) : false,
      isApplied: userId ? Boolean(row.isApplied) : false
    } as JobWithDetails;
  }

  // Tìm job theo ID bao gồm cả job đã bị ẩn
  async findByIdIncludingDeleted(id: number, userId?: number): Promise<JobWithDetails | null> {
    let query = `
      SELECT 
        j.*,
        c.nameCompany, c.avatarPic as companyAvatar, c.scale, c.web,
        f.name as fieldName, f.typeField,
        p.name as provinceName, p.nameWithType as provinceFullName
    `;

    if (userId) {
      query += `,
        CASE WHEN sj.id IS NOT NULL THEN TRUE ELSE FALSE END as isSaved,
        CASE WHEN aj.id IS NOT NULL THEN TRUE ELSE FALSE END as isApplied
      `;
    }

    query += `
      FROM jobs j
      LEFT JOIN companies c ON j.idCompany = c.id
      LEFT JOIN fields f ON j.idField = f.id  
      LEFT JOIN provinces p ON j.idProvince = p.id
    `;

    if (userId) {
      query += `
        LEFT JOIN save_job sj ON j.id = sj.idJob AND sj.idUser = ? AND sj.deletedAt IS NULL
        LEFT JOIN apply_job aj ON j.id = aj.idJob AND aj.idUser = ? AND aj.deletedAt IS NULL
      `;
    }

    query += ` WHERE j.id = ?`; // Không filter deletedAt

    const params = userId ? [userId, userId, id] : [id];
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    
    if (rows.length === 0) return null;

    const row = rows[0];
    const job = JobModel.fromRow(row);

    return {
      ...job,
      company: {
        id: row.idCompany,
        nameCompany: row.nameCompany,
        avatarPic: row.companyAvatar,
        scale: row.scale,
        web: row.web
      },
      field: {
        id: job.idField,
        name: row.fieldName,
        typeField: row.typeField
      },
      province: {
        id: job.idProvince,
        name: row.provinceName,
        nameWithType: row.provinceFullName
      },
      isSaved: userId ? Boolean(row.isSaved) : false,
      isApplied: userId ? Boolean(row.isApplied) : false
    } as JobWithDetails;
  }

  // Tạo job mới
  async create(jobData: CreateJobDTO): Promise<Job> {
    const jobRow = JobModel.toRow(jobData);
    
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO jobs (
        idCompany, idField, idProvince, nameJob, request, \`desc\`, other, 
        salaryMin, salaryMax, sex, typeWork, education, experience, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        jobRow.idCompany, jobRow.idField, jobRow.idProvince, jobRow.nameJob,
        jobRow.request, jobRow.desc, jobRow.other, jobRow.salaryMin, jobRow.salaryMax,
        jobRow.sex, jobRow.typeWork, jobRow.education, jobRow.experience
      ]
    );

    const newJob = await this.findById(result.insertId);
    if (!newJob) {
      throw new Error('Không thể tạo job mới');
    }

    return newJob;
  }

  // Cập nhật job
  async update(id: number, jobData: UpdateJobDTO): Promise<JobWithDetails | null> {
    const jobRow = JobModel.toRow(jobData);
    const fields: string[] = [];
    const values: any[] = [];

    // Build dynamic update query
    Object.entries(jobRow).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt') {
        if (key === 'desc') {
          fields.push('`desc` = ?'); // desc is reserved keyword
        } else {
          fields.push(`${key} = ?`);
        }
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE jobs SET ${fields.join(', ')} WHERE id = ? AND deletedAt IS NULL`,
      values
    );

    return result.affectedRows > 0 ? this.findById(id) : null;
  }

  // Xóa job cứng (hard delete)
  async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM jobs WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  // Ẩn job (soft delete)
  async hide(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE jobs SET deletedAt = NOW() WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  // Khôi phục job (unhide)
  async unhide(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE jobs SET deletedAt = NULL WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  // Tìm jobs với filter và pagination
  async findAll(params: JobQueryParams, userId?: number): Promise<PaginatedResponse<JobWithDetails>> {
    let whereClause = 'WHERE j.deletedAt IS NULL';
    const queryParams: any[] = [];

    // Build where conditions
    if (params.idField) {
      whereClause += ' AND j.idField = ?';
      queryParams.push(params.idField);
    }

    if (params.idProvince) {
      whereClause += ' AND j.idProvince = ?';
      queryParams.push(params.idProvince);
    }

    if (params.salaryMin) {
      whereClause += ' AND (j.salaryMin >= ? OR j.salaryMin IS NULL)';
      queryParams.push(params.salaryMin);
    }

    if (params.salaryMax) {
      whereClause += ' AND (j.salaryMax <= ? OR j.salaryMax IS NULL)';
      queryParams.push(params.salaryMax);
    }

    if (params.typeWork) {
      whereClause += ' AND j.typeWork = ?';
      queryParams.push(params.typeWork);
    }

    if (params.education) {
      whereClause += ' AND j.education = ?';
      queryParams.push(params.education);
    }

    if (params.experience) {
      whereClause += ' AND j.experience = ?';
      queryParams.push(params.experience);
    }

    if (params.search) {
      whereClause += ' AND (j.nameJob LIKE ? OR j.request LIKE ? OR j.desc LIKE ? OR c.nameCompany LIKE ?)';
      const searchTerm = `%${params.search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Count total records
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total 
       FROM jobs j 
       LEFT JOIN companies c ON j.idCompany = c.id 
       ${whereClause}`,
      queryParams
    );
    const total = countRows[0].total;

    // Build order clause
    let orderClause = 'ORDER BY ';
    switch (params.sortBy) {
      case 'salary':
        orderClause += 'j.salaryMax';
        break;
      case 'company':
        orderClause += 'c.nameCompany';
        break;
      default:
        orderClause += 'j.createdAt';
    }
    orderClause += ` ${params.sortOrder || 'DESC'}`;

    // Build main query
    let query = `
      SELECT 
        j.*,
        c.nameCompany, c.avatarPic as companyAvatar, c.scale, c.web,
        f.name as fieldName, f.typeField,
        p.name as provinceName, p.nameWithType as provinceFullName,
        (SELECT COUNT(*) FROM apply_job WHERE idJob = j.id AND deletedAt IS NULL) as appliedCount
    `;

    if (userId) {
      query += `,
        CASE WHEN sj.id IS NOT NULL THEN TRUE ELSE FALSE END as isSaved,
        CASE WHEN aj.id IS NOT NULL THEN TRUE ELSE FALSE END as isApplied
      `;
    }

    query += `
      FROM jobs j
      LEFT JOIN companies c ON j.idCompany = c.id
      LEFT JOIN fields f ON j.idField = f.id
      LEFT JOIN provinces p ON j.idProvince = p.id
    `;

    if (userId) {
      query += `
        LEFT JOIN save_job sj ON j.id = sj.idJob AND sj.idUser = ${userId} AND sj.deletedAt IS NULL
        LEFT JOIN apply_job aj ON j.id = aj.idJob AND aj.idUser = ${userId} AND aj.deletedAt IS NULL
      `;
    }

    query += ` ${whereClause} ${orderClause}`;

    // Add pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, queryParams);

    const jobs = rows.map(row => {
      const job = JobModel.fromRow(row);
      return {
        ...job,
        company: {
          id: row.idCompany,
          nameCompany: row.nameCompany,
          avatarPic: row.companyAvatar,
          scale: row.scale,
          web: row.web
        },
        field: {
          id: row.idField,
          name: row.fieldName,
          typeField: row.typeField
        },
        province: {
          id: row.idProvince,
          name: row.provinceName,
          nameWithType: row.provinceFullName
        },
        appliedCount: row.appliedCount || 0,
        isSaved: userId ? Boolean(row.isSaved) : false,
        isApplied: userId ? Boolean(row.isApplied) : false
      } as JobWithDetails;
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: jobs,
      total,
      page,
      limit,
      totalPages
    };
  }

  // Tìm jobs của một company (bao gồm cả job đã ẩn)
  async findByCompany(companyId: number, params: JobQueryParams): Promise<PaginatedResponse<JobWithDetails>> {
    const modifiedParams = { ...params, idCompany: companyId };
    
    let whereClause = 'WHERE j.idCompany = ?';
    const queryParams: any[] = [companyId];

    // Count total
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM jobs j ${whereClause}`,
      queryParams
    );
    const total = countRows[0].total;

    // Get data
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        j.*,
        c.nameCompany, c.avatarPic as companyAvatar, c.scale, c.web,
        f.name as fieldName, f.typeField,
        p.name as provinceName, p.nameWithType as provinceFullName,
        (SELECT COUNT(*) FROM apply_job WHERE idJob = j.id AND deletedAt IS NULL) as appliedCount
       FROM jobs j
       LEFT JOIN companies c ON j.idCompany = c.id
       LEFT JOIN fields f ON j.idField = f.id
       LEFT JOIN provinces p ON j.idProvince = p.id
       ${whereClause}
       ORDER BY j.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const jobs = rows.map(row => {
      const job = JobModel.fromRow(row);
      return {
        ...job,
        company: {
          id: row.idCompany,
          nameCompany: row.nameCompany,
          avatarPic: row.companyAvatar,
          scale: row.scale,
          web: row.web
        },
        field: {
          id: row.idField,
          name: row.fieldName,
          typeField: row.typeField
        },
        province: {
          id: row.idProvince,
          name: row.provinceName,
          nameWithType: row.provinceFullName
        },
        appliedCount: row.appliedCount || 0
      } as JobWithDetails;
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: jobs,
      total,
      page,
      limit,
      totalPages
    };
  }


  // Lấy thống kê jobs
  async getStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    newJobsThisMonth: number;
    jobsByField: { fieldName: string; count: number }[];
    jobsByProvince: { provinceName: string; count: number }[];
  }> {
    // Total and active jobs
    const [jobRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as totalJobs,
        SUM(CASE WHEN deletedAt IS NULL THEN 1 ELSE 0 END) as activeJobs
       FROM jobs`
    );
    const { totalJobs, activeJobs } = jobRows[0];

    // New jobs this month
    const [newRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM jobs 
       WHERE YEAR(createdAt) = YEAR(CURDATE()) 
       AND MONTH(createdAt) = MONTH(CURDATE())
       AND deletedAt IS NULL`
    );
    const newJobsThisMonth = newRows[0].total;

    // Jobs by field
    const [fieldRows] = await pool.execute<RowDataPacket[]>(
      `SELECT f.name as fieldName, COUNT(j.id) as count 
       FROM fields f 
       LEFT JOIN jobs j ON f.id = j.idField AND j.deletedAt IS NULL
       GROUP BY f.id, f.name 
       ORDER BY count DESC 
       LIMIT 10`
    );
    const jobsByField = fieldRows.map(row => ({
      fieldName: row.fieldName,
      count: row.count
    }));

    // Jobs by province
    const [provinceRows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.name as provinceName, COUNT(j.id) as count 
       FROM provinces p 
       LEFT JOIN jobs j ON p.id = j.idProvince AND j.deletedAt IS NULL
       GROUP BY p.id, p.name 
       ORDER BY count DESC 
       LIMIT 10`
    );
    const jobsByProvince = provinceRows.map(row => ({
      provinceName: row.provinceName,
      count: row.count
    }));

    return {
      totalJobs,
      activeJobs,
      newJobsThisMonth,
      jobsByField,
      jobsByProvince
    };
  }
}

export const jobRepository = new JobRepository();
