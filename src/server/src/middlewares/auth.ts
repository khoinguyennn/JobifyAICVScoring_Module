import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JWTPayload } from '@/types';
import { AppError } from './errorHandler';

/**
 * Kiểm tra xem route có nên bypass authentication không
 * @param url - URL của request
 * @param method - HTTP method
 * @returns boolean - true nếu nên bypass
 */
const shouldBypassAuthentication = (url: string, method: string): boolean => {
  // Exact match cho authentication routes
  const exactBypassRoutes = [
    'POST:/auth/users/sessions',       // User login
    'POST:/auth/companies/sessions',   // Company login
    'POST:/users',                     // User registration  
    'POST:/companies',                 // Company registration
    'GET:/health',                     // Health check
    'GET:/test',                       // Test endpoint
    'GET:/provinces',                  // Provinces list
    'GET:/fields',                     // Fields list
    'GET:/jobs',                       // Public job listings
    'GET:/jobs/stats',                 // Job statistics
    'GET:/companies',                  // Public company list
    'GET:/api-docs',                   // Swagger docs
    
    // Legacy routes (backward compatibility)
    'POST:/authUser/login',
    'POST:/authUser/register',
    'POST:/authCompany/login',
    'POST:/authCompany/register',
    'GET:/api/health'
  ];


  // Pattern match cho public read-only routes
  const publicReadOnlyPatterns = [
    { pattern: /^GET:\/users\/\d+$/, exact: true },           // GET /users/:id (public profile)
    { pattern: /^GET:\/companies\/\d+$/, exact: true },       // GET /companies/:id (public profile)
    { pattern: /^GET:\/jobs\/\d+$/, exact: true },           // GET /jobs/:id (public job detail)
    { pattern: /^GET:\/companies\/\d+\/jobs$/, exact: true } // GET /companies/:id/jobs (public company jobs)
  ];

  const routeKey = `${method}:${url.replace('/api', '')}`;

  // Check exact matches
  if (exactBypassRoutes.includes(routeKey)) {
    return true;
  }

  // Check pattern matches
  return publicReadOnlyPatterns.some(pattern => pattern.pattern.test(routeKey));
};

// Middleware xác thực JWT token
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check if route should bypass authentication
    if (shouldBypassAuthentication(req.originalUrl, req.method)) {
      return next();
    }
    
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      throw new AppError('Token không được cung cấp', 401);
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret không được cấu hình', 500);
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Token không hợp lệ', 401));
    } else {
      next(error);
    }
  }
};

// Middleware phân quyền theo user type
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Người dùng chưa được xác thực', 401));
    }

    if (!allowedRoles.includes(req.user.userType)) {
      return next(new AppError('Không có quyền truy cập', 403));
    }

    next();
  };
};

// Middleware optional authentication (cho logout)
// Verify token nếu có, nhưng không throw error nếu không có token
export const optionalAuthenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      // Không có token - vẫn cho phép request tiếp tục
      req.user = undefined;
      return next();
    }

    // Verify token nếu có
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret không được cấu hình', 500);
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      req.user = decoded;
    } catch (tokenError) {
      // Token không hợp lệ - vẫn cho phép request tiếp tục nhưng user = undefined
      req.user = undefined;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

