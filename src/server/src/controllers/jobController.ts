import { Request, Response, NextFunction } from 'express';
import { JobService } from '@/services/jobService';
import { AuthenticatedRequest, CreateJobDTO, UpdateJobDTO, JobQueryParams } from '@/types';
import { ResponseUtil } from '@/utils/response';
import { AppError } from '@/middlewares/errorHandler';

/**
 * JobController - RESTful CRUD operations cho Jobs
 */
export class JobController {
  private jobService: JobService;

  constructor() {
    this.jobService = new JobService();
  }

  /**
   * @swagger
   * /jobs:
   *   get:
   *     tags: [Jobs]
   *     summary: Lấy danh sách công việc với filtering và pagination
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *       - in: query
   *         name: idField
   *         schema:
   *           type: integer
   *         description: Filter theo lĩnh vực
   *       - in: query
   *         name: idProvince
   *         schema:
   *           type: integer
   *         description: Filter theo tỉnh/thành phố
   *       - in: query
   *         name: salaryMin
   *         schema:
   *           type: integer
   *         description: Mức lương tối thiểu
   *       - in: query
   *         name: salaryMax
   *         schema:
   *           type: integer
   *         description: Mức lương tối đa
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Tìm kiếm theo tên job hoặc company
   *     responses:
   *       200:
   *         description: Lấy danh sách công việc thành công
   */
  getAllJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const queryParams: JobQueryParams = {
        page,
        limit,
        idField: req.query.idField ? parseInt(req.query.idField as string) : undefined,
        idProvince: req.query.idProvince ? parseInt(req.query.idProvince as string) : undefined,
        salaryMin: req.query.salaryMin ? parseInt(req.query.salaryMin as string) : undefined,
        salaryMax: req.query.salaryMax ? parseInt(req.query.salaryMax as string) : undefined,
        typeWork: req.query.typeWork as string,
        education: req.query.education as string,
        experience: req.query.experience as string,
        search: req.query.search as string,
        sortBy: req.query.sortBy as 'createdAt' | 'salary' | 'company',
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC'
      };

      const userId = (req as AuthenticatedRequest).user?.id;
      const result = await this.jobService.getAllJobs(queryParams, userId);

      ResponseUtil.success(res, result, 'Lấy danh sách công việc thành công');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /jobs/{id}:
   *   get:
   *     tags: [Jobs]
   *     summary: Lấy thông tin chi tiết công việc
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lấy thông tin công việc thành công
   *       404:
   *         description: Không tìm thấy công việc
   */
  getJobById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jobId = parseInt(req.params.id);
      const userId = (req as AuthenticatedRequest).user?.id;
      
      const job = await this.jobService.getJobById(jobId, userId);

