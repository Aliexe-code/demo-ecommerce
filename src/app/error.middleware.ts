import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ErrorMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    try {
      next();
    } catch (err: unknown) {
      // Safely extract error properties
      let message = 'Unknown error';
      let stack: string | undefined;
      let modulePath: string | undefined;
      let exportName: string | undefined;

      if (typeof err === 'object' && err !== null) {
        message = (err as { message?: string }).message ?? message;
        stack = (err as { stack?: string }).stack;
        modulePath = (err as { modulePath?: string }).modulePath;
        exportName = (err as { exportName?: string }).exportName;
      }

      console.error('Module Resolution Error:', {
        error: message,
        stack,
        module: modulePath,
        export: exportName,
      });
      res.status(500).json({
        message: 'Module resolution failed',
        details: message,
      });
    }
  }
}
