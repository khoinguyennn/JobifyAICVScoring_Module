import { Notification, NotificationType } from '@/types';
import { RowDataPacket } from 'mysql2';

/**
 * Notification Model - Quản lý thông tin thông báo
 */
export class NotificationModel {
  // Map từ database row sang Notification object
  static fromRow(row: RowDataPacket): Notification {
    return {
      id: row.id,
      idUser: row.idUser,
      idCompany: row.idCompany,
      type: row.type,
      title: row.title,
      message: row.message,
      isRead: Boolean(row.isRead),
      createdAt: new Date(row.createdAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
    };
  }

  // Map từ Notification object sang database values
  static toRow(notification: Notification | Omit<Notification, 'id' | 'createdAt'>): any {
    const row: any = {};

    if ('id' in notification && notification.id) row.id = notification.id;
    if (notification.idUser !== undefined) row.idUser = notification.idUser;
    if (notification.idCompany !== undefined) row.idCompany = notification.idCompany;
    if (notification.type) row.type = notification.type;
    if (notification.title) row.title = notification.title;
    if (notification.message) row.message = notification.message;
    if (notification.isRead !== undefined) row.isRead = notification.isRead;

    // Tự động set createdAt cho bản ghi mới
    if (!('id' in notification) || !notification.id) {
      row.createdAt = new Date();
      row.isRead = row.isRead || false;
    }

    return row;
  }

  // Validation functions
  static validateNotification(data: Omit<Notification, 'id' | 'createdAt' | 'deletedAt'>): string[] {
    const errors: string[] = [];

    if (!data.idUser && !data.idCompany) {
      errors.push('Phải có ít nhất một người nhận (user hoặc company)');
    }

    if (!data.type || !Object.values(NotificationType).includes(data.type as NotificationType)) {
      errors.push('Loại thông báo không hợp lệ');
    }

    if (!data.title || data.title.trim().length < 3) {
      errors.push('Tiêu đề thông báo phải có ít nhất 3 ký tự');
    }

    if (!data.message || data.message.trim().length < 10) {
      errors.push('Nội dung thông báo phải có ít nhất 10 ký tự');
    }

    if (data.title && data.title.length > 255) {
      errors.push('Tiêu đề thông báo không được vượt quá 255 ký tự');
    }

    if (data.message && data.message.length > 1000) {
      errors.push('Nội dung thông báo không được vượt quá 1000 ký tự');
    }

    return errors;
  }

  // Utility functions
  static isActive(notification: Notification): boolean {
    return !notification.deletedAt;
  }

  static isRead(notification: Notification): boolean {
    return notification.isRead;
  }

  static isUnread(notification: Notification): boolean {
    return !notification.isRead;
  }

  // Get notification age in days
  static getNotificationAge(notification: Notification): number {
    const now = new Date();
    const created = new Date(notification.createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Filter functions
  static getByUser(notifications: Notification[], userId: number): Notification[] {
    return notifications.filter(notif => 
      notif.idUser === userId && this.isActive(notif)
    );
  }

  static getByCompany(notifications: Notification[], companyId: number): Notification[] {
    return notifications.filter(notif => 
      notif.idCompany === companyId && this.isActive(notif)
    );
  }

  static getByType(notifications: Notification[], type: NotificationType): Notification[] {
    return notifications.filter(notif => 
      notif.type === type && this.isActive(notif)
    );
  }

  static getUnread(notifications: Notification[]): Notification[] {
    return notifications.filter(notif => 
      this.isUnread(notif) && this.isActive(notif)
    );
  }

  static getRecent(notifications: Notification[], days: number = 7): Notification[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return notifications.filter(notif => 
      new Date(notif.createdAt) >= cutoffDate && this.isActive(notif)
    );
  }

  // Count functions
  static countUnreadByUser(notifications: Notification[], userId: number): number {
    return notifications.filter(notif => 
      notif.idUser === userId && 
      this.isUnread(notif) && 
      this.isActive(notif)
    ).length;
  }

  static countUnreadByCompany(notifications: Notification[], companyId: number): number {
    return notifications.filter(notif => 
      notif.idCompany === companyId && 
      this.isUnread(notif) && 
      this.isActive(notif)
    ).length;
  }

  // Helper functions để tạo thông báo mẫu
  static createJobApplicationNotification(
    companyId: number, 
    jobTitle: string, 
    applicantName: string
  ): Omit<Notification, 'id' | 'createdAt' | 'deletedAt'> {
    return {
      idCompany: companyId,
      idUser: undefined,
      type: NotificationType.JOB_APPLICATION,
      title: 'Đơn ứng tuyển mới',
      message: `${applicantName} vừa ứng tuyển vào vị trí "${jobTitle}"`,
      isRead: false,
    };
  }

  static createJobApprovedNotification(
    userId: number, 
    jobTitle: string, 
    companyName: string
  ): Omit<Notification, 'id' | 'createdAt' | 'deletedAt'> {
    return {
      idUser: userId,
      idCompany: undefined,
      type: NotificationType.JOB_APPROVED,
      title: 'Đơn ứng tuyển được chấp nhận',
      message: `Chúc mừng! Đơn ứng tuyển của bạn cho vị trí "${jobTitle}" tại ${companyName} đã được chấp nhận.`,
      isRead: false,
    };
  }

  static createJobRejectedNotification(
    userId: number, 
    jobTitle: string, 
    companyName: string
  ): Omit<Notification, 'id' | 'createdAt' | 'deletedAt'> {
    return {
      idUser: userId,
      idCompany: undefined,
      type: NotificationType.JOB_REJECTED,
      title: 'Kết quả ứng tuyển',
      message: `Rất tiếc, đơn ứng tuyển của bạn cho vị trí "${jobTitle}" tại ${companyName} không được chấp nhận lần này.`,
      isRead: false,
    };
  }

  static createNewJobPostedNotification(
    userId: number, 
    jobTitle: string, 
    companyName: string
  ): Omit<Notification, 'id' | 'createdAt' | 'deletedAt'> {
    return {
      idUser: userId,
      idCompany: undefined,
      type: NotificationType.NEW_JOB_POSTED,
      title: 'Việc làm mới từ công ty bạn theo dõi',
      message: `${companyName} vừa đăng tuyển vị trí "${jobTitle}". Hãy ứng tuyển ngay!`,
      isRead: false,
    };
  }

  // Pagination support
  static getWithPagination(
    notifications: Notification[], 
    page: number = 1, 
    limit: number = 20
  ): { data: Notification[]; total: number; page: number; limit: number; totalPages: number } {
    const activeNotifications = notifications.filter(notif => this.isActive(notif));
    const total = activeNotifications.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = activeNotifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages
    };
  }
}


