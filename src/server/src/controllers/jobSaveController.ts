import { Request, Response, NextFunction } from 'express';
import { jobSaveService } from '@/services/jobSaveService';
import { AuthenticatedRequest, SaveJobQueryParams } from '@/types';
import { ResponseUtil } from '@/utils/response';

export class JobSaveController {
  /**
   * @swagger
   * /saved-jobs:
   *   post:
   *     summary: Lưu công việc
   *     description: Lưu một công việc vào danh sách yêu thích của người tìm việc
   *     tags: [Công việc đã lưu]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - idJob
   *             properties:
   *               idJob:
   *                 type: integer
   *                 description: ID của công việc muốn lưu
   *                 example: 1
   *     responses:
   *       201:
   *         description: Lưu công việc thành công
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Lưu công việc thành công"
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                     idUser:
   *                       type: integer
   *                     idJob:
   *                       type: integer
   *       400:
   *         description: Đã lưu công việc này rồi hoặc công việc không tồn tại
   *       401:
   *         description: Không có quyền truy cập (chỉ dành cho người tìm việc)
   */
  async saveJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idJob } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.error(res, 'Vui lòng đăng nhập', 401);
        return;
      }

      if (!idJob) {
        ResponseUtil.error(res, 'ID công việc không hợp lệ', 400);
        return;
      }

      // Chỉ cho phép user (người tìm việc) lưu công việc
      if (req.user?.userType !== 'user') {
        ResponseUtil.error(res, 'Chỉ người tìm việc mới có thể lưu công việc', 403);
        return;
      }

      const result = await jobSaveService.saveJob({
        idUser: userId,
        idJob: parseInt(idJob)
      });

      if (!result.success) {
        ResponseUtil.error(res, result.message, 400);
        return;
      }

      ResponseUtil.success(res, result.data, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /saved-jobs/{jobId}:
   *   delete:
   *     summary: Hủy lưu công việc
   *     description: Xóa công việc khỏi danh sách yêu thích của người tìm việc
   *     tags: [Công việc đã lưu]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: jobId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID của công việc muốn hủy lưu
   *     responses:
   *       200:
   *         description: Hủy lưu công việc thành công
   *       400:
   *         description: Chưa lưu công việc này
   *       401:
   *         description: Không có quyền truy cập
   */
  async unsaveJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.error(res, 'Vui lòng đăng nhập', 401);
        return;
      }

      if (!jobId || isNaN(parseInt(jobId))) {
        ResponseUtil.error(res, 'ID công việc không hợp lệ', 400);
        return;
      }

      // Chỉ cho phép user (người tìm việc) hủy lưu công việc
      if (req.user?.userType !== 'user') {
        ResponseUtil.error(res, 'Chỉ người tìm việc mới có thể hủy lưu công việc', 403);
        return;
      }

      const result = await jobSaveService.unsaveJob(userId, parseInt(jobId));

      if (!result.success) {
        ResponseUtil.error(res, result.message, 400);
        return;
      }

      ResponseUtil.success(res, null, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /saved-jobs:
   *   get:
   *     summary: Lấy danh sách công việc đã lưu
   *     description: Lấy danh sách tất cả công việc mà người tìm việc đã lưu
   *     tags: [Công việc đã lưu]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Số trang
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Số lượng items per page
   *       - in: query
   *         name: idField
   *         schema:
   *           type: integer
   *         description: Lọc theo lĩnh vực
   *       - in: query
   *         name: idProvince
   *         schema:
   *           type: integer
   *         description: Lọc theo tỉnh/thành phố
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Tìm kiếm theo tên công việc hoặc tên công ty
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [createdAt, nameJob]
   *           default: createdAt
   *         description: Sắp xếp theo trường
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: DESC
   *         description: Thứ tự sắp xếp
   *     responses:
   *       200:
   *         description: Lấy danh sách thành công
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/SaveJobWithDetails'
   *                     total:
   *                       type: integer
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *       401:
   *         description: Không có quyền truy cập
   */
  async getSavedJobs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.error(res, 'Vui lòng đăng nhập', 401);
        return;
      }

      // Chỉ cho phép user (người tìm việc) xem danh sách đã lưu
      if (req.user?.userType !== 'user') {
        ResponseUtil.error(res, 'Chỉ người tìm việc mới có thể xem danh sách công việc đã lưu', 403);
        return;
      }

      const queryParams: SaveJobQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
        idField: req.query.idField ? parseInt(req.query.idField as string) : undefined,
        idProvince: req.query.idProvince ? parseInt(req.query.idProvince as string) : undefined,
        search: req.query.search as string,
        sortBy: (req.query.sortBy as any) || 'createdAt',
        sortOrder: (req.query.sortOrder as any) || 'DESC'
      };

      const result = await jobSaveService.getSavedJobs(userId, queryParams);
      ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  }


  /**
   * @swagger
   * /saved-jobs/count:
   *   get:
   *     summary: Lấy số lượng công việc đã lưu
   *     description: Lấy tổng số công việc mà người tìm việc đã lưu
   *     tags: [Công việc đã lưu]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lấy số lượng thành công
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     count:
   *                       type: integer
   *                       example: 5
   *       401:
   *         description: Không có quyền truy cập
   */
  async getSavedJobCount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.error(res, 'Vui lòng đăng nhập', 401);
        return;
      }

      // Chỉ cho phép user (người tìm việc) xem số lượng
      if (req.user?.userType !== 'user') {
        ResponseUtil.error(res, 'Chỉ người tìm việc mới có thể xem số lượng công việc đã lưu', 403);
        return;
      }

      const result = await jobSaveService.getSavedJobCount(userId);
      ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /saved-jobs/check/{jobId}:
   *   get:
   *     summary: Kiểm tra trạng thái lưu công việc
   *     description: Kiểm tra xem người tìm việc đã lưu công việc này chưa
   *     tags: [Công việc đã lưu]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: jobId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID của công việc
   *     responses:
   *       200:
   *         description: Kiểm tra thành công
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     isSaved:
   *                       type: boolean
   *                       example: true
   *       401:
   *         description: Không có quyền truy cập
   */
  async checkSaveStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.error(res, 'Vui lòng đăng nhập', 401);
        return;
      }

      if (!jobId || isNaN(parseInt(jobId))) {
        ResponseUtil.error(res, 'ID công việc không hợp lệ', 400);
        return;
      }

      // Chỉ cho phép user (người tìm việc) kiểm tra trạng thái
      if (req.user?.userType !== 'user') {
        ResponseUtil.error(res, 'Chỉ người tìm việc mới có thể kiểm tra trạng thái lưu', 403);
        return;
      }

      const result = await jobSaveService.checkSaveStatus(userId, parseInt(jobId));
      ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const jobSaveController = new JobSaveController();
