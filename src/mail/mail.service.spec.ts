import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import * as fs from 'fs';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

describe('MailService', () => {
  let service: MailService;
  let mailerService: MailerService;

  const mockMailerService = {
    sendMail: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendLoginMail', () => {
    const testEmail = 'test@example.com';

    beforeEach(() => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    });

    it('should send login notification email', async () => {
      mockMailerService.sendMail.mockResolvedValueOnce(undefined);

      await service.sendLoginMail(testEmail);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          from: '"NestJS App" <noreply@mynestjs-app.com>',
          subject: 'New Login to Your Account',
          html: expect.stringContaining(testEmail),
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Send mail failed');
      mockMailerService.sendMail.mockRejectedValueOnce(error);

      const consoleSpy = vi.spyOn(console, 'log');

      await service.sendLoginMail(testEmail);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Login notification email could not be sent, but login continues',
      );
      expect(consoleSpy).toHaveBeenCalledWith('Full error:', error);
    });
  });

  describe('sendVerifyMail', () => {
    const testEmail = 'test@example.com';
    const testLink = 'https://example.com/verify';

    beforeEach(() => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    });

    it('should send verification email', async () => {
      mockMailerService.sendMail.mockResolvedValueOnce(undefined);

      await service.sendVerifyMail(testEmail, testLink);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          from: '"NestJS App" <noreply@mynestjs-app.com>',
          subject: 'Verify Your Email Address',
          html: expect.stringContaining(testLink),
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Send mail failed');
      mockMailerService.sendMail.mockRejectedValueOnce(error);

      const consoleSpy = vi.spyOn(console, 'log');

      await service.sendVerifyMail(testEmail, testLink);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Verification email could not be sent.',
      );
      expect(consoleSpy).toHaveBeenCalledWith('Full error:', error);
    });
  });

  describe('sendResetPasswordMail', () => {
    const testEmail = 'test@example.com';
    const testCode = '123456';

    beforeEach(() => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    });

    it('should send reset password email', async () => {
      mockMailerService.sendMail.mockResolvedValueOnce(undefined);

      await service.sendResetPasswordMail(testEmail, testCode);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          from: '"NestJS App" <noreply@mynestjs-app.com>',
          subject: 'Reset Your Password',
          html: expect.stringContaining(testCode),
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Send mail failed');
      mockMailerService.sendMail.mockRejectedValueOnce(error);

      const consoleSpy = vi.spyOn(console, 'log');

      await service.sendResetPasswordMail(testEmail, testCode);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Password reset email could not be sent.',
      );
      expect(consoleSpy).toHaveBeenCalledWith('Full error:', error);
    });
  });
});
