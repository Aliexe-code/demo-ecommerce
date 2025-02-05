import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'nestjs-pino';

@Injectable()
export class ErrorHandlingMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = performance.now();

    res.on('finish', () => {
      const duration = performance.now() - start;
      const { method, originalUrl } = req;
      const { statusCode } = res;

      this.logger[statusCode >= 400 ? 'error' : 'log']({
        event: 'http_request',
        method,
        path: originalUrl,
        status: statusCode,
        latency: duration.toFixed(3) + 'ms',
        userAgent: req.headers['user-agent']?.substring(0, 50),
        ip: req.ip,
      });
    });

    next();
  }
}
