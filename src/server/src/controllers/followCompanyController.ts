import { Request, Response, NextFunction } from 'express';
import { followCompanyService } from '@/services/followCompanyService';
import { AuthenticatedRequest, FollowCompanyQueryParams } from '@/types';
import { ResponseUtil } from '@/utils/response';

export class FollowCompanyController {
  /**
   * @swagger
   * /followed-companies:
   *   post:
   *     summary: Theo dõi công ty
   *     description: Theo dõi một công ty vào danh sách yêu thích của người tìm việc
   *     tags: [Công ty đã theo dõi]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - idCompany
   *             properties:
   *               idCompany:
   *                 type: integer
   *                 description: ID của công ty muốn theo dõi
   *                 example: 1
   *     responses:
   *       201:
   *         description: Theo dõi công ty thành công
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
   *                   example: "Theo dõi công ty thành công"
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                     idUser:
   *                       type: integer
   *                     idCompany:
   *                       type: integer
   *       400:
   *         description: Đã theo dõi công ty này rồi hoặc công ty không tồn tại
   *       401:
   *         description: Không có quyền truy cập (chỉ dành cho người tìm việc)
   */
  async followCompany(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idCompany } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.error(res, 'Vui lòng đăng nhập', 401);
        return;
      }

      if (!idCompany) {
        ResponseUtil.error(res, 'ID công ty không hợp lệ', 400);
        return;
      }

      // Chỉ cho phép user (người tìm việc) theo dõi công ty
      if (req.user?.userType !== 'user') {
        ResponseUtil.error(res, 'Chỉ người tìm việc mới có thể theo dõi công ty', 403);
        return;
      }

      const result = await followCompanyService.followCompany({
        idUser: userId,
        idCompany: parseInt(idCompany)
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
   * /followed-companies/{companyId}:
   *   delete:
   *     summary: Hủy theo dõi công ty
   *     description: Xóa công ty khỏi danh sách theo dõi của người tìm việc
   *     tags: [Công ty đã theo dõi]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID của công ty muốn hủy theo dõi
   *     responses:
   *       200:
   *         description: Hủy theo dõi công ty thành công
   *       400:
   *         description: Chưa theo dõi công ty này
   *       401:
   *         description: Không có quyền truy cập
   */
  async unfollowCompany(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.error(res, 'Vui lòng đăng nhập', 401);
        return;
      }

      if (!companyId || isNaN(parseInt(companyId))) {
        ResponseUtil.error(res, 'ID công ty không hợp lệ', 400);
        return;
      }

      // Chỉ cho phép user (người tìm việc) hủy theo dõi công ty
      if (req.user?.userType !== 'user') {
        ResponseUtil.error(res, 'Chỉ người tìm việc mới có thể hủy theo dõi công ty', 403);
        return;
      }

      const result = await followCompanyService.unfollowCompany(userId, parseInt(companyId));

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
   * /followed-companies:
   *   get:
   *     summary: Lấy danh sách công ty đã theo dõi
   *     description: Lấy danh sách tất cả công ty mà người tìm việc đã theo dõi
   *     tags: [Công ty đã theo dõi]
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
   *         name: idProvince
   *         schema:
   *           type: integer
   *         description: Lọc theo tỉnh/thành phố
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Tìm kiếm theo tên công ty hoặc mô tả
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [createdAt, nameCompany]
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
   *                         $ref: '#/components/schemas/FollowCompanyWithDetails'
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
  async getFollowedCompanies(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.error(res, 'Vui lòng đăng nhập', 401);
        return;
      }

      // Chỉ cho phép user (người tìm việc) xem danh sách đã theo dõi
      if (req.user?.userType !== 'user') {
        ResponseUtil.error(res, 'Chỉ người tìm việc mới có thể xem danh sách công ty đã theo dõi', 403);
        return;
      }

      const queryParams: FollowCompanyQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
        idProvince: req.query.idProvince ? parseInt(req.query.idProvince as string) : undefined,
        search: req.query.search as string,
        sortBy: (req.query.sortBy as any) || 'createdAt',
        sortOrder: (req.query.sortOrder as any) || 'DESC'
      };

      const result = await followCompanyService.getFollowedCompanies(userId, queryParams);
      ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /followed-companies/count:
   *   get:
   *     summary: Lấy số lượng công ty đã theo dõi
   *     description: Lấy tổng số công ty mà người tìm việc đã theo dõi
   *     tags: [Công ty đã theo dõi]
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
   *                       example: 3
   *       401:
   *         description: Không có quyền truy cập
   */
  async getFollowedCompanyCount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.error(res, 'Vui lòng đăng nhập', 401);
        return;
      }

      // Chỉ cho phép user (người tìm việc) xem số lượng
      if (req.user?.userType !== 'user') {
        ResponseUtil.error(res, 'Chỉ người tìm việc mới có thể xem số lượng công ty đã theo dõi', 403);
        return;
      }

      const result = await followCompanyService.getFollowedCompanyCount(userId);
      ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /followed-companies/check/{companyId}:
   *   get:
   *     summary: Kiểm tra trạng thái theo dõi công ty
   *     description: Kiểm tra xem người tìm việc đã theo dõi công ty này chưa
   *     tags: [Công ty đã theo dõi]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID của công ty
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
   *                     isFollowed:
   *                       type: boolean
   *                       example: true
   *       401:
   *         description: Không có quyền truy cập
   */
  async checkFollowStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        ResponseUtil.error(res, 'Vui lòng đăng nhập', 401);
        return;
      }

      if (!companyId || isNaN(parseInt(companyId))) {
        ResponseUtil.error(res, 'ID công ty không hợp lệ', 400);
        return;
      }

      // Chỉ cho phép user (người tìm việc) kiểm tra trạng thái
      if (req.user?.userType !== 'user') {
        ResponseUtil.error(res, 'Chỉ người tìm việc mới có thể kiểm tra trạng thái theo dõi', 403);
        return;
      }

      const result = await followCompanyService.checkFollowStatus(userId, parseInt(companyId));
      ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const followCompanyController = new FollowCompanyController();
