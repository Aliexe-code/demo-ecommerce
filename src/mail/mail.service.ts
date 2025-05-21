import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { join } from 'node:path';
import * as fs from 'fs';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  public async sendLoginMail(email: string) {
    try {
      const templatePath = join(process.cwd(), 'src/mail/templates/login.ejs');
      console.log('Template exists:', fs.existsSync(templatePath));
      console.log('Template path:', templatePath);

      const today = new Date();
      const formattedDate = today.toLocaleDateString();
      const formattedTime = today.toLocaleTimeString();

      await this.mailerService
        .sendMail({
          to: email,
          from: `"NestJS App" <noreply@mynestjs-app.com>`,
          subject: 'New Login to Your Account',
          html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Login Notification</title>
                    <style>
                        body {
                            font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
                            margin: 0;
                            padding: 20px;
                            background-color: #f4f4f4;
                        }
                        .container {
                            background-color: #ffffff;
                            padding: 20px;
                            border-radius: 5px;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        }
                        h2 {
                            color: #333333;
                        }
                        .user-email {
                            color: blueviolet;
                            font-weight: bold;
                        }
                        .login-details {
                            color: #555555;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Hello <span class="user-email">${email}</span>,</h2>
                        <p class="login-details">
                            You logged in on ${formattedDate} at ${formattedTime}.
                        </p>
                        <p>If this was not you, please secure your account immediately.</p>
                    </div>
                </body>
                </html>
              `,
        })
        .catch((err) => {
          console.log(
            'Login notification email could not be sent, but login continues',
          );
          console.log('Full error:', err);
          console.log('Stack:', err.stack);
        });
    } catch (error) {
      console.log('Email error:', error);
    }
  }

  public async sendVerifyMail(email: string, link: string) {
    try {
      const templatePath = join(process.cwd(), 'src/mail/templates/login.ejs');
      console.log('Template exists:', fs.existsSync(templatePath));
      console.log('Template path:', templatePath);

      const today = new Date();

      await this.mailerService
        .sendMail({
          to: email,
          from: `"NestJS App" <noreply@mynestjs-app.com>`,
          subject: 'Verify Your Email Address',
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                <style>
                    body {
                        font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: #f4f4f4;
                    }
                    .container {
                        background-color: #ffffff;
                        padding: 20px;
                        border-radius: 5px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        text-align: center;
                    }
                    h2 {
                        color: #333333;
                    }
                    .user-email {
                        color: blueviolet;
                        font-weight: bold;
                    }
                    .verification-link {
                        display: inline-block;
                        padding: 10px 20px;
                        margin-top: 20px;
                        background-color: #007bff;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Hello <span class="user-email">${email}</span>,</h2>
                    <p>Thank you for registering! Please verify your email address by clicking the link below:</p>
                    <a href="${link}" class="verification-link">Verify Email</a>
                    <p>If you did not create an account, no further action is required.</p>
                </div>
            </body>
            </html>
          `,
        })
        .catch((err) => {
          console.log('Verification email could not be sent.');
          console.log('Full error:', err);
          console.log('Stack:', err.stack);
        });
    } catch (error) {
      console.log('Email error:', error);
    }
  }
  public async sendResetPasswordMail(email: string, code: string) {
    try {
      const templatePath = join(process.cwd(), 'src/mail/templates/login.ejs');
      console.log('Template exists:', fs.existsSync(templatePath));
      console.log('Template path:', templatePath);

      const today = new Date();

      await this.mailerService
        .sendMail({
          to: email,
          from: `"NestJS App" <noreply@mynestjs-app.com>`,
          subject: 'Reset Your Password',
          html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Password Reset</title>
              <style>
                  body {
                      font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
                      margin: 0;
                      padding: 20px;
                      background-color: #f4f4f4;
                  }
                  .container {
                      background-color: #ffffff;
                      padding: 20px;
                      border-radius: 5px;
                      box-shadow: 0 0 10px rgba(0,0,0,0.1);
                      text-align: center;
                  }
                  h2 {
                      color: #333333;
                  }
                  .user-email {
                      color: blueviolet;
                      font-weight: bold;
                  }
                  .reset-code {
                      font-size: 32px;
                      letter-spacing: 5px;
                      font-weight: bold;
                      color: #dc3545;
                      margin: 20px 0;
                      padding: 10px;
                      background-color: #f8f9fa;
                      border-radius: 5px;
                      display: inline-block;
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  <h2>Hello <span class="user-email">${email}</span>,</h2>
                  <p>We received a request to reset your password. Use the 6-digit code below to reset your password:</p>
                  <div class="reset-code">${code}</div>
                  <p>Enter this code along with your new password on the password reset page.</p>
                  <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                  <p>This code will expire in 1 hour for security reasons.</p>
              </div>
          </body>
          </html>
        `,
        })
        .catch((err) => {
          console.log('Password reset email could not be sent.');
          console.log('Full error:', err);
          console.log('Stack:', err.stack);
        });
    } catch (error) {
      console.log('Email error:', error);
    }
  }
}
