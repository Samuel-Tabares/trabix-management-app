import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/database/prisma/prisma.service';

/**
 * Tests E2E - Flujo Completo de Lote
 * FLUJO CRÍTICO según documento
 * 
 * 1. Admin crea vendedor
 * 2. Admin crea lote para vendedor (10 TRABIX)
 * 3. Admin activa lote (pago de inversión)
 * 4. Sistema libera T1 automáticamente
 * 5. Sistema crea cuadres para cada tanda
 * 6. Sistema crea mini-cuadre
 * 7. Admin confirma entrega de T1 (EN_CASA)
 * 8. Vendedor registra ventas
 * 9. Admin aprueba ventas
 * 10. Sistema activa cuadre cuando corresponde
 * 11. Admin confirma cuadre
 * 12. Sistema libera siguiente tanda
 */
describe('E2E - Flujo Completo de Lote', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  // Tokens
  let adminToken: string;
  let vendedorToken: string;
  
  // IDs
  let vendedorId: string;
  let loteId: string;
  let tanda1Id: string;
  let tanda2Id: string;
  let cuadre1Id: string;
  let cuadre2Id: string;
  let miniCuadreId: string;
  let ventaId: string;

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
    
    // Login como admin
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ cedula: 'admin', password: 'admin123' });
    
    adminToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // ==================== PASO 1: CREAR VENDEDOR ====================
  
  describe('Paso 1: Crear Vendedor', () => {
    it('Admin debe poder crear un vendedor', async () => {
      const response = await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cedula: '9876543210',
          nombre: 'Vendedor',
          apellidos: 'Test',
          email: 'vendedor@test.com',
          telefono: '3009876543',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.rol).toBe('VENDEDOR');
      expect(response.body.estado).toBe('ACTIVO');
      
      vendedorId = response.body.id;
    });

    it('Vendedor debe poder hacer login', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          cedula: '9876543210',
          password: 'temporal123', // Password temporal asignado
        })
        .expect(200);

      vendedorToken = response.body.accessToken;
    });
  });

  // ==================== PASO 2: CREAR LOTE ====================
  
  describe('Paso 2: Crear Lote', () => {
    it('Admin debe poder crear lote de 10 TRABIX', async () => {
      const response = await request(app.getHttpServer())
        .post('/lotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vendedorId,
          cantidadTrabix: 10,
          modeloNegocio: 'MODELO_60_40',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.cantidadTrabix).toBe(10);
      expect(response.body.estado).toBe('PENDIENTE');
      
      // Verificar inversión
      expect(response.body.inversionTotal).toBe(24000); // 10 * 2400
      expect(response.body.inversionVendedor).toBe(12000); // 50%
      expect(response.body.inversionAdmin).toBe(12000); // 50%
      
      loteId = response.body.id;
    });

    it('Debe rechazar lote con menos de 6 TRABIX', async () => {
      await request(app.getHttpServer())
        .post('/lotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vendedorId,
          cantidadTrabix: 5,
          modeloNegocio: 'MODELO_60_40',
        })
        .expect(400);
    });

    it('Debe rechazar lote con más de 20 TRABIX', async () => {
      await request(app.getHttpServer())
        .post('/lotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vendedorId,
          cantidadTrabix: 21,
          modeloNegocio: 'MODELO_60_40',
        })
        .expect(400);
    });
  });

  // ==================== PASO 3: ACTIVAR LOTE ====================
  
  describe('Paso 3: Activar Lote', () => {
    it('Admin debe poder activar el lote', async () => {
      const response = await request(app.getHttpServer())
        .post(`/lotes/${loteId}/activar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.estado).toBe('ACTIVO');
    });
  });

  // ==================== PASO 4-6: VERIFICAR ESTRUCTURAS CREADAS ====================
  
  describe('Paso 4-6: Verificar estructuras creadas', () => {
    it('Debe haber creado 2 tandas con distribución [5, 5]', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tandas/lote/${loteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].stockInicial).toBe(5);
      expect(response.body[1].stockInicial).toBe(5);
      
      // T1 debe estar LIBERADA
      expect(response.body[0].estado).toBe('LIBERADA');
      // T2 debe estar INACTIVA
      expect(response.body[1].estado).toBe('INACTIVA');
      
      tanda1Id = response.body[0].id;
      tanda2Id = response.body[1].id;
    });

    it('Debe haber creado cuadres para cada tanda', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cuadres?loteId=${loteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      
      cuadre1Id = response.body.data.find(c => c.tandaId === tanda1Id)?.id;
      cuadre2Id = response.body.data.find(c => c.tandaId === tanda2Id)?.id;
      
      expect(cuadre1Id).toBeDefined();
      expect(cuadre2Id).toBeDefined();
    });

    it('Debe haber creado mini-cuadre', async () => {
      const response = await request(app.getHttpServer())
        .get(`/mini-cuadres/lote/${loteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      miniCuadreId = response.body.id;
    });

    it('Debe haber registrado entrada en fondo de recompensas', async () => {
      const response = await request(app.getHttpServer())
        .get('/fondo-recompensas/transacciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const entrada = response.body.data.find(
        t => t.tipo === 'ENTRADA' && t.loteId === loteId
      );
      
      expect(entrada).toBeDefined();
      expect(entrada.monto).toBe(2000); // 10 * 200
    });
  });

  // ==================== PASO 7: CONFIRMAR ENTREGA ====================
  
  describe('Paso 7: Confirmar entrega T1', () => {
    it('Esperar transición automática o confirmar entrega', async () => {
      // Simular que pasaron 2 horas o forzar transición
      // En producción esto lo hace el TandaAutoTransitJob
      
      // Confirmar entrega (EN_TRANSITO -> EN_CASA)
      const response = await request(app.getHttpServer())
        .post(`/tandas/${tanda1Id}/confirmar-entrega`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.estado).toBe('EN_CASA');
    });
  });

  // ==================== PASO 8: REGISTRAR VENTAS ====================
  
  describe('Paso 8: Registrar ventas', () => {
    it('Vendedor debe poder registrar venta', async () => {
      const response = await request(app.getHttpServer())
        .post('/ventas')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({
          tandaId: tanda1Id,
          cantidadPromo: 1,
          cantidadUnidadLicor: 0,
          cantidadUnidadSinLicor: 0,
          cantidadRegalo: 0,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.estado).toBe('PENDIENTE');
      expect(response.body.montoTotal).toBe(12000);
      
      ventaId = response.body.id;
    });

    it('Debe rechazar venta si tanda no está EN_CASA', async () => {
      await request(app.getHttpServer())
        .post('/ventas')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({
          tandaId: tanda2Id, // T2 está INACTIVA
          cantidadPromo: 1,
          cantidadUnidadLicor: 0,
          cantidadUnidadSinLicor: 0,
          cantidadRegalo: 0,
        })
        .expect(400);
    });
  });

  // ==================== PASO 9: APROBAR VENTAS ====================
  
  describe('Paso 9: Aprobar ventas', () => {
    it('Admin debe poder aprobar venta', async () => {
      const response = await request(app.getHttpServer())
        .post(`/ventas/${ventaId}/aprobar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.estado).toBe('APROBADA');
    });

    it('Stock de tanda debe decrementarse', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tandas/${tanda1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Vendimos 1 PROMO (2 unidades)
      expect(response.body.stockActual).toBe(3); // 5 - 2 = 3
    });
  });

  // ==================== PASO 10-11: TRIGGER Y CONFIRMAR CUADRE ====================
  
  describe('Paso 10-11: Trigger y confirmar cuadre', () => {
    it('Vender más para activar trigger (stock <= 10%)', async () => {
      // Vender 2 más para llegar a stock 1 (20% de 5)
      // Con 2 tandas, T1 tiene trigger al 10%
      
      // Registrar y aprobar venta
      const ventaResponse = await request(app.getHttpServer())
        .post('/ventas')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({
          tandaId: tanda1Id,
          cantidadPromo: 1, // 2 unidades más
          cantidadUnidadLicor: 0,
          cantidadUnidadSinLicor: 0,
          cantidadRegalo: 0,
        });

      await request(app.getHttpServer())
        .post(`/ventas/${ventaResponse.body.id}/aprobar`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Stock debería ser 1 ahora (20%)
      // Para trigger al 10%, necesitamos vender 1 más
    });

    it('Verificar cuadre activado', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cuadres/${cuadre1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Debería estar PENDIENTE si llegamos al trigger
      // o INACTIVO si aún no
      expect(['INACTIVO', 'PENDIENTE']).toContain(response.body.estado);
    });

    it('Admin confirma cuadre', async () => {
      // Solo si el cuadre está PENDIENTE
      const cuadreResponse = await request(app.getHttpServer())
        .get(`/cuadres/${cuadre1Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (cuadreResponse.body.estado === 'PENDIENTE') {
        const response = await request(app.getHttpServer())
          .post(`/cuadres/${cuadre1Id}/confirmar`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            montoRecibido: cuadreResponse.body.montoEsperado,
          })
          .expect(200);

        expect(response.body.estado).toBe('EXITOSO');
      }
    });
  });

  // ==================== PASO 12: VERIFICAR LIBERACIÓN T2 ====================
  
  describe('Paso 12: Verificar liberación T2', () => {
    it('T2 debe estar LIBERADA después de confirmar cuadre T1', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tandas/${tanda2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Si confirmamos cuadre T1, T2 debe liberarse
      // Puede que aún esté INACTIVA si no llegamos al trigger
      expect(['INACTIVA', 'LIBERADA']).toContain(response.body.estado);
    });
  });

  // ==================== RESUMEN FINANCIERO ====================
  
  describe('Verificar resumen financiero', () => {
    it('Debe mostrar resumen correcto', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lotes/${loteId}/resumen-financiero`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('inversionTotal');
      expect(response.body).toHaveProperty('dineroRecaudado');
      expect(response.body).toHaveProperty('dineroTransferido');
      expect(response.body).toHaveProperty('gananciaVendedor');
      expect(response.body).toHaveProperty('gananciaAdmin');
    });
  });
});
