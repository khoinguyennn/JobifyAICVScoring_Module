import { Router } from 'express';
import { CVScoringController } from '@/controllers/cvScoringController';
import multer from 'multer';
import path from 'path';
import { AppError } from '@/middlewares/errorHandler';
import fs from 'fs';

const router = Router();
const cvScoringController = new CVScoringController();

// Custom multer config for CV files
const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/cvs';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const uniqueName = `cv-${timestamp}${extension}`;
    cb(null, uniqueName);
  }
});

const cvFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Chỉ hỗ trợ file PDF, DOCX, JPG, PNG', 400));
  }
};

const uploadCVFile = multer({
  storage: cvStorage,
  fileFilter: cvFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1
  }
}).single('cvFile');

// ===== CV SCORING ROUTES =====

/**
 * POST /cv-score - Chấm điểm CV với file upload
 * POST /cv-score/demo - Demo chấm điểm CV không cần file
 */

// Middleware wrapper để handle multer errors
const handleCVUpload = (req: any, res: any, next: any) => {
  uploadCVFile(req, res, (error: any) => {
    if (error) {
      console.error('❌ Multer Upload Error:', error);
      
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File quá lớn. Kích thước tối đa 10MB'
          });
        } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            error: 'Field name không hợp lệ. Vui lòng sử dụng field "cvFile"'
          });
        }
      } else if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Lỗi upload file: ' + error.message
      });
    }
    
    console.log('✅ File uploaded successfully:', req.file?.originalname);
    next();
  });
};

// Route với file upload - sử dụng custom multer middleware
router.post('/cv-score', handleCVUpload, cvScoringController.scoreCV);

// Demo route không cần file upload  
router.post('/cv-score/demo', cvScoringController.demoScoreCV);

// Test Gemini AI connection route
router.get('/cv-score/test-gemini', cvScoringController.testGemini);

export default router;




