import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types';

// Custom Error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handling middleware
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Lỗi server nội bộ';

  // Nếu là AppError (lỗi đã được định nghĩa)
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Log error chi tiết trong development
  if (process.env.NODE_ENV === 'development') {
    console.error('🔥 Error Stack:', error.stack);
  }

  // Response lỗi chuẩn
  const response: ApiResponse = {
    success: false,
    error: message,
  };

  res.status(statusCode).json(response);
};

// Middleware xử lý route không tồn tại
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} không tồn tại`, 404);
  next(error);
};

// Async error catcher utility
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

