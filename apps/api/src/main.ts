import 'dotenv/config';
process.env.TZ = process.env.TZ || process.env.TIMEZONE;
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { AppModule } from './app.module';

// Los secretos del JWT no admiten respaldo: sin them, cualquiera podría forjar
// tokens de administrador con el valor público del código.
for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
  if (!process.env[key] || process.env[key].length < 32) {
    throw new Error(
      `Variable de entorno "${key}" faltante o demasiado corta (mínimo 32 caracteres). ` +
      'La API no arranca sin sus secretos de JWT — configúralos en apps/api/.env o en el entorno del servidor.',
    );
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = parseInt(process.env.PORT || '3001', 10);

  // Límites de body por ruta (review PR #17):
  // - 15 MB SOLO en el endpoint de adjuntos de reportes: la evidencia llega
  //   como base64 (2 MB por imagen ≈ 2.7 MB en base64).
  // - 100 KB por defecto para TODA la API (incluye login y el resto).
  // El específico va primero; el body-parser por defecto ignora requests
  // ya parseadas — sin doble parseo.
  app.use('/api/reportes-campo/:id/adjuntos', json({ limit: '15mb' }));
  app.use(json({ limit: '100kb' }));

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
