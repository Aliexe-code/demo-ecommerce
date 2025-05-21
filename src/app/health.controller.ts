import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller('health')
export class HealthController {
  @Throttle({ default: { limit: 3, ttl: 6000 } })
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    };
  }
}
