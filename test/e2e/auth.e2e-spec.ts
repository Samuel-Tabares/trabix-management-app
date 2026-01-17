import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/database/prisma/prisma.service';

/**
 * Tests E2E - Configuración y Autenticación
 * Según sección 20.1 y 20.2 del documento
 */
describe('E2E - Auth & Setup', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let vendedorToken: string;

  // Datos de prueba
  const adminCredentials = {
    cedula: '1234567890',
    password: 'Admin123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));

    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();

    // Limpiar y sembrar datos de prueba
    await cleanDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await cleanDatabase();
    await app.close();
  });

  async function cleanDatabase() {
    // Eliminar en orden para respetar foreign keys
    const tablesToClean = [
      'notificaciones',
      'movimientos_fondo',
      'ganancias_reclutadores',
      'detalles_venta_mayor',
      'ventas_mayor',
      'mini_cuadres',
      'cuadres_mayor',
      'cuadres',
      'ventas',
      'tandas',
      'lotes',
      'equipamientos',
      'token_blacklist',
      'usuarios',
    ];

    for (const table of tablesToClean) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
      } catch (e) {
        // Ignorar si la tabla no existe
      }
    }
  }

  async function seedTestData() {
    // Crear admin
    await prisma.usuario.create({
      data: {
        cedula: adminCredentials.cedula,
        nombre: 'Admin',
        apellidos: 'Test',
        email: 'admin@test.com',
        telefono: '3001234567',
        password: '$2b$10$hashedPassword', // Bcrypt hash
        rol: 'ADMIN',
        estado: 'ACTIVO',
      },
    });
  }

  // ==================== HEALTH CHECK ====================
  
  describe('Health Check (20.1)', () => {
    it('GET /health - debe retornar estado OK', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('GET /health/db - debe retornar estado de base de datos', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/db')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  // ==================== AUTENTICACIÓN ====================
  
  describe('Auth (20.2)', () => {
    it('POST /auth/login - credenciales inválidas debe retornar 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          cedula: 'invalid',
          password: 'wrong',
        })
        .expect(401);
    });

    it('POST /auth/login - credenciales válidas debe retornar tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      
      adminToken = response.body.accessToken;
    });

    it('POST /auth/refresh - debe renovar access token', async () => {
      // Primero login para obtener refresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials);

      const refreshToken = loginResponse.body.refreshToken;

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });

    it('POST /auth/logout - debe cerrar sesión', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('Endpoint protegido sin token debe retornar 401', async () => {
      await request(app.getHttpServer())
        .get('/usuarios')
        .expect(401);
    });
  });
});
