import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from '../notification.controller';
import { NotificationService } from '../../shared/services/notification.service';
import { JwtPayload } from '../../shared/types';
import { Notification } from '../../shared/entities/notification.entity';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: jest.Mocked<NotificationService>;

  const mockJwtPayload: JwtPayload = {
    sub: 5,
    email: 'manager@test.com',
    role: 'MANAGER',
    roleId: 2,
    fullName: 'Test Manager',
  } as JwtPayload;

  const mockRequest = mockJwtPayload;

  beforeEach(async () => {
    const mockService = {
      findByUserId: jest.fn(),
      getUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [{ provide: NotificationService, useValue: mockService }],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /notifications', () => {
    it('should return notifications and unread count for user', async () => {
      const mockNotifications = [
        { id: 1, userId: 5, message: 'test', isRead: false },
      ] as unknown as Notification[];
      const mockUnreadCount = 1;

      service.findByUserId.mockResolvedValue(mockNotifications);
      service.getUnreadCount.mockResolvedValue(mockUnreadCount);

      const result = await controller.getNotifications(mockRequest);

      expect(service['findByUserId']).toHaveBeenCalledWith(5);
      expect(service['getUnreadCount']).toHaveBeenCalledWith(5);
      expect(result).toEqual({
        notifications: mockNotifications,
        unreadCount: mockUnreadCount,
      });
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should call service.markAsRead and return success: true', async () => {
      service.markAsRead.mockResolvedValue(undefined);

      const result = await controller.markAsRead(mockRequest, 100);

      expect(service['markAsRead']).toHaveBeenCalledWith(100, 5);
      expect(result).toEqual({ success: true });
    });
  });

  describe('PATCH /notifications/read-all', () => {
    it('should call service.markAllAsRead and return success: true', async () => {
      service.markAllAsRead.mockResolvedValue(undefined);

      const result = await controller.markAllAsRead(mockRequest);

      expect(service['markAllAsRead']).toHaveBeenCalledWith(5);
      expect(result).toEqual({ success: true });
    });
  });
});
