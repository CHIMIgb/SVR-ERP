/**
 * E2E tests for /api/clientes/:clienteId/cotizaciones — real HTTP + real DB.
 *
 * Boots the full AppModule (guards, PermissionsGuard, TransformInterceptor,
 * AllExceptionsFilter, global ValidationPipe) and makes HTTP requests via
 * supertest against the real PostgreSQL database.
 *
 * Run with: npm run test:e2e
 * Requires: PostgreSQL running with svr_erp database.
 */
import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const ADMIN_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // seed admin
const ADMIN_EMAIL = 'admin@svr-constructora.com';

describe('Cotizaciones e2e (HTTP real)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let httpServer: any;

  let clienteId: string;

  let usuarioSinRolId: string;
  let personaSinRolId: string;
  let tokenUsuarioSinRol: string;
  let tokenAdmin: string;

  const unique = randomUUID().slice(0, 8);

  const signToken = (sub: string, email: string) =>
    jwt.sign(
      { sub, email, jti: randomUUID(), tipo: 'access', sessionId: randomUUID() },
      {
        expiresIn: '15m',
        secret: process.env.JWT_ACCESS_SECRET || 'svr-erp-access-secret-dev',
      },
    );

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    prisma = module.get(PrismaService);
    jwt = module.get(JwtService);
    httpServer = app.getHttpServer();

    // ── Cliente temporal ──
    const cliente = await prisma.clientes.create({
      data: {
        id: randomUUID(),
        codigo: `E2E-${unique}`,
        nombre: `Cliente E2E ${unique}`,
        empresa: `Empresa E2E ${unique}`,
        correo: `e2e-${unique}@test.mx`,
        telefono: '55-0000-0000',
        actualizado_en: new Date(),
      },
    });
    clienteId = cliente.id;

    // ── Usuario SIN roles (debe dar 403) ──
    personaSinRolId = randomUUID();
    usuarioSinRolId = randomUUID();
    await prisma.personas.create({
      data: {
        id: personaSinRolId,
        nombre: `E2E SinRol ${unique}`,
        correo: `sinrol-${unique}@test.mx`,
        actualizado_en: new Date(),
      },
    });
    await prisma.users.create({
      data: {
        id: usuarioSinRolId,
        persona_id: personaSinRolId,
        email: `sinrol-${unique}@test.mx`,
        password_hash: 'no-used',
        actualizado_en: new Date(),
      },
    });
    tokenUsuarioSinRol = signToken(usuarioSinRolId, `sinrol-${unique}@test.mx`);

    // ── Token admin (seed) ──
    tokenAdmin = signToken(ADMIN_USER_ID, ADMIN_EMAIL);
  });

  afterAll(async () => {
    // Cleanup FK-safe: cotizaciones → clientes → users → personas
    await prisma.cotizaciones.deleteMany({ where: { cliente_id: clienteId } });
    await prisma.clientes.delete({ where: { id: clienteId } });
    await prisma.users.delete({ where: { id: usuarioSinRolId } });
    await prisma.personas.delete({ where: { id: personaSinRolId } });
    // registro_auditoria es inmutable — se deja.
    await app.close();
    await prisma.$disconnect();
  });

  const validBody = () => ({
    descripcion: `Cotización E2E ${randomUUID().slice(0, 6)}`,
    monto: 1250.5,
    fecha: '2026-08-20',
  });

  describe('sin token', () => {
    it('GET historial → 401', async () => {
      await request(httpServer).get(`/api/clientes/${clienteId}/cotizaciones`).expect(401);
    });

    it('POST crear → 401', async () => {
      await request(httpServer)
        .post(`/api/clientes/${clienteId}/cotizaciones`)
        .send(validBody())
        .expect(401);
    });
  });

  describe('con token de usuario sin permisos', () => {
    it('GET historial → 403', async () => {
      await request(httpServer)
        .get(`/api/clientes/${clienteId}/cotizaciones`)
        .set('Authorization', `Bearer ${tokenUsuarioSinRol}`)
        .expect(403);
    });

    it('POST crear → 403', async () => {
      await request(httpServer)
        .post(`/api/clientes/${clienteId}/cotizaciones`)
        .set('Authorization', `Bearer ${tokenUsuarioSinRol}`)
        .send(validBody())
        .expect(403);
    });
  });

  describe('con token admin', () => {
    it('POST crear cotización → 201 (success:true, data.codigo COT-...)', async () => {
      const res = await request(httpServer)
        .post(`/api/clientes/${clienteId}/cotizaciones`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(validBody())
        .expect(201);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.clienteId).toBe(clienteId);
      expect(res.body.data.descripcion).toBeDefined();
      expect(res.body.data.codigo).toMatch(/^COT-\d{8}-/);
      expect(typeof res.body.data.monto).toBe('number');
      expect(res.body.data.fecha).toBeDefined();
    });

    it('GET historial → 200 con la cotización creada', async () => {
      const res = await request(httpServer)
        .get(`/api/clientes/${clienteId}/cotizaciones`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('items');
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });
});
