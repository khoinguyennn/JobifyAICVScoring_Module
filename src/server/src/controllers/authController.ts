import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/authService';
import { AuthenticatedRequest } from '@/types';
import { ResponseUtil } from '@/utils/response';
import { catchAsync } from '@/middlewares/errorHandler';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // ===== USER AUTHENTICATION =====

  /**
   * @swagger
   * /auth/users/sessions:
   *   post:
   *     tags: [Xác thực người tìm việc]
   *     summary: Đăng nhập người tìm việc
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 example: user@example.com
   *               password:
   *                 type: string
   *                 example: password123
   *     responses:
   *       200:
   *         description: Đăng nhập thành công
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       401:
   *         description: Sai email hoặc mật khẩu
   *       404:
   *         description: Email không tồn tại
   */
  loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return ResponseUtil.error(res, 'Email và mật khẩu là bắt buộc', 400);
      }

      const result = await this.authService.loginUser(email, password);

      ResponseUtil.success(res, result, 'Đăng nhập thành công');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /users:
   *   post:
   *     tags: [Xác thực người tìm việc]
   *     summary: Đăng ký tài khoản người tìm việc
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - password
   *               - phone
   *             properties:
   *               name:
   *                 type: string
   *                 example: Nguyễn Văn A
   *               email:
   *                 type: string
   *                 example: user@example.com
   *               password:
   *                 type: string
   *                 example: password123
   *               phone:
   *                 type: string
   *                 example: "0123456789"
   *               idProvince:
   *                 type: integer
   *                 example: 1
   *     responses:
   *       201:
   *         description: Đăng ký thành công
   *       409:
   *         description: Email đã được sử dụng
   */
  registerUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, phone, idProvince } = req.body;

    if (!name || !email || !password || !phone) {
      return ResponseUtil.error(res, 'Tên, email, mật khẩu và số điện thoại là bắt buộc', 400);
    }

    const result = await this.authService.registerUser({
      name,
      email,
      password,
      phone,
      idProvince,
    });

    ResponseUtil.created(res, result, 'Đăng ký tài khoản thành công');
  });

  /**
   * @swagger
   * /users/{id}/password:
   *   post:
   *     tags: [Xác thực người tìm việc]
   *     summary: Đổi mật khẩu người tìm việc
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
   *             required:
   *               - passwordOld
   *               - password
   *             properties:
   *               passwordOld:
   *                 type: string
   *                 example: oldpassword123
   *               password:
   *                 type: string
   *                 example: newpassword123
   *     responses:
   *       200:
   *         description: Đổi mật khẩu thành công
   *       401:
   *         description: Mật khẩu cũ không chính xác
   *       404:
   *         description: Người dùng không tồn tại
   */
  changeUserPassword = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = parseInt(req.params.id);
    const { passwordOld, password } = req.body;

    if (!passwordOld || !password) {
      return ResponseUtil.error(res, 'Mật khẩu cũ và mật khẩu mới là bắt buộc', 400);
    }

    // Kiểm tra authentication
    if (!req.user) {
      return ResponseUtil.error(res, 'Người dùng chưa đăng nhập', 401);
    }

    // Kiểm tra user type
    if (req.user.userType !== 'user') {
      return ResponseUtil.error(res, 'Chỉ người tìm việc mới có thể đổi mật khẩu user', 403);
    }

    // Kiểm tra ownership (user chỉ có thể đổi mật khẩu của chính mình)
    if (Number(req.user.id) !== userId) {
      return ResponseUtil.error(res, 'Bạn chỉ có thể đổi mật khẩu của chính mình', 403);
    }

    await this.authService.changeUserPassword(userId, passwordOld, password);

    ResponseUtil.success(res, null, 'Đổi mật khẩu thành công');
  });

  // ===== COMPANY AUTHENTICATION =====

  /**
   * @swagger
   * /auth/companies/sessions:
   *   post:
   *     tags: [Xác thực nhà tuyển dụng]
   *     summary: Đăng nhập nhà tuyển dụng
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 example: company@example.com
   *               password:
   *                 type: string
   *                 example: password123
   *     responses:
   *       200:
   *         description: Đăng nhập thành công
   *       401:
   *         description: Sai email hoặc mật khẩu
   *       404:
   *         description: Email không tồn tại
   */
  loginCompany = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return ResponseUtil.error(res, 'Email và mật khẩu là bắt buộc', 400);
    }

    const result = await this.authService.loginCompany(email, password);

    ResponseUtil.success(res, result, 'Đăng nhập thành công');
  });

  /**
   * @swagger
   * /companies:
   *   post:
   *     tags: [Xác thực nhà tuyển dụng]
   *     summary: Đăng ký tài khoản nhà tuyển dụng
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - nameCompany
   *               - nameAdmin
   *               - email
   *               - password
   *               - phone
   *             properties:
   *               nameCompany:
   *                 type: string
   *                 example: Công ty ABC
   *               nameAdmin:
   *                 type: string
   *                 example: Nguyễn Văn B
   *               email:
   *                 type: string
   *                 example: company@example.com
   *               password:
   *                 type: string
   *                 example: password123
   *               phone:
   *                 type: string
   *                 example: "0123456789"
   *               idProvince:
   *                 type: integer
   *                 example: 1
   *               scale:
   *                 type: string
   *                 example: "100-500 người"
   *     responses:
   *       201:
   *         description: Đăng ký thành công
   *       409:
   *         description: Email đã được sử dụng
   */
  registerCompany = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { nameCompany, nameAdmin, email, password, phone, idProvince, scale } = req.body;

    if (!nameCompany || !nameAdmin || !email || !password || !phone) {
      return ResponseUtil.error(res, 'Thông tin bắt buộc: nameCompany, nameAdmin, email, password, phone', 400);
    }

    const result = await this.authService.registerCompany({
      nameCompany,
      nameAdmin,
      email,
      password,
      phone,
      idProvince, // Optional - có thể undefined
      scale,
    });

    ResponseUtil.created(res, result, 'Đăng ký tài khoản công ty thành công');
  });

  /**
   * @swagger
   * /companies/{id}/password:
   *   post:
   *     tags: [Xác thực nhà tuyển dụng]
   *     summary: Đổi mật khẩu nhà tuyển dụng
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
   *             required:
   *               - passwordOld
   *               - password
   *             properties:
   *               passwordOld:
   *                 type: string
   *                 example: oldpassword123
   *               password:
   *                 type: string
   *                 example: newpassword123
   *     responses:
   *       200:
   *         description: Đổi mật khẩu thành công
   *       401:
   *         description: Mật khẩu cũ không chính xác
   *       404:
   *         description: Công ty không tồn tại
   */
  changeCompanyPassword = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const companyId = parseInt(req.params.id);
    const { passwordOld, password } = req.body;

    if (!passwordOld || !password) {
      return ResponseUtil.error(res, 'Mật khẩu cũ và mật khẩu mới là bắt buộc', 400);
    }

    // Kiểm tra authentication
    if (!req.user) {
      return ResponseUtil.error(res, 'Công ty chưa đăng nhập', 401);
    }

    // Kiểm tra user type
    if (req.user.userType !== 'company') {
      return ResponseUtil.error(res, 'Chỉ công ty mới có thể đổi mật khẩu công ty', 403);
    }

    // Kiểm tra ownership (company chỉ có thể đổi mật khẩu của chính mình)
    if (Number(req.user.id) !== companyId) {
      return ResponseUtil.error(res, 'Công ty chỉ có thể đổi mật khẩu của chính mình', 403);
    }

    await this.authService.changeCompanyPassword(companyId, passwordOld, password);

    ResponseUtil.success(res, null, 'Đổi mật khẩu thành công');
  });

  // ===== COMMON =====

  /**
   * @swagger
   * /auth/sessions:
   *   delete:
   *     tags: [Xác thực]
   *     summary: Đăng xuất chung cho user và company (token optional)
   *     description: API đăng xuất chung - hoạt động với hoặc không có token. Nếu có token sẽ hiển thị thông tin user type.
   *     security:
   *       - bearerAuth: []
   *       - {} 
   *     responses:
   *       200:
   *         description: Đăng xuất thành công
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
   *                     userType:
   *                       type: string
   *                       enum: [user, company]
   *                       example: user
   *                     message:
   *                       type: string
   *                       example: "Người tìm việc đã đăng xuất thành công"
   *                 message:
   *                   type: string
   *                   example: "Đăng xuất thành công"
   */
  logout = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Logout chung cho cả user và company
    if (req.user) {
      const userType = req.user.userType === 'user' ? 'Người tìm việc' : 'Nhà tuyển dụng';
      
      ResponseUtil.success(res, {
        userType: req.user.userType,
        message: `${userType} đã đăng xuất thành công`
      }, 'Đăng xuất thành công');
    } else {
      // Logout without token (client-side cleanup)
      ResponseUtil.success(res, null, 'Đăng xuất thành công');
    }
  });

  // ===== PASSWORD RESET =====

  /**
   * @swagger
   * /auth/forgot-password:
   *   post:
   *     tags: [Khôi phục mật khẩu]
   *     summary: Gửi email khôi phục mật khẩu
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: user@example.com
   *                 description: Email của người dùng cần khôi phục mật khẩu
   *     responses:
   *       200:
   *         description: Gửi email khôi phục thành công
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *             example:
   *               success: true
   *               data: null
   *               message: "Email khôi phục mật khẩu đã được gửi"
   *       400:
   *         description: Email không hợp lệ
   *       404:
   *         description: Email không tồn tại trong hệ thống
   *       500:
   *         description: Lỗi server khi gửi email
   */
  forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      return ResponseUtil.error(res, 'Email là bắt buộc', 400);
    }

    if (!email.includes('@')) {
      return ResponseUtil.error(res, 'Email không hợp lệ', 400);
    }

    await this.authService.forgotPassword(email);

    ResponseUtil.success(res, null, 'Email khôi phục mật khẩu đã được gửi');
  });

  /**
   * @swagger
   * /auth/reset-password/{token}:
   *   put:
   *     tags: [Khôi phục mật khẩu]
   *     summary: Đặt lại mật khẩu với token
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *         description: Token khôi phục mật khẩu
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - password
   *             properties:
   *               password:
   *                 type: string
   *                 minLength: 6
   *                 example: newpassword123
   *                 description: Mật khẩu mới (tối thiểu 6 ký tự)
   *     responses:
   *       200:
   *         description: Đặt lại mật khẩu thành công
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *             example:
   *               success: true
   *               data: null
   *               message: "Mật khẩu đã được đặt lại thành công"
   *       400:
   *         description: Token không hợp lệ hoặc đã hết hạn
   *       404:
   *         description: Token không tồn tại
   */
  resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return ResponseUtil.error(res, 'Mật khẩu mới là bắt buộc', 400);
    }

    if (password.length < 6) {
      return ResponseUtil.error(res, 'Mật khẩu phải có ít nhất 6 ký tự', 400);
    }

    await this.authService.resetPassword(token, password);

    ResponseUtil.success(res, null, 'Mật khẩu đã được đặt lại thành công');
  });

  // ===== COMPANY PASSWORD RESET =====

  /**
   * @swagger
   * /auth/companies/forgot-password:
   *   post:
   *     tags: [Khôi phục mật khẩu]
   *     summary: Gửi email khôi phục mật khẩu cho công ty
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: company@example.com
   *                 description: Email của công ty cần khôi phục mật khẩu
   *     responses:
   *       200:
   *         description: Gửi email khôi phục thành công
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *             example:
   *               success: true
   *               data: null
   *               message: "Email khôi phục mật khẩu đã được gửi"
   *       400:
   *         description: Email không hợp lệ
   *       404:
   *         description: Email không tồn tại trong hệ thống
   *       500:
   *         description: Lỗi server khi gửi email
   */
  forgotCompanyPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      return ResponseUtil.error(res, 'Email là bắt buộc', 400);
    }

    if (!email.includes('@')) {
      return ResponseUtil.error(res, 'Email không hợp lệ', 400);
    }

    await this.authService.forgotCompanyPassword(email);

    ResponseUtil.success(res, null, 'Email khôi phục mật khẩu đã được gửi');
  });

  /**
   * @swagger
   * /auth/companies/reset-password/{token}:
   *   put:
   *     tags: [Khôi phục mật khẩu]
   *     summary: Đặt lại mật khẩu công ty với token
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *         description: Token khôi phục mật khẩu
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - password
   *             properties:
   *               password:
   *                 type: string
   *                 minLength: 6
   *                 example: newpassword123
   *                 description: Mật khẩu mới (tối thiểu 6 ký tự)
   *     responses:
   *       200:
   *         description: Đặt lại mật khẩu thành công
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *             example:
   *               success: true
   *               data: null
   *               message: "Mật khẩu đã được đặt lại thành công"
   *       400:
   *         description: Token không hợp lệ hoặc đã hết hạn
   *       404:
   *         description: Token không tồn tại
   */
  resetCompanyPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return ResponseUtil.error(res, 'Mật khẩu mới là bắt buộc', 400);
    }

    if (password.length < 6) {
      return ResponseUtil.error(res, 'Mật khẩu phải có ít nhất 6 ký tự', 400);
    }

    await this.authService.resetCompanyPassword(token, password);

    ResponseUtil.success(res, null, 'Mật khẩu đã được đặt lại thành công');
  });
}


