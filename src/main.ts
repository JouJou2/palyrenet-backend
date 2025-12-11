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

  const logger = new LoggerService();
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  const isDevelopment = process.env.NODE_ENV !== 'production';

  // ==============================================
  // ✅ Allowed Frontend Domains
  // ==============================================
  const allowedOrigins = [
    'https://palyrenet.com',
    'https://www.palyrenet.com',
    'https://palyrenet-backend.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  // ==============================================
  // ✅ Helmet (CSP + Security Headers)
  // ==============================================
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      frameguard: { action: 'sameorigin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          connectSrc: [
            "'self'",
            ...allowedOrigins,
            'ws://localhost:3001',
            'wss://palyrenet-backend.onrender.com',
          ],
          mediaSrc: ["'self'", 'data:', 'blob:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'self'"],
        },
      },
    }),
  );

  // ==============================================
  // ✅ Serve Static Upload Files
  // ==============================================
  const uploadsPath = join(process.cwd(), 'uploads');
  logger.log(`📁 Serving uploads: ${uploadsPath}`);

  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  // ==============================================
  // ✅ CORS CONFIGURATION
  // ==============================================
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // ==============================================
  // ✅ Request Validation
  // ==============================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ==============================================
  // ✅ Global Error Handler
  // ==============================================
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // ==============================================
  // ✅ Logging Interceptor (Dev only)
  // ==============================================
  if (isDevelopment) {
    app.useGlobalInterceptors(new LoggingInterceptor(logger));
  }

  // ==============================================
  // 🔥 PROXY FIX (Render → Hostinger)
  // ==============================================
  app.set('trust proxy', 1);

  // ==============================================
  // 🚀 Start Server
  // ==============================================
  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 Backend Online → Port ${port}`);
  logger.log(`🌍 Frontend Allowed → ${allowedOrigins.join(', ')}`);
  logger.log(`📊 Health Check → /health`);
  logger.log(`📦 Environment → ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Backend failed to start:', error);
  process.exit(1);
});
