import 'dotenv/config';
process.env.TZ = process.env.TZ || process.env.TIMEZONE || 'America/Mexico_City';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = parseInt(process.env.PORT || '3001', 10);

  // Prefijo global para todos los endpoints
  app.setGlobalPrefix('api');

  // CORS — permitir frontend en desarrollo
  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : frontendUrl
      ? [frontendUrl]
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
        ];

  console.log(`CORS origenes permitidos: ${allowedOrigins.join(', ')}`);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Permitir requests sin origin (Postman, curl, mobile apps) o si el origin está en la lista
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validación global con class-validator
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

  await app.listen(port, '0.0.0.0');
  console.log(`Zona horaria configurada: ${process.env.TZ}`);
  console.log(
    `API SVR-ERP corriendo en http://localhost:${port}/api (y en todos las interfaces de red, ej. http://192.168.x.x:${port}/api)`,
  );
}
bootstrap();
