import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from './errorHandler';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Tạo thư mục upload nếu chưa tồn tại
const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Tạo thư mục upload: ${dirPath}`);
  }
};

// Đảm bảo các thư mục upload tồn tại
const uploadPaths = {
  avatars: 'uploads/avatars',
  logos: 'uploads/logos',
  cvs: 'uploads/cvs',
  temp: 'uploads/temp'
};

// Tạo các thư mục khi khởi động server
Object.values(uploadPaths).forEach(ensureDirectoryExists);

// Cấu hình storage cho multer
const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    let uploadPath = uploadPaths.temp; // Default fallback
    
    // Xác định thư mục dựa trên route
    if (req.originalUrl.includes('/users/') && req.originalUrl.includes('/avatar')) {
      uploadPath = uploadPaths.avatars;
    } else if (req.originalUrl.includes('/companies/') && req.originalUrl.includes('/avatar')) {
      uploadPath = uploadPaths.logos;
    } else if (file.fieldname === 'cvFile') {
      uploadPath = uploadPaths.cvs;
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req: Request, file, cb) => {
    // Tạo tên file unique với UUID
    const userId = req.params.id || 'unknown';
    const uuid = uuidv4();
    const extension = path.extname(file.originalname);
    
    // Format: {fieldname}-{userId}-{uuid}.{ext}
    // VD: avatar-1-550e8400-e29b-41d4-a716-446655440000.jpg
    const uniqueName = `${file.fieldname}-${userId}-${uuid}${extension}`;
    cb(null, uniqueName);
  }
});

// File filter để validate file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
  // Chỉ chấp nhận hình ảnh cho avatar/logo
  if (file.fieldname === 'avatar' || file.fieldname === 'logo') {
    if (file.mimetype.startsWith('image/')) {
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new AppError('Chỉ chấp nhận file ảnh định dạng JPG và PNG', 400));
      }
    } else {
      cb(new AppError('Chỉ chấp nhận file hình ảnh', 400));
    }
  }
  // CV files
  else if (file.fieldname === 'cv') {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('CV chỉ chấp nhận file PDF, DOC, DOCX', 400));
    }
  }
  else {
    cb(new AppError('Field không hợp lệ', 400));
  }
};

// Cấu hình upload limits
const uploadLimits = {
  fileSize: 5 * 1024 * 1024, // 5MB max
  files: 1, // Chỉ 1 file mỗi request
};

// Multer instance chính
const upload = multer({
  storage,
  fileFilter,
  limits: uploadLimits,
});

// Middleware cho upload avatar user
export const uploadUserAvatar = upload.single('avatar');

// Middleware cho upload logo company  
export const uploadCompanyLogo = upload.single('avatar'); // Vẫn dùng field name 'avatar' cho consistency

// Middleware cho upload CV
export const uploadCV = upload.single('cv');

// Middleware cho upload multiple files (nếu cần sau này)
export const uploadMultiple = upload.array('files', 5);

// Utility functions
export const getFileUrl = (filePath: string): string => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${filePath}`;
};

export const getRelativePath = (fullUrl: string): string => {
  return fullUrl.replace(/^.*\/uploads\//, '');
};

// Cleanup old file khi update avatar
export const deleteOldFile = (filePath: string): void => {
  try {
    if (filePath && fs.existsSync(`uploads/${filePath}`)) {
      fs.unlinkSync(`uploads/${filePath}`);
      console.log(`🗑️  Đã xóa file cũ: ${filePath}`);
    }
  } catch (error) {
    console.error('❌ Lỗi xóa file cũ:', error);
  }
};

// Error handling cho multer
export const handleUploadError = (error: any, req: Request, res: any, next: any): void => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File quá lớn. Kích thước tối đa 5MB'
      });
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Chỉ được upload 1 file mỗi lần'
      });
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Field name không hợp lệ'
      });
    }
  }
  
  next(error);
};
