import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ErrorHandlingMiddleware } from '../middleware/errorhandling.middleware';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: false,
        level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname,context',
                  messageFormat:
                    '{msg} [method={req.method} url={req.url} status={res.statusCode}]',
                },
              }
            : undefined,
        redact: ['req.headers.authorization'],
        messageKey: 'message',
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ErrorHandlingMiddleware).forRoutes('*');
  }
}
