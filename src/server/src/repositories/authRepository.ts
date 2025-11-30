import { pool } from '@/config/database';
import { User, Company, CreateCompanyDTO } from '@/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class AuthRepository {
  // ===== USER AUTHENTICATION =====
  
  async findUserByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  async findUserById(id: number): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  async createUser(userData: Omit<User, 'id'>): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (name, email, password, phone, idProvince, avatarPic, birthDay, intro, linkSocial, sex) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.name,
        userData.email,
        userData.password,
        userData.phone,
        userData.idProvince ?? null,
        userData.avatarPic ?? null,
        userData.birthDay ?? null,
        userData.intro ?? null,
        userData.linkSocial ?? null,
        userData.sex ?? null,
      ]
    );
    
    return result.insertId;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    
    return result.affectedRows > 0;
  }

  // ===== COMPANY AUTHENTICATION =====

  async findCompanyByEmail(email: string): Promise<Company | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM companies WHERE email = ?',
      [email]
    );
    
    return rows.length > 0 ? (rows[0] as Company) : null;
  }

  async findCompanyById(id: number): Promise<Company | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );
    
    return rows.length > 0 ? (rows[0] as Company) : null;
  }

  async createCompany(companyData: CreateCompanyDTO): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO companies (nameCompany, nameAdmin, email, password, phone, idProvince, avatarPic, intro, scale, web) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyData.nameCompany,
        companyData.nameAdmin,
        companyData.email,
        companyData.password,
        companyData.phone,
        companyData.idProvince ?? null,  // Handle optional idProvince
        null,  // avatarPic (không có trong CreateCompanyDTO)
        companyData.intro ?? null,
        companyData.scale ?? null,
        companyData.web ?? null,
      ]
    );
    
    return result.insertId;
  }

  async updateCompanyPassword(id: number, hashedPassword: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE companies SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    
    return result.affectedRows > 0;
  }

  // ===== PASSWORD RESET =====

  async saveResetToken(userId: number, resetToken: string, resetTokenExpiry: Date): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, userId]
    );
  }

  async findUserByResetToken(resetToken: string): Promise<(User & { resetTokenExpiry?: Date }) | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE resetToken = ?',
      [resetToken]
    );
    
    return rows.length > 0 ? (rows[0] as User & { resetTokenExpiry?: Date }) : null;
  }

  async updatePasswordAndClearToken(userId: number, hashedPassword: string): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
      [hashedPassword, userId]
    );
  }

  // ===== COMPANY PASSWORD RESET =====

  async saveCompanyResetToken(companyId: number, resetToken: string, resetTokenExpiry: Date): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'UPDATE companies SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, companyId]
    );
  }

  async findCompanyByResetToken(resetToken: string): Promise<(Company & { resetTokenExpiry?: Date }) | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM companies WHERE resetToken = ?',
      [resetToken]
    );
    
    return rows.length > 0 ? (rows[0] as Company & { resetTokenExpiry?: Date }) : null;
  }

  async updateCompanyPasswordAndClearToken(companyId: number, hashedPassword: string): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'UPDATE companies SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
      [hashedPassword, companyId]
    );
  }
}
