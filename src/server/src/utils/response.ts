import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '@/types';

// Utility functions cho response chuẩn
export class ResponseUtil {
  // Success response
  static success<T>(res: Response, data: T, message?: string, statusCode = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };
    res.status(statusCode).json(response);
  }

  // Error response
  static error(res: Response, message: string, statusCode = 400): void {
    const response: ApiResponse = {
      success: false,
      error: message,
    };
    res.status(statusCode).json(response);
  }

  // Created response (201)
  static created<T>(res: Response, data: T, message = 'Tạo thành công'): void {
    this.success(res, data, message, 201);
  }

  // No content response (204)
  static noContent(res: Response): void {
    res.status(204).send();
  }

  // Paginated response
  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message?: string
  ): void {
    const totalPages = Math.ceil(total / limit);
    
    const response: ApiResponse<PaginatedResponse<T>> = {
      success: true,
      data: {
        data,
        total,
        page,
        limit,
        totalPages,
      },
      message,
    };
    
    res.status(200).json(response);
  }
}

