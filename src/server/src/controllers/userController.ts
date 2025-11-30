import { Request, Response, NextFunction } from 'express';
import { UserService } from '@/services/userService';
import { AuthenticatedRequest } from '@/types';
import { ResponseUtil } from '@/utils/response';
import { catchAsync } from '@/middlewares/errorHandler';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     tags: [Người tìm việc]
   *     summary: Lấy thông tin người dùng theo ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID của người dùng
   *     responses:
   *       200:
   *         description: Lấy thông tin người dùng thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       401:
   *         description: Chưa xác thực
   *       404:
   *         description: Người dùng không tồn tại
   */
  getUserById = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = parseInt(req.params.id);
    
    const user = await this.userService.getUserById(userId);
    
    ResponseUtil.success(res, user, 'Lấy thông tin người dùng thành công');
  });

  /**
   * @swagger
   * /users/me:
   *   get:
   *     tags: [Người tìm việc]
   *     summary: Lấy thông tin người dùng hiện tại
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lấy thông tin người dùng thành công
   *       401:
   *         description: Chưa xác thực
   */
  getCurrentUser = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.userType !== 'user') {
      return ResponseUtil.error(res, 'Không có quyền truy cập', 403);
    }

    const user = await this.userService.getUserById(req.user.id);
    
    ResponseUtil.success(res, user, 'Lấy thông tin người dùng hiện tại thành công');
  });

  /**
   * @swagger
   * /users/{id}:
   *   put:
   *     tags: [Người tìm việc]
   *     summary: Cập nhật thông tin người dùng
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: Nguyễn Văn A
   *               birthDay:
   *                 type: string
   *                 format: date
   *                 example: "1990-01-01"
   *               sex:
   *                 type: string
   *                 enum: [Nam, Nữ, Khác]
   *                 example: Nam
   *               email:
   *                 type: string
   *                 example: user@example.com
   *               phone:
   *                 type: string
   *                 example: "0123456789"
   *               idProvince:
   *                 type: integer
   *                 example: 1
   *               linkSocial:
   *                 type: string
   *                 example: https://facebook.com/user
   *     responses:
   *       200:
   *         description: Cập nhật thông tin thành công
   *       401:
   *         description: Chưa xác thực
   *       409:
   *         description: Email đã được sử dụng
   */
  updateUser = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.userType !== 'user') {
      return ResponseUtil.error(res, 'Không có quyền truy cập', 403);
    }

    const { name, birthDay, sex, email, phone, idProvince, linkSocial } = req.body;
    
    const updatedUser = await this.userService.updateUserProfile(req.user.id, {
      name,
      birthDay: birthDay ? new Date(birthDay) : undefined,
      sex,
      email,
      phone,
      idProvince,
      linkSocial,
    });

    ResponseUtil.success(res, updatedUser, 'Cập nhật thông tin thành công');
  });

  /**
   * @swagger
   * /users/{id}/intro:
   *   put:
   *     tags: [Người tìm việc]
   *     summary: Cập nhật giới thiệu người dùng
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - intro
   *             properties:
   *               intro:
   *                 type: string
   *                 example: Tôi là một lập trình viên có 3 năm kinh nghiệm...
   *     responses:
   *       200:
   *         description: Cập nhật giới thiệu thành công
   *       401:
   *         description: Chưa xác thực
   */
  updateUserIntro = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.userType !== 'user') {
      return ResponseUtil.error(res, 'Không có quyền truy cập', 403);
    }

    const { intro } = req.body;
    
    if (!intro) {
      return ResponseUtil.error(res, 'Nội dung giới thiệu là bắt buộc', 400);
    }

    await this.userService.updateUserIntro(req.user.id, intro);

    ResponseUtil.success(res, null, 'Cập nhật giới thiệu thành công');
  });

  /**
   * @swagger
   * /users/{id}/avatar:
   *   put:
   *     tags: [Người tìm việc]
   *     summary: Upload ảnh đại diện người dùng
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID của người dùng
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               avatar:
   *                 type: string
   *                 format: binary
   *                 description: File ảnh đại diện (chỉ JPG và PNG - Max 5MB)
   *     responses:
   *       200:
   *         description: Upload ảnh đại diện thành công
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
   *                     avatarUrl:
   *                       type: string
   *                       example: "http://localhost:5000/uploads/avatars/avatar-1-550e8400-e29b-41d4-a716-446655440000.jpg"
   *                     fileName:
   *                       type: string
   *                       example: "avatars/avatar-1-550e8400-e29b-41d4-a716-446655440000.jpg"
   *                 message:
   *                   type: string
   *                   example: "Upload ảnh đại diện thành công"
   *       400:
   *         description: File không hợp lệ hoặc quá lớn
   *       401:
   *         description: Chưa xác thực
   *       403:
   *         description: Không có quyền cập nhật user này
   */
  updateUserAvatar = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.userType !== 'user') {
      return ResponseUtil.error(res, 'Không có quyền truy cập', 403);
    }

    const userId = parseInt(req.params.id);
    
    // Kiểm tra ownership (user chỉ có thể update avatar của chính mình)
    if (Number(req.user.id) !== userId) {
      return ResponseUtil.error(res, 'Bạn chỉ có thể cập nhật ảnh đại diện của chính mình', 403);
    }

    if (!req.file) {
      return ResponseUtil.error(res, 'Vui lòng chọn file ảnh để upload', 400);
    }

    // Xóa ảnh cũ nếu có
    const currentUser = await this.userService.getUserById(userId);
    if (currentUser.avatarPic) {
      const { deleteOldFile } = await import('@/middlewares/upload');
      deleteOldFile(currentUser.avatarPic);
    }

    // Tạo relative path để lưu vào database
    const relativePath = `avatars/${req.file.filename}`;
    
    // Update user với path mới  
    const updatedUser = await this.userService.updateUserAvatar(userId, relativePath);

    // Tạo full URL để trả về cho client
    const { getFileUrl } = await import('@/middlewares/upload');
    const avatarUrl = getFileUrl(relativePath);

    ResponseUtil.success(res, {
      user: updatedUser,
      avatarUrl,
      fileName: relativePath
    }, 'Upload ảnh đại diện thành công');
  });
}



