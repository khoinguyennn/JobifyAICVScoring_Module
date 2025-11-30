import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '@/services/companyService';
import { AuthenticatedRequest } from '@/types';
import { ResponseUtil } from '@/utils/response';
import { catchAsync } from '@/middlewares/errorHandler';

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  /**
   * @swagger
   * /companies/{id}:
   *   get:
   *     tags: [Nhà tuyển dụng]
   *     summary: Lấy thông tin công ty theo ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID của công ty
   *     responses:
   *       200:
   *         description: Lấy thông tin công ty thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Company'
   *       401:
   *         description: Chưa xác thực
   *       404:
   *         description: Công ty không tồn tại
   */
  getCompanyById = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const companyId = parseInt(req.params.id);
    
    const company = await this.companyService.getCompanyById(companyId);
    
    ResponseUtil.success(res, company, 'Lấy thông tin công ty thành công');
  });

  /**
   * @swagger
   * /companies/me:
   *   get:
   *     tags: [Nhà tuyển dụng]
   *     summary: Lấy thông tin công ty hiện tại
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lấy thông tin công ty thành công
   *       401:
   *         description: Chưa xác thực
   *       403:
   *         description: Không có quyền truy cập
   */
  getCurrentCompany = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.userType !== 'company') {
      return ResponseUtil.error(res, 'Không có quyền truy cập', 403);
    }

    const company = await this.companyService.getCompanyById(req.user.id);
    
    ResponseUtil.success(res, company, 'Lấy thông tin công ty hiện tại thành công');
  });

  /**
   * @swagger
   * /companies:
   *   get:
   *     tags: [Nhà tuyển dụng]
   *     summary: Lấy danh sách tất cả công ty (có phân trang và tìm kiếm)
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Số trang
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Số lượng công ty mỗi trang
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: Từ khóa tìm kiếm (tên công ty hoặc giới thiệu)
   *         example: "Facebook"
   *       - in: query
   *         name: province
   *         schema:
   *           type: integer
   *         description: Tìm kiếm theo ID tỉnh/thành phố
   *         example: 20
   *       - in: query
   *         name: scale
   *         schema:
   *           type: string
   *         description: Tìm kiếm theo quy mô công ty
   *         example: "100 - 500"
   *         enum:
   *           - "20 - 100"
   *           - "100 - 500"
   *           - "500 - 1000"
   *           - "1000 - 5000"
   *           - "nhiều hơn 5000"
   *     responses:
   *       200:
   *         description: Lấy danh sách công ty thành công
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/PaginatedResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         allOf:
   *                           - $ref: '#/components/schemas/Company'
   *                           - type: object
   *                             properties:
   *                               jobCount:
   *                                 type: integer
   *                                 description: Số lượng việc làm hiện có của công ty
   *                                 example: 25
   *                               provinceName:
   *                                 type: string
   *                                 description: Tên tỉnh/thành phố
   *                                 example: "Trà Vinh"
   *                               provinceFullName:
   *                                 type: string
   *                                 description: Tên đầy đủ tỉnh/thành phố
   *                                 example: "Tỉnh Trà Vinh"
   */
  getAllCompanies = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Extract search parameters
    const searchParams: {
      keyword?: string;
      province?: number;
      scale?: string;
    } = {};

    if (req.query.keyword) {
      searchParams.keyword = req.query.keyword as string;
    }

    if (req.query.province) {
      searchParams.province = parseInt(req.query.province as string);
    }

    if (req.query.scale) {
      searchParams.scale = req.query.scale as string;
    }

    const result = await this.companyService.getAllCompanies(page, limit, searchParams);
    
    ResponseUtil.paginated(
      res, 
      result.data, 
      result.total, 
      result.page, 
      result.limit, 
      'Lấy danh sách công ty thành công'
    );
  });

  /**
   * @swagger
   * /companies/{id}:
   *   put:
   *     tags: [Nhà tuyển dụng]
   *     summary: Cập nhật thông tin công ty
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
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
   *               phone:
   *                 type: string
   *                 example: "0123456789"
   *               idProvince:
   *                 type: integer
   *                 example: 1
   *               web:
   *                 type: string
   *                 example: https://company.com
   *               scale:
   *                 type: string
   *                 example: "100-500 người"
   *     responses:
   *       200:
   *         description: Cập nhật thông tin thành công
   *       401:
   *         description: Chưa xác thực
   *       403:
   *         description: Không có quyền truy cập
   *       409:
   *         description: Email đã được sử dụng
   */
  updateCompany = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.userType !== 'company') {
      return ResponseUtil.error(res, 'Không có quyền truy cập', 403);
    }

    const { nameCompany, nameAdmin, email, phone, idProvince, web, scale } = req.body;
    
    const updatedCompany = await this.companyService.updateCompanyProfile(req.user.id, {
      nameCompany,
      nameAdmin,
      email,
      phone,
      idProvince,
      web,
      scale,
    });

    ResponseUtil.success(res, updatedCompany, 'Cập nhật thông tin công ty thành công');
  });

  /**
   * @swagger
   * /companies/{id}/intro:
   *   put:
   *     tags: [Nhà tuyển dụng]
   *     summary: Cập nhật giới thiệu công ty
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
   *                 example: Công ty chúng tôi chuyên về phát triển phần mềm...
   *     responses:
   *       200:
   *         description: Cập nhật giới thiệu thành công
   *       401:
   *         description: Chưa xác thực
   *       403:
   *         description: Không có quyền truy cập
   */
  updateCompanyIntro = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.userType !== 'company') {
      return ResponseUtil.error(res, 'Không có quyền truy cập', 403);
    }

    const { intro } = req.body;
    
    if (!intro) {
      return ResponseUtil.error(res, 'Nội dung giới thiệu là bắt buộc', 400);
    }

    await this.companyService.updateCompanyIntro(req.user.id, intro);

    ResponseUtil.success(res, null, 'Cập nhật giới thiệu công ty thành công');
  });

  /**
   * @swagger
   * /companies/{id}/avatar:
   *   put:
   *     tags: [Nhà tuyển dụng]
   *     summary: Upload logo công ty
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID của công ty
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
   *                 description: File logo công ty (chỉ JPG và PNG - Max 5MB)
   *     responses:
   *       200:
   *         description: Upload logo công ty thành công
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
   *                     logoUrl:
   *                       type: string
   *                       example: "http://localhost:5000/uploads/logos/avatar-2-550e8400-e29b-41d4-a716-446655440000.png"
   *                     fileName:
   *                       type: string
   *                       example: "logos/avatar-2-550e8400-e29b-41d4-a716-446655440000.png"
   *                 message:
   *                   type: string
   *                   example: "Upload logo công ty thành công"
   *       400:
   *         description: File không hợp lệ hoặc quá lớn
   *       401:
   *         description: Chưa xác thực
   *       403:
   *         description: Không có quyền cập nhật company này
   */
  updateCompanyAvatar = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.userType !== 'company') {
      return ResponseUtil.error(res, 'Không có quyền truy cập', 403);
    }

    const companyId = parseInt(req.params.id);
    
    // Kiểm tra ownership (company chỉ có thể update logo của chính mình)
    if (Number(req.user.id) !== companyId) {
      return ResponseUtil.error(res, 'Bạn chỉ có thể cập nhật logo của công ty mình', 403);
    }

    if (!req.file) {
      return ResponseUtil.error(res, 'Vui lòng chọn file logo để upload', 400);
    }

    // Xóa logo cũ nếu có
    const currentCompany = await this.companyService.getCompanyById(companyId);
    if (currentCompany.avatarPic) {
      const { deleteOldFile } = await import('@/middlewares/upload');
      deleteOldFile(currentCompany.avatarPic);
    }

    // Tạo relative path để lưu vào database
    const relativePath = `logos/${req.file.filename}`;
    
    // Update company với path mới
    await this.companyService.updateCompanyAvatar(companyId, relativePath);

    // Tạo full URL để trả về cho client
    const { getFileUrl } = await import('@/middlewares/upload');
    const logoUrl = getFileUrl(relativePath);

    ResponseUtil.success(res, {
      logoUrl,
      fileName: relativePath
    }, 'Upload logo công ty thành công');
  });
}



