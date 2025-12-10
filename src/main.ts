import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { LoggerService } from './common/logger/logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Custom logger
  const logger = new LoggerService();
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  const isDevelopment = process.env.NODE_ENV !== 'production';

  const commonCspDirectives: Record<string, readonly string[]> = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
    imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
    connectSrc: [
      "'self'",
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https:',
    ],
    fontSrc: ["'self'", 'https:', 'data:'],
    mediaSrc: ["'self'", 'data:', 'blob:'],
    objectSrc: ["'none'"],
    frameAncestors: ["'self'"],
  };

  const devConnectSrc = [
    "'self'",
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'ws://localhost:3000',
    'ws://127.0.0.1:3000',
    'ws://localhost:3001',
    'ws://127.0.0.1:3001',
    'ws://localhost:5173',
    'ws://127.0.0.1:5173',
    'https:',
  ];

  app.disable('x-powered-by');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      frameguard: { action: 'sameorigin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          ...commonCspDirectives,
          connectSrc: isDevelopment ? devConnectSrc : commonCspDirectives.connectSrc,
        },
      },
    }),
  );

  // Serve static files from uploads directory
  const uploadsPath = join(process.cwd(), 'uploads');
  logger.log(`📁 Serving static files from: ${uploadsPath}`);
  
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  // Enable CORS with environment variable support
  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global pipes for validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // Global logging interceptor (only in development)
  if (process.env.NODE_ENV !== 'production') {
    app.useGlobalInterceptors(new LoggingInterceptor(logger));
  }

  // Trust proxy (important for production behind reverse proxy)
  app.set('trust proxy', 1);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📊 Health check available at: http://localhost:${port}/health`);
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});
