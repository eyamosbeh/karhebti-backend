import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DocumentExpirationScheduler } from './document-expiration.scheduler';
import { NotificationsService } from '../../notifications/notifications.service';
import { DocumentEntity } from '../schemas/document.schema';
import { User } from '../../users/schemas/user.schema';

describe('DocumentExpirationScheduler', () => {
  let scheduler: DocumentExpirationScheduler;
  let mockDocumentModel: any;
  let mockUserModel: any;
  let mockNotificationsService: any;

  beforeEach(async () => {
    // Mock Models
    mockDocumentModel = {
      find: jest.fn(),
      updateOne: jest.fn(),
    };

    mockUserModel = {
      findById: jest.fn(),
    };

    mockNotificationsService = {
      sendNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentExpirationScheduler,
        {
          provide: getModelToken(DocumentEntity.name),
          useValue: mockDocumentModel,
        },
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    scheduler = module.get<DocumentExpirationScheduler>(
      DocumentExpirationScheduler,
    );
  });

  describe('checkDocumentExpiration', () => {
    it('should find documents expiring within 7 days', async () => {
      const mockDocuments = [
        {
          _id: 'doc1',
          type: 'assurance',
          dateExpiration: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          voiture: {
            _id: 'car1',
            user: { _id: 'user1', deviceToken: 'valid_token' },
          },
        },
      ];

      mockDocumentModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDocuments),
      });

      mockUserModel.findById.mockResolvedValue({
        _id: 'user1',
        deviceToken: 'valid_token',
      });

      mockNotificationsService.sendNotification.mockResolvedValue(true);
      mockDocumentModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await scheduler.checkDocumentExpiration();

      expect(mockDocumentModel.find).toHaveBeenCalled();
      expect(mockNotificationsService.sendNotification).toHaveBeenCalled();
    });

    it('should not send notification if user has no device token', async () => {
      const mockDocuments = [
        {
          _id: 'doc1',
          type: 'carte grise',
          dateExpiration: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          voiture: {
            _id: 'car1',
            user: { _id: 'user1', deviceToken: null },
          },
        },
      ];

      mockDocumentModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDocuments),
      });

      mockUserModel.findById.mockResolvedValue({
        _id: 'user1',
        deviceToken: null,
      });

      await scheduler.checkDocumentExpiration();

      expect(mockNotificationsService.sendNotification).not.toHaveBeenCalled();
    });

    it('should handle documents without car reference gracefully', async () => {
      const mockDocuments = [
        {
          _id: 'doc1',
          type: 'contrôle technique',
          dateExpiration: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          voiture: null,
        },
      ];

      mockDocumentModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDocuments),
      });

      await scheduler.checkDocumentExpiration();

      expect(mockNotificationsService.sendNotification).not.toHaveBeenCalled();
    });

    it('should calculate correct days remaining', async () => {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const mockDocuments = [
        {
          _id: 'doc1',
          type: 'assurance',
          dateExpiration: threeDaysFromNow,
          voiture: {
            _id: 'car1',
            user: { _id: 'user1', deviceToken: 'valid_token' },
          },
        },
      ];

      mockDocumentModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDocuments),
      });

      mockUserModel.findById.mockResolvedValue({
        _id: 'user1',
        deviceToken: 'valid_token',
      });

      mockNotificationsService.sendNotification.mockResolvedValue(true);
      mockDocumentModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await scheduler.checkDocumentExpiration();

      const callArgs = mockNotificationsService.sendNotification.mock.calls[0];
      expect(callArgs[0].data).toBeDefined();
      expect(callArgs[0].data.daysRemaining).toBeDefined();
    });

    it('should mark document as notified after sending notification', async () => {
      const mockDocuments = [
        {
          _id: 'doc1',
          type: 'carte grise',
          dateExpiration: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          voiture: {
            _id: 'car1',
            user: { _id: 'user1', deviceToken: 'valid_token' },
          },
        },
      ];

      mockDocumentModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDocuments),
      });

      mockUserModel.findById.mockResolvedValue({
        _id: 'user1',
        deviceToken: 'valid_token',
      });

      mockNotificationsService.sendNotification.mockResolvedValue(true);
      mockDocumentModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await scheduler.checkDocumentExpiration();

      expect(mockDocumentModel.updateOne).toHaveBeenCalledWith(
        { _id: 'doc1' },
        { notificationSent: true },
      );
    });

    it('should not send notifications for already notified documents', async () => {
      const mockDocuments = [];

      mockDocumentModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDocuments),
      });

      await scheduler.checkDocumentExpiration();

      expect(mockNotificationsService.sendNotification).not.toHaveBeenCalled();
    });
  });

  describe('Document Type Labels', () => {
    it('should get correct label for assurance', async () => {
      const mockDocuments = [
        {
          _id: 'doc1',
          type: 'assurance',
          dateExpiration: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          voiture: {
            _id: 'car1',
            user: { _id: 'user1', deviceToken: 'valid_token' },
          },
        },
      ];

      mockDocumentModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDocuments),
      });

      mockUserModel.findById.mockResolvedValue({
        _id: 'user1',
        deviceToken: 'valid_token',
      });

      mockNotificationsService.sendNotification.mockResolvedValue(true);
      mockDocumentModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await scheduler.checkDocumentExpiration();

      const callArgs = mockNotificationsService.sendNotification.mock.calls[0];
      expect(callArgs[0].titre).toContain('Assurance automobile');
    });
  });
});
