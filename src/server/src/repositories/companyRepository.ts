import { pool } from '@/config/database';
import { Company, CompanyWithJobCount } from '@/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class CompanyRepository {
  async findById(id: number): Promise<Company | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.*, p.name as provinceName, p.nameWithType as provinceFullName 
       FROM companies c 
       LEFT JOIN provinces p ON c.idProvince = p.id 
       WHERE c.id = ?`,
      [id]
    );
    
    return rows.length > 0 ? (rows[0] as Company) : null;
  }

  async findByEmail(email: string): Promise<Company | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM companies WHERE email = ?',
      [email]
    );
    
    return rows.length > 0 ? (rows[0] as Company) : null;
  }

  async findAll(
    page: number, 
    limit: number, 
    searchParams?: {
      keyword?: string;
      province?: number;
      scale?: string;
    }
  ): Promise<{ companies: CompanyWithJobCount[], total: number }> {
    const offset = (page - 1) * limit;

    // Validate parameters
    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      throw new Error(`Invalid pagination parameters: page=${page}, limit=${limit}`);
    }

    // Build WHERE conditions
    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    if (searchParams?.keyword) {
      whereConditions.push('(c.nameCompany LIKE ? OR c.intro LIKE ?)');
      queryParams.push(`%${searchParams.keyword}%`, `%${searchParams.keyword}%`);
    }

    if (searchParams?.province) {
      whereConditions.push('c.idProvince = ?');
      queryParams.push(searchParams.province);
    }

    if (searchParams?.scale) {
      whereConditions.push('c.scale = ?');
      queryParams.push(searchParams.scale);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count with search conditions
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT c.id) as total 
       FROM companies c 
       LEFT JOIN provinces p ON c.idProvince = p.id 
       ${whereClause}`,
      queryParams
    );
    const total = countRows[0].total;

    // Get paginated companies with job count and search conditions
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        c.*, 
        p.name as provinceName, 
        p.nameWithType as provinceFullName,
        COALESCE(COUNT(j.id), 0) as jobCount
       FROM companies c 
       LEFT JOIN provinces p ON c.idProvince = p.id 
       LEFT JOIN jobs j ON c.id = j.idCompany AND j.deletedAt IS NULL
       ${whereClause}
       GROUP BY c.id, c.nameCompany, c.nameAdmin, c.email, c.phone, c.idProvince, c.web, c.avatarPic, c.intro, c.scale, p.name, p.nameWithType
       ORDER BY c.nameCompany ASC 
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Convert jobCount to integer and structure the response
    const companies: CompanyWithJobCount[] = rows.map(row => ({
      id: row.id,
      nameCompany: row.nameCompany,
      nameAdmin: row.nameAdmin,
      email: row.email,
      avatarPic: row.avatarPic,
      phone: row.phone,
      idProvince: row.idProvince,
      intro: row.intro,
      scale: row.scale,
      web: row.web,
      provinceName: row.provinceName,
      provinceFullName: row.provinceFullName,
      jobCount: parseInt(row.jobCount) || 0 // Ensure it's an integer
    }));

    return {
      companies,
      total,
    };
  }

  async updateProfile(id: number, companyData: Partial<Company>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    // Dynamically build update query
    Object.entries(companyData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'password') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    values.push(id);

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE companies SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  async updateIntro(id: number, intro: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE companies SET intro = ? WHERE id = ?',
      [intro, id]
    );

    return result.affectedRows > 0;
  }

  async updateAvatar(id: number, avatarPic: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE companies SET avatarPic = ? WHERE id = ?',
      [avatarPic, id]
    );

    return result.affectedRows > 0;
  }
}

export const companyRepository = new CompanyRepository();