      ResponseUtil.success(res, job, 'Lấy thông tin công việc thành công');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /jobs:
   *   post:
   *     tags: [Jobs]
   *     summary: Tạo công việc mới (chỉ dành cho công ty)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - idField
   *               - idProvince
   *               - nameJob
   *               - request
   *               - desc
   *               - typeWork
   *               - education
   *               - experience
   *             properties:
   *               idField:
   *                 type: integer
   *                 example: 26
   *               idProvince:
   *                 type: integer
   *                 example: 24
   *               nameJob:
   *                 type: string
   *                 example: "Senior Backend Developer"
   *               request:
   *                 type: string
   *                 example: "3+ years experience with Node.js"
   *               desc:
   *                 type: string
   *                 example: "Develop and maintain backend services"
   *               other:
   *                 type: string
   *                 example: "Remote work available"
   *               salaryMin:
   *                 type: integer
   *                 example: 20000000
   *               salaryMax:
   *                 type: integer
   *                 example: 35000000
   *               sex:
   *                 type: string
   *                 enum: [Nam, Nữ, Không yêu cầu]
   *                 example: "Không yêu cầu"
   *               typeWork:
   *                 type: string
   *                 example: "Toàn thời gian"
   *               education:
   *                 type: string
   *                 example: "Đại học"
   *               experience:
   *                 type: string
   *                 example: "2-5 năm"
   *     responses:
   *       201:
   *         description: Tạo công việc thành công
   *       400:
   *         description: Dữ liệu không hợp lệ
   *       403:
   *         description: Chỉ công ty mới có thể tạo job
   */
  createJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || req.user.userType !== 'company') {
        throw new AppError('Chỉ công ty mới có thể tạo công việc', 403);
      }

      const jobData: CreateJobDTO = {
        ...req.body,
        idCompany: req.user.id
      };

      const newJob = await this.jobService.createJob(jobData);

      ResponseUtil.created(res, newJob, 'Tạo công việc thành công');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /jobs/{id}:
   *   put:
   *     tags: [Jobs]
   *     summary: Cập nhật thông tin công việc (chỉ company owner)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               idField:
   *                 type: integer
   *               idProvince:
   *                 type: integer
   *               nameJob:
   *                 type: string
   *               request:
   *                 type: string
   *               desc:
   *                 type: string
   *               other:
   *                 type: string
   *               salaryMin:
   *                 type: integer
   *               salaryMax:
   *                 type: integer
   *               sex:
   *                 type: string
   *               typeWork:
   *                 type: string
   *               education:
   *                 type: string
   *               experience:
   *                 type: string
   *     responses:
   *       200:
   *         description: Cập nhật công việc thành công
   *       403:
   *         description: Không có quyền cập nhật job này
   *       404:
   *         description: Không tìm thấy công việc
   */
  updateJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || req.user.userType !== 'company') {
        throw new AppError('Chỉ công ty mới có thể cập nhật công việc', 403);
      }

      const jobId = parseInt(req.params.id);
      const updateData: UpdateJobDTO = req.body;

      const updatedJob = await this.jobService.updateJob(jobId, updateData, req.user.id);

      ResponseUtil.success(res, updatedJob, 'Cập nhật công việc thành công');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /jobs/{id}:
   *   delete:
   *     tags: [Jobs]
   *     summary: Xóa cứng công việc (chỉ company owner) - KHÔNG THỂ KHÔI PHỤC
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       204:
   *         description: Xóa công việc thành công
   *       403:
   *         description: Không có quyền xóa job này
   *       404:
   *         description: Không tìm thấy công việc
   */
  deleteJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || req.user.userType !== 'company') {
        throw new AppError('Chỉ công ty mới có thể xóa công việc', 403);
      }

      const jobId = parseInt(req.params.id);
      
      await this.jobService.deleteJob(jobId, req.user.id);

      ResponseUtil.noContent(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /jobs/{id}/hidden:
   *   put:
   *     tags: [Jobs]
   *     summary: Ẩn công việc (soft delete) - có thể khôi phục
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Ẩn công việc thành công
   *       400:
   *         description: Công việc đã được ẩn trước đó
   *       403:
   *         description: Không có quyền ẩn job này
   *       404:
   *         description: Không tìm thấy công việc
   */
  hideJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || req.user.userType !== 'company') {
        throw new AppError('Chỉ công ty mới có thể ẩn công việc', 403);
      }

      const jobId = parseInt(req.params.id);
      
      await this.jobService.hideJob(jobId, req.user.id);

      ResponseUtil.success(res, null, 'Ẩn công việc thành công');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /jobs/{id}/unhidden:
   *   put:
   *     tags: [Jobs]
   *     summary: Khôi phục công việc đã bị ẩn
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Khôi phục công việc thành công
   *       400:
   *         description: Công việc không ở trạng thái ẩn
   *       403:
   *         description: Không có quyền khôi phục job này
   *       404:
   *         description: Không tìm thấy công việc
   */
  unhideJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || req.user.userType !== 'company') {
        throw new AppError('Chỉ công ty mới có thể khôi phục công việc', 403);
      }

      const jobId = parseInt(req.params.id);
      
      await this.jobService.unhideJob(jobId, req.user.id);

      ResponseUtil.success(res, null, 'Khôi phục công việc thành công');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /companies/{id}/jobs:
   *   get:
   *     tags: [Jobs]
   *     summary: Lấy danh sách công việc của một công ty
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID của công ty
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Lấy danh sách công việc của công ty thành công
   */
  getJobsByCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const queryParams: JobQueryParams = { page, limit };
      const result = await this.jobService.getJobsByCompany(companyId, queryParams);

      ResponseUtil.success(res, result, 'Lấy danh sách công việc của công ty thành công');
    } catch (error) {
      next(error);
    }
  };


  /**
   * @swagger
   * /jobs/stats:
   *   get:
   *     tags: [Jobs]
   *     summary: Lấy thống kê về jobs (cho admin)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lấy thống kê thành công
   */
  getJobStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.jobService.getJobStats();

      ResponseUtil.success(res, stats, 'Lấy thống kê công việc thành công');
    } catch (error) {
      next(error);
    }
  };
}
