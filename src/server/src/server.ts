import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection } from '@/config/database';
import { setupSwagger } from '@/config/swagger';
import { errorHandler, notFound } from '@/middlewares/errorHandler';
import { handleUploadError } from '@/middlewares/upload';
import { ResponseUtil } from '@/utils/response';
import { EmailService } from '@/services/emailService';

// Import routes
import authRoutes from '@/routes/authRoutes';
import referenceRoutes from '@/routes/referenceRoutes';
import userRoutes from '@/routes/userRoutes';
import companyRoutes from '@/routes/companyRoutes';
import jobRoutes from '@/routes/jobRoutes';
import jobSaveRoutes from '@/routes/jobSaveRoutes';
import followCompanyRoutes from '@/routes/followCompanyRoutes';
import cvScoringRoutes from '@/routes/cvScoringRoutes';

// Load environment variables
dotenv.config();

class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '5000');
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware với cấu hình cho static files
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginEmbedderPolicy: false
    }));
    
    // CORS middleware riêng cho static files (phải đặt trước static middleware)
    this.app.use('/uploads', (req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
    
    // Static files serving (cho uploaded images)
    this.app.use('/uploads', express.static('uploads', {
      maxAge: '1d', // Cache 1 ngày
      setHeaders: (res, path) => {
        // Set proper content type headers
        if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
          res.setHeader('Content-Type', 'image/jpeg');
        } else if (path.endsWith('.png')) {
          res.setHeader('Content-Type', 'image/png');
        } else if (path.endsWith('.gif')) {
          res.setHeader('Content-Type', 'image/gif');
        } else if (path.endsWith('.webp')) {
          res.setHeader('Content-Type', 'image/webp');
        }
      }
    }));
    
    // CORS configuration cho API routes - Updated for better compatibility
    this.app.use(cors({
      origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        // Allow localhost with any port in development
        if (process.env.NODE_ENV === 'development') {
          if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
          }
        }
        
        // Allow specific origins
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:3001', 
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          process.env.CORS_ORIGIN || 'http://localhost:3000',
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'Accept', 
        'Origin',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods'
      ],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      optionsSuccessStatus: 200, // For legacy browser support (IE11, various SmartTVs)
      preflightContinue: false
    }));

    // Additional CORS headers for better compatibility
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      
      // Log CORS requests in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`CORS Request: ${req.method} ${req.path} from ${origin || 'unknown'}`);
      }
      
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        console.log(`✅ CORS Preflight: ${req.path} from ${origin || 'unknown'}`);
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }
  }

  private initializeRoutes(): void {
    // Test route cho static files
    this.app.get('/test-upload', (req, res) => {
      res.json({
        message: 'Static files server is working',
        uploadPath: '/uploads/',
        testImage: '/uploads/logos/test.jpg'
      });
    });

    const apiPrefix = process.env.API_PREFIX || '/api';

    // Setup Swagger documentation
    setupSwagger(this.app);

    // Health check route
    this.app.get(`${apiPrefix}/health`, (req, res) => {
      ResponseUtil.success(res, {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: 'Connected',
      }, 'Server đang hoạt động bình thường');
    });

    // API routes
    this.app.use(apiPrefix, authRoutes);
    this.app.use(apiPrefix, referenceRoutes);
    this.app.use(apiPrefix, userRoutes);
    this.app.use(apiPrefix, companyRoutes);
    this.app.use(apiPrefix, jobRoutes);
    this.app.use(`${apiPrefix}/saved-jobs`, jobSaveRoutes);
    this.app.use(`${apiPrefix}/followed-companies`, followCompanyRoutes);
    this.app.use(apiPrefix, cvScoringRoutes);

    // Test route
    this.app.get(`${apiPrefix}/test`, (req, res) => {
      ResponseUtil.success(res, {
        message: 'API Jobify hoạt động thành công!',
        version: '1.0.0',
        swagger: `http://localhost:${this.port}/api-docs`,
        features: [
          'Authentication JWT',
          'Clean Architecture',
          'TypeScript',
          'MySQL Database',
          'Swagger Documentation',
          'Reference Data APIs',
        ],
      }, 'Test API thành công');
    });
  }

  private initializeErrorHandling(): void {
    // Handle multer upload errors
    this.app.use(handleUploadError);
    
    // Handle 404 routes
    this.app.use(notFound);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Test database connection
      await testConnection();
      
      // Test email service connection
      const emailService = new EmailService();
      await emailService.verifyConnection();
      
      // Start server
      this.app.listen(this.port, () => {
        console.log('🚀================================🚀');
        console.log(`🌟 Server Jobify đang chạy!`);
        console.log(`📍 URL: http://localhost:${this.port}`);
        console.log(`🌐 API: http://localhost:${this.port}${process.env.API_PREFIX || '/api'}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('🚀================================🚀');
      });
    } catch (error) {
      console.error('❌ Lỗi khởi động server:', error);
      process.exit(1);
    }
  }
}

// Khởi động server
const server = new Server();
server.start().catch((error) => {
  console.error('💥 Server startup failed:', error);
  process.exit(1);
});
