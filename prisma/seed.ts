/**
 * ===========================================
 * TRABIX Backend - SEED UNIFICADO COMPLETO
 * ===========================================
 *
 * Para resetear BD: npx prisma migrate reset
 */

import {
    PrismaClient,
    Rol,
    EstadoUsuario,
    ModeloNegocio,
    EstadoLote,
    EstadoTanda,
    EstadoVenta,
    EstadoCuadre,
    EstadoMiniCuadre,
    ConceptoCuadre,
    TipoVenta,
    Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============ UTILIDADES ============
const hash = (pwd: string) => bcrypt.hashSync(pwd, 12);
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000);
const decimal = (n: number) => new Prisma.Decimal(n);

// Variables globales de configuración
let CONFIG: Record<string, number> = {};
let COSTO_INV: number;
let APORTE_FONDO: number;
let PRECIO_UNI: number;
let PRECIO_PROMO: number;
let PRECIO_SL: number;
let DEPOSITO: number;
let MENS_CON: number;
let MENS_SIN: number;
let DANO_NEV: number;
let DANO_PIJ: number;
let MIN_VMAYOR: number;

async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║              🌱 TRABIX - SEED UNIFICADO COMPLETO                             ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    console.log('');

    // =========================================================================
    // PARTE 1: TIPOS DE INSUMO OBLIGATORIOS
    // =========================================================================
    console.log('📦 [1/12] Creando tipos de insumo obligatorios...');

    const tiposInsumo = [
        { nombre: 'Granizado', esObligatorio: true },
        { nombre: 'Pitillos', esObligatorio: true },
        { nombre: 'Etiquetas', esObligatorio: true },
        { nombre: 'Tablas nutricionales', esObligatorio: true },
        { nombre: 'Envío', esObligatorio: true },
    ];

    for (const tipo of tiposInsumo) {
        await prisma.tipoInsumo.upsert({
            where: { nombre: tipo.nombre },
            update: {},
            create: tipo,
        });
    }
    console.log(`   ✅ ${tiposInsumo.length} tipos de insumo creados`);

    // =========================================================================
    // PARTE 2: CONFIGURACIONES DEL SISTEMA
    // =========================================================================
    console.log('\n⚙️ [2/12] Creando configuraciones del sistema...');

    const configuraciones = [
        // === PRECIOS (claves originales) ===
        { clave: 'COSTO_PERCIBIDO', valor: '2400', tipo: 'DECIMAL', descripcion: 'Costo percibido por TRABIX', categoria: 'PRECIOS' },
        { clave: 'PRECIO_PROMO', valor: '12000', tipo: 'DECIMAL', descripcion: 'Precio PROMO (2 con licor)', categoria: 'PRECIOS' },
        { clave: 'PRECIO_UNIDAD_LICOR', valor: '8000', tipo: 'DECIMAL', descripcion: 'Precio UNIDAD con licor', categoria: 'PRECIOS' },
        { clave: 'PRECIO_UNIDAD_SIN_LICOR', valor: '7000', tipo: 'DECIMAL', descripcion: 'Precio UNIDAD sin licor', categoria: 'PRECIOS' },
        { clave: 'PRECIO_MAYOR_20_LICOR', valor: '4900', tipo: 'DECIMAL', descripcion: 'Precio mayor >20 con licor', categoria: 'PRECIOS' },
        { clave: 'PRECIO_MAYOR_50_LICOR', valor: '4700', tipo: 'DECIMAL', descripcion: 'Precio mayor >50 con licor', categoria: 'PRECIOS' },
        { clave: 'PRECIO_MAYOR_100_LICOR', valor: '4500', tipo: 'DECIMAL', descripcion: 'Precio mayor >100 con licor', categoria: 'PRECIOS' },
        { clave: 'PRECIO_MAYOR_20_SIN_LICOR', valor: '4800', tipo: 'DECIMAL', descripcion: 'Precio mayor >20 sin licor', categoria: 'PRECIOS' },
        { clave: 'PRECIO_MAYOR_50_SIN_LICOR', valor: '4500', tipo: 'DECIMAL', descripcion: 'Precio mayor >50 sin licor', categoria: 'PRECIOS' },
        { clave: 'PRECIO_MAYOR_100_SIN_LICOR', valor: '4200', tipo: 'DECIMAL', descripcion: 'Precio mayor >100 sin licor', categoria: 'PRECIOS' },

        // === PRECIOS (claves requeridas por test-scenarios) ===
        { clave: 'COSTO_INVERSION_TRABIX', valor: '2400', tipo: 'DECIMAL', descripcion: 'Costo inversión por TRABIX (alias)', categoria: 'PRECIOS' },
        { clave: 'PRECIO_UNIDAD', valor: '8000', tipo: 'DECIMAL', descripcion: 'Precio UNIDAD (alias)', categoria: 'PRECIOS' },
        { clave: 'PRECIO_SIN_LICOR', valor: '7000', tipo: 'DECIMAL', descripcion: 'Precio sin licor (alias)', categoria: 'PRECIOS' },
        { clave: 'COSTO_DEPOSITO', valor: '49990', tipo: 'DECIMAL', descripcion: 'Costo depósito equipamiento (alias)', categoria: 'PRECIOS' },
        { clave: 'MINIMO_VENTA_MAYOR', valor: '20', tipo: 'INT', descripcion: 'Mínimo unidades para venta mayor', categoria: 'PRECIOS' },

        // === PORCENTAJES ===
        { clave: 'APORTE_FONDO', valor: '200', tipo: 'DECIMAL', descripcion: 'Aporte al fondo por TRABIX', categoria: 'PORCENTAJES' },
        { clave: 'APORTE_FONDO_POR_TRABIX', valor: '200', tipo: 'DECIMAL', descripcion: 'Aporte al fondo por TRABIX (alias)', categoria: 'PORCENTAJES' },
        { clave: 'PORCENTAJE_GANANCIA_VENDEDOR_60_40', valor: '60', tipo: 'PERCENT', descripcion: 'Porcentaje ganancia vendedor 60/40', categoria: 'PORCENTAJES' },
        { clave: 'PORCENTAJE_GANANCIA_ADMIN_60_40', valor: '40', tipo: 'PERCENT', descripcion: 'Porcentaje ganancia admin 60/40', categoria: 'PORCENTAJES' },
        { clave: 'PORCENTAJE_GANANCIA_VENDEDOR_50_50', valor: '50', tipo: 'PERCENT', descripcion: 'Porcentaje ganancia vendedor 50/50', categoria: 'PORCENTAJES' },
        { clave: 'PORCENTAJE_INVERSION_VENDEDOR', valor: '50', tipo: 'PERCENT', descripcion: 'Porcentaje inversión vendedor', categoria: 'PORCENTAJES' },
        { clave: 'LIMITE_REGALOS', valor: '8', tipo: 'PERCENT', descripcion: 'Límite de regalos', categoria: 'PORCENTAJES' },
        { clave: 'TRIGGER_CUADRE_T2', valor: '10', tipo: 'PERCENT', descripcion: 'Trigger cuadre T2 (3 tandas)', categoria: 'PORCENTAJES' },
        { clave: 'TRIGGER_CUADRE_T3', valor: '20', tipo: 'PERCENT', descripcion: 'Trigger cuadre T3 (3 tandas)', categoria: 'PORCENTAJES' },
        { clave: 'TRIGGER_CUADRE_T1_2TANDAS', valor: '10', tipo: 'PERCENT', descripcion: 'Trigger cuadre T1 (2 tandas)', categoria: 'PORCENTAJES' },
        { clave: 'TRIGGER_CUADRE_T2_2TANDAS', valor: '20', tipo: 'PERCENT', descripcion: 'Trigger cuadre T2 (2 tandas)', categoria: 'PORCENTAJES' },

        // === EQUIPAMIENTO ===
        { clave: 'MENSUALIDAD_CON_DEPOSITO', valor: '9990', tipo: 'DECIMAL', descripcion: 'Mensualidad con depósito', categoria: 'EQUIPAMIENTO' },
        { clave: 'MENSUALIDAD_SIN_DEPOSITO', valor: '19990', tipo: 'DECIMAL', descripcion: 'Mensualidad sin depósito', categoria: 'EQUIPAMIENTO' },
        { clave: 'DEPOSITO_EQUIPAMIENTO', valor: '49990', tipo: 'DECIMAL', descripcion: 'Depósito equipamiento', categoria: 'EQUIPAMIENTO' },
        { clave: 'COSTO_DANO_NEVERA', valor: '30000', tipo: 'DECIMAL', descripcion: 'Costo daño nevera', categoria: 'EQUIPAMIENTO' },
        { clave: 'COSTO_DANO_PIJAMA', valor: '60000', tipo: 'DECIMAL', descripcion: 'Costo daño pijama', categoria: 'EQUIPAMIENTO' },

        // === TIEMPOS ===
        { clave: 'TIEMPO_AUTO_TRANSITO_HORAS', valor: '2', tipo: 'INT', descripcion: 'Tiempo auto-tránsito tanda', categoria: 'TIEMPOS' },
    ];

    for (const config of configuraciones) {
        await prisma.configuracionSistema.upsert({
            where: { clave: config.clave },
            update: {},
            create: config,
        });
    }
    console.log(`   ✅ ${configuraciones.length} configuraciones creadas`);

    // Cargar configuraciones en memoria
    const cfgs = await prisma.configuracionSistema.findMany();
    for (const cfg of cfgs) CONFIG[cfg.clave] = Number.parseFloat(cfg.valor);

    // Asignar a variables globales
    COSTO_INV = CONFIG['COSTO_INVERSION_TRABIX'];
    APORTE_FONDO = CONFIG['APORTE_FONDO_POR_TRABIX'];
    PRECIO_UNI = CONFIG['PRECIO_UNIDAD'];
    PRECIO_PROMO = CONFIG['PRECIO_PROMO'];
    PRECIO_SL = CONFIG['PRECIO_SIN_LICOR'];
    DEPOSITO = CONFIG['COSTO_DEPOSITO'];
    MENS_CON = CONFIG['MENSUALIDAD_CON_DEPOSITO'];
    MENS_SIN = CONFIG['MENSUALIDAD_SIN_DEPOSITO'];
    DANO_NEV = CONFIG['COSTO_DANO_NEVERA'];
    DANO_PIJ = CONFIG['COSTO_DANO_PIJAMA'];
    MIN_VMAYOR = CONFIG['MINIMO_VENTA_MAYOR'];

    console.log(`   📋 Configs cargadas: INV=$${COSTO_INV} | UNI=$${PRECIO_UNI} | PROMO=$${PRECIO_PROMO}`);

    // =========================================================================
    // PARTE 3: USUARIO ADMIN
    // =========================================================================
    console.log('\n👑 [3/12] Creando usuario Admin...');

    const adminPassword = await bcrypt.hash('Admin123!', 12);

    const admin = await prisma.usuario.upsert({
        where: { email: 'admin@trabix.com' },
        update: { cedula: 1234567890 }, // Actualizar cédula si ya existe
        create: {
            cedula: 1234567890,
            nombre: 'Admin',
            apellidos: 'TRABIX',
            email: 'admin@trabix.com',
            telefono: '0000000001',
            passwordHash: adminPassword,
            requiereCambioPassword: false,
            rol: 'ADMIN',
            estado: 'ACTIVO',
        },
    });
    console.log('   ✅ Admin creado (cédula: 1234567890, pwd: Admin123!)');

    // =========================================================================
    // PARTE 4: STOCK ADMIN INICIAL
    // =========================================================================
    console.log('\n📊 [4/12] Creando stock admin...');

    let stock = await prisma.stockAdmin.findFirst();
    if (!stock) {
        stock = await prisma.stockAdmin.create({ data: { stockFisico: 50000 } });
    } else {
        await prisma.stockAdmin.update({ where: { id: stock.id }, data: { stockFisico: 50000 } });
    }
    console.log('   ✅ Stock admin: 50,000 unidades');

    // =========================================================================
    // PARTE 5: JERARQUÍA 5 NIVELES (2 ramas)
    // =========================================================================
    console.log('\n👥 [5/12] Creando jerarquía de 5 niveles...');

    // Rama A
    const recN2A = await prisma.usuario.upsert({
        where: { cedula: 1000000021 },
        update: {},
        create: {
            cedula: 1000000021,
            nombre: 'Reclutador A',
            apellidos: 'Nivel 2',
            email: 'rec.n2.a@test.com',
            telefono: '3100000021',
            passwordHash: hash('Test123!'),
            rol: Rol.VENDEDOR,
            estado: EstadoUsuario.ACTIVO,
            reclutadorId: admin.id,
        },
    });

    const recN3A = await prisma.usuario.upsert({
        where: { cedula: 1000000031 },
        update: {},
        create: {
            cedula: 1000000031,
            nombre: 'Reclutador A',
            apellidos: 'Nivel 3',
            email: 'rec.n3.a@test.com',
            telefono: '3100000031',
            passwordHash: hash('Test123!'),
            rol: Rol.VENDEDOR,
            estado: EstadoUsuario.ACTIVO,
            reclutadorId: recN2A.id,
        },
    });

    const recN4A = await prisma.usuario.upsert({
        where: { cedula: 1000000041 },
        update: {},
        create: {
            cedula: 1000000041,
            nombre: 'Reclutador A',
            apellidos: 'Nivel 4',
            email: 'rec.n4.a@test.com',
            telefono: '3100000041',
            passwordHash: hash('Test123!'),
            rol: Rol.VENDEDOR,
            estado: EstadoUsuario.ACTIVO,
            reclutadorId: recN3A.id,
        },
    });

    const venN5A1 = await prisma.usuario.upsert({
        where: { cedula: 1000000051 },
        update: {},
        create: {
            cedula: 1000000051,
            nombre: 'Vendedor A1',
            apellidos: 'Nivel 5',
            email: 'ven.n5.a1@test.com',
            telefono: '3100000051',
            passwordHash: hash('Test123!'),
            rol: Rol.VENDEDOR,
            estado: EstadoUsuario.ACTIVO,
            reclutadorId: recN4A.id,
        },
    });

    const venN5A2 = await prisma.usuario.upsert({
        where: { cedula: 1000000052 },
        update: {},
        create: {
            cedula: 1000000052,
            nombre: 'Vendedor A2',
            apellidos: 'Nivel 5',
            email: 'ven.n5.a2@test.com',
            telefono: '3100000052',
            passwordHash: hash('Test123!'),
            rol: Rol.VENDEDOR,
            estado: EstadoUsuario.ACTIVO,
            reclutadorId: recN4A.id,
        },
    });

    const venN5A3 = await prisma.usuario.upsert({
        where: { cedula: 1000000053 },
        update: {},
        create: {
            cedula: 1000000053,
            nombre: 'Vendedor A3',
            apellidos: 'Nivel 5',
            email: 'ven.n5.a3@test.com',
            telefono: '3100000053',
            passwordHash: hash('Test123!'),
            rol: Rol.VENDEDOR,
            estado: EstadoUsuario.ACTIVO,
            reclutadorId: recN4A.id,
        },
    });

    // Rama B
    const recN2B = await prisma.usuario.upsert({
        where: { cedula: 1000000022 },
        update: {},
        create: {
            cedula: 1000000022,
            nombre: 'Reclutador B',
            apellidos: 'Nivel 2',
            email: 'rec.n2.b@test.com',
            telefono: '3100000022',
            passwordHash: hash('Test123!'),
            rol: Rol.VENDEDOR,
            estado: EstadoUsuario.ACTIVO,
            reclutadorId: admin.id,
        },
    });

    const recN3B = await prisma.usuario.upsert({
        where: { cedula: 1000000033 },
        update: {},
        create: {
            cedula: 1000000033,
            nombre: 'Reclutador B',
            apellidos: 'Nivel 3',
            email: 'rec.n3.b@test.com',
            telefono: '3100000033',
            passwordHash: hash('Test123!'),
            rol: Rol.VENDEDOR,
            estado: EstadoUsuario.ACTIVO,
            reclutadorId: recN2B.id,
        },
    });

    const recN4B = await prisma.usuario.upsert({
        where: { cedula: 1000000043 },
        update: {},
        create: {
            cedula: 1000000043,
            nombre: 'Reclutador B',
            apellidos: 'Nivel 4',
            email: 'rec.n4.b@test.com',
            telefono: '3100000043',
            passwordHash: hash('Test123!'),
            rol: Rol.VENDEDOR,
            estado: EstadoUsuario.ACTIVO,
            reclutadorId: recN3B.id,
        },
    });

    const venN5B1 = await prisma.usuario.upsert({
        where: { cedula: 1000000054 },
        update: {},
        create: {
            cedula: 1000000054,
            nombre: 'Vendedor B1',
            apellidos: 'Nivel 5',
            email: 'ven.n5.b1@test.com',
            telefono: '3100000054',
            passwordHash: hash('Test123!'),
            rol: Rol.VENDEDOR,
            estado: EstadoUsuario.ACTIVO,
            reclutadorId: recN4B.id,
        },
    });

    console.log('   ✅ Jerarquía creada (Rama A: 6 usuarios, Rama B: 4 usuarios)');

    // =========================================================================
    // PARTE 6: VENDEDORES 60/40 (50 escenarios)
    // =========================================================================
    console.log('\n👤 [6/12] Creando vendedores 60/40 (50 escenarios)...');

    const escenarios = [
        // Estados
        { cedula: 1000000001, nombre: 'Activo', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000002, nombre: 'Sin Pwd', estado: EstadoUsuario.ACTIVO, pwd: false },
        { cedula: 1000000003, nombre: 'Inactivo', estado: EstadoUsuario.INACTIVO, pwd: true },
        // Equipamiento
        { cedula: 1000000004, nombre: 'Eq Al Día', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000005, nombre: 'Eq Sin Dep', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000006, nombre: 'Eq Atrasado', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000007, nombre: 'Daño Nevera', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000008, nombre: 'Daño Pijama', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000009, nombre: 'Daño Ambos', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000010, nombre: 'Perdido', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000011, nombre: 'Devuelto', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000012, nombre: 'Solicitado', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000013, nombre: 'Sin Equipo', estado: EstadoUsuario.ACTIVO, pwd: true },
        // Lotes
        { cedula: 1000000014, nombre: 'Lote Creado', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000015, nombre: 'T Liberada', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000016, nombre: 'T Tránsito', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000017, nombre: 'T EnCasa', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000018, nombre: 'Lote Final', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000019, nombre: 'Multi Lotes', estado: EstadoUsuario.ACTIVO, pwd: true },
        // Tamaños
        { cedula: 1000000020, nombre: 'Lote 1', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000021, nombre: 'Lote 2', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000022, nombre: 'Lote 49', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000023, nombre: 'Lote 50', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000024, nombre: 'Lote 51', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000025, nombre: 'Lote 99', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000026, nombre: 'Lote 100', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000027, nombre: 'Lote 101', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000028, nombre: 'Lote 200', estado: EstadoUsuario.ACTIVO, pwd: true },
        // Ventas
        { cedula: 1000000029, nombre: 'V Pendiente', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000030, nombre: 'V Aprobada', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000031, nombre: 'V Rechazada', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000032, nombre: 'V Mixta', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000033, nombre: 'Solo Uni', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000034, nombre: 'Solo Promo', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000035, nombre: 'Solo SL', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000036, nombre: 'Lim Regalo', estado: EstadoUsuario.ACTIVO, pwd: true },
        // Ventas Mayor
        { cedula: 1000000037, nombre: 'VM Ant Pend', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000038, nombre: 'VM Ant Comp', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000039, nombre: 'VM Con Pend', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000040, nombre: 'VM Con Comp', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000041, nombre: 'VM Forzado', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000042, nombre: 'Sin L VMayor', estado: EstadoUsuario.ACTIVO, pwd: true },
        // Cuadres
        { cedula: 1000000043, nombre: 'C Inactivo', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000044, nombre: 'C Pendiente', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000045, nombre: 'C Exitoso', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000046, nombre: 'C Parcial', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000047, nombre: 'Mini Cuadre', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000048, nombre: 'C Con Deuda', estado: EstadoUsuario.ACTIVO, pwd: true },
        // Edge cases
        { cedula: 1000000049, nombre: 'Edge 2H', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000050, nombre: 'Stock 0', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000051, nombre: 'Stock 1', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 1000000052, nombre: 'Trigger', estado: EstadoUsuario.ACTIVO, pwd: true },
    ];

    const v: Record<number, any> = {};
    for (const e of escenarios) {
        v[e.cedula] = await prisma.usuario.upsert({
            where: { cedula: e.cedula },
            update: {},
            create: {
                cedula: e.cedula,
                nombre: e.nombre,
                apellidos: 'Test',
                email: `vendedor${e.cedula}@test.com`,
                telefono: `320${Math.random().toString().slice(2, 9)}`,
                passwordHash: hash('Test123!'),
                requiereCambioPassword: !e.pwd,
                rol: Rol.VENDEDOR,
                estado: e.estado,
                reclutadorId: admin.id,
            },
        });
    }

    // Usuarios adicionales del complement seed
    const vTCasa = await prisma.usuario.upsert({
        where: { cedula: 1000000060 },
        update: {},
        create: {
            cedula: 1000000060,
            nombre: 'Tanda Casa',
            apellidos: 'Test',
            email: 'v60.t.casa@test.com',
            telefono: `320${Math.random().toString().slice(2, 9)}`,
            passwordHash: hash('Test123!'),
            rol: Rol.VENDEDOR,
            estado: EstadoUsuario.ACTIVO,
            reclutadorId: admin.id,
        },
    });
    v[1000000060] = vTCasa;

    const vVMAnt = await prisma.usuario.upsert({
        where: { cedula: 1000000061 },
        update: {},
        create: {
            cedula: 1000000061,
            nombre: 'VMayor Anticipado',
            apellidos: 'Test',
            email: 'v60.vm.ant@test.com',
            telefono: `320${Math.random().toString().slice(2, 9)}`,
            passwordHash: hash('Test123!'),
            rol: Rol.VENDEDOR,
            estado: EstadoUsuario.ACTIVO,
            reclutadorId: admin.id,
        },
    });
    v[1000000061] = vVMAnt;

    await prisma.usuario.upsert({
        where: { cedula: 1000000062 },
        update: {},
        create: {
            cedula: 1000000062,
            nombre: 'Sin Lotes',
            apellidos: 'Test',
            email: 'v60.sin.l@test.com',
            telefono: `320${Math.random().toString().slice(2, 9)}`,
            passwordHash: hash('Test123!'),
            rol: Rol.VENDEDOR,
            estado: EstadoUsuario.ACTIVO,
            reclutadorId: admin.id,
        },
    });

    console.log(`   ✅ ${escenarios.length + 3} vendedores creados`);

    // =========================================================================
    // PARTE 7: EQUIPAMIENTO
    // =========================================================================
    console.log('\n🧊 [7/12] Creando equipamientos...');

    await prisma.equipamiento.upsert({
        where: { vendedorId: v['1000000004'].id }, // Eq Al Día
        update: {},
        create: {
            vendedorId: v['1000000004'].id,
            estado: 'ACTIVO',
            tieneDeposito: true,
            depositoPagado: decimal(DEPOSITO),
            mensualidadActual: decimal(MENS_CON),
            ultimaMensualidadPagada: new Date(),
            fechaSolicitud: daysAgo(60),
            fechaEntrega: daysAgo(55),
        },
    });

    await prisma.equipamiento.upsert({
        where: { vendedorId: v['1000000005'].id }, // Eq Sin Dep
        update: {},
        create: {
            vendedorId: v['1000000005'].id,
            estado: 'ACTIVO',
            tieneDeposito: false,
            mensualidadActual: decimal(MENS_SIN),
            ultimaMensualidadPagada: new Date(),
            fechaSolicitud: daysAgo(50),
            fechaEntrega: daysAgo(45),
        },
    });

    await prisma.equipamiento.upsert({
        where: { vendedorId: v['1000000006'].id }, // Eq Atrasado
        update: {},
        create: {
            vendedorId: v['1000000006'].id,
            estado: 'ACTIVO',
            tieneDeposito: false,
            mensualidadActual: decimal(MENS_SIN),
            ultimaMensualidadPagada: daysAgo(45),
            fechaSolicitud: daysAgo(90),
            fechaEntrega: daysAgo(85),
        },
    });

    await prisma.equipamiento.upsert({
        where: { vendedorId: v['1000000007'].id }, // Daño Nevera
        update: {},
        create: {
            vendedorId: v['1000000007'].id,
            estado: 'DANADO',
            tieneDeposito: true,
            depositoPagado: decimal(DEPOSITO),
            mensualidadActual: decimal(MENS_CON),
            deudaDano: decimal(DANO_NEV),
            ultimaMensualidadPagada: new Date(),
            fechaSolicitud: daysAgo(100),
            fechaEntrega: daysAgo(95),
        },
    });

    await prisma.equipamiento.upsert({
        where: { vendedorId: v['1000000008'].id }, // Daño Pijama
        update: {},
        create: {
            vendedorId: v['1000000008'].id,
            estado: 'DANADO',
            tieneDeposito: true,
            depositoPagado: decimal(DEPOSITO),
            mensualidadActual: decimal(MENS_CON),
            deudaDano: decimal(DANO_PIJ),
            ultimaMensualidadPagada: new Date(),
            fechaSolicitud: daysAgo(100),
            fechaEntrega: daysAgo(95),
        },
    });

    await prisma.equipamiento.upsert({
        where: { vendedorId: v['1000000009'].id }, // Daño Ambos
        update: {},
        create: {
            vendedorId: v['1000000009'].id,
            estado: 'DANADO',
            tieneDeposito: true,
            depositoPagado: decimal(DEPOSITO),
            mensualidadActual: decimal(MENS_CON),
            deudaDano: decimal(DANO_NEV + DANO_PIJ),
            ultimaMensualidadPagada: new Date(),
            fechaSolicitud: daysAgo(80),
            fechaEntrega: daysAgo(75),
        },
    });

    await prisma.equipamiento.upsert({
        where: { vendedorId: v['1000000010'].id }, // Perdido
        update: {},
        create: {
            vendedorId: v['1000000010'].id,
            estado: 'PERDIDO',
            tieneDeposito: true,
            depositoPagado: decimal(DEPOSITO),
            mensualidadActual: decimal(MENS_CON),
            deudaPerdida: decimal(DANO_NEV + DANO_PIJ),
            ultimaMensualidadPagada: daysAgo(20),
            fechaSolicitud: daysAgo(150),
            fechaEntrega: daysAgo(145),
        },
    });

    await prisma.equipamiento.upsert({
        where: { vendedorId: v['1000000011'].id }, // Devuelto
        update: {},
        create: {
            vendedorId: v['1000000011'].id,
            estado: 'DEVUELTO',
            tieneDeposito: true,
            depositoPagado: decimal(DEPOSITO),
            depositoDevuelto: true,
            fechaDevolucionDeposito: daysAgo(5),
            mensualidadActual: decimal(MENS_CON),
            ultimaMensualidadPagada: daysAgo(10),
            fechaSolicitud: daysAgo(200),
            fechaEntrega: daysAgo(195),
            fechaDevolucion: daysAgo(5),
        },
    });

    await prisma.equipamiento.upsert({
        where: { vendedorId: v['1000000012'].id }, // Solicitado
        update: {},
        create: {
            vendedorId: v['1000000012'].id,
            estado: 'SOLICITADO',
            tieneDeposito: true,
            depositoPagado: decimal(DEPOSITO),
            mensualidadActual: decimal(MENS_CON),
            fechaSolicitud: daysAgo(2),
        },
    });

    await prisma.equipamiento.upsert({
        where: { vendedorId: v['1000000013'].id }, // Sin Equipo
        update: {},
        create: {
            vendedorId: v['1000000013'].id,
            estado: 'DANADO',
            tieneDeposito: false,
            mensualidadActual: decimal(MENS_SIN),
            deudaDano: decimal(DANO_NEV),
            ultimaMensualidadPagada: daysAgo(35),
            fechaSolicitud: daysAgo(100),
            fechaEntrega: daysAgo(95),
        },
    });

    console.log('   ✅ 10 equipamientos creados');

    // =========================================================================
    // PARTE 8: LOTES Y TANDAS
    // =========================================================================
    console.log('\n📦 [8/12] Creando lotes y tandas...');

    // Función helper para crear lotes
    async function crearLote(
        vendedorId: string,
        cant: number,
        estado: EstadoLote,
        modelo: ModeloNegocio = ModeloNegocio.MODELO_60_40,
        opt: { tandas?: EstadoTanda[]; stocks?: number[]; forzado?: boolean; dias?: number } = {}
    ) {
        const num = cant <= 50 ? 2 : 3;
        const base = Math.floor(cant / num);
        const res = cant % num;
        const inv = cant * COSTO_INV;

        const lote = await prisma.lote.create({
            data: {
                vendedorId,
                cantidadTrabix: cant,
                estado,
                modeloNegocio: modelo,
                esLoteForzado: opt.forzado || false,
                inversionTotal: decimal(inv),
                inversionVendedor: decimal(inv * 0.5),
                inversionAdmin: decimal(inv * 0.5),
                dineroRecaudado: decimal(0),
                dineroTransferido: decimal(0),
                fechaCreacion: daysAgo(opt.dias || 30),
                fechaActivacion: estado === EstadoLote.CREADO ? null : daysAgo((opt.dias || 30) - 2),
            },
        });

        const ESTADOS_EN_TRANSITO = [EstadoTanda.EN_TRANSITO, EstadoTanda.EN_CASA, EstadoTanda.FINALIZADA] as const;
        const ESTADOS_EN_CASA = [EstadoTanda.EN_CASA, EstadoTanda.FINALIZADA] as const;

        for (let i = 0; i < num; i++) {
            const si = base + (i < res ? 1 : 0);
            const et = opt.tandas?.[i] ?? EstadoTanda.INACTIVA;
            const sa = opt.stocks?.[i] ?? si;

            await prisma.tanda.create({
                data: {
                    loteId: lote.id,
                    numero: i + 1,
                    stockInicial: si,
                    stockActual: sa,
                    estado: et,
                    fechaLiberacion: et === EstadoTanda.INACTIVA ? null : daysAgo(27 - i),
                    fechaEnTransito: ESTADOS_EN_TRANSITO.includes(et as typeof ESTADOS_EN_TRANSITO[number]) ? daysAgo(26 - i) : null,
                    fechaEnCasa: ESTADOS_EN_CASA.includes(et as typeof ESTADOS_EN_CASA[number]) ? daysAgo(25 - i) : null,
                    fechaFinalizada: et === EstadoTanda.FINALIZADA ? daysAgo(1) : null,
                },
            });
        }

        return lote;
    }

    // Estados de lote
    await crearLote(v['1000000014'].id, 100, EstadoLote.CREADO);

    await crearLote(
        v['1000000015'].id,
        100,
        EstadoLote.ACTIVO,
        ModeloNegocio.MODELO_60_40,
        { tandas: [EstadoTanda.LIBERADA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] },
    );

    await crearLote(
        v['1000000016'].id,
        100,
        EstadoLote.ACTIVO,
        ModeloNegocio.MODELO_60_40,
        { tandas: [EstadoTanda.EN_TRANSITO, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] },
    );

    await crearLote(
        v['1000000017'].id,
        100,
        EstadoLote.ACTIVO,
        ModeloNegocio.MODELO_60_40,
        { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA], stocks: [25, 33, 33] },
    );

    await crearLote(
        v['1000000018'].id,
        50,
        EstadoLote.FINALIZADO,
        ModeloNegocio.MODELO_60_40,
        { tandas: [EstadoTanda.FINALIZADA, EstadoTanda.FINALIZADA], stocks: [0, 0] },
    );

// Multi lotes
    for (let i = 0; i < 4; i++) {
        await crearLote(
            v['1000000019'].id,
            50,
            EstadoLote.ACTIVO,
            ModeloNegocio.MODELO_60_40,
            {
                tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA],
                stocks: [25 - i * 3, 25],
                dias: 60 - i * 10,
            },
        );
    }

// Tamaños
    await crearLote(v['1000000020'].id, 1, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA] });
    await crearLote(v['1000000021'].id, 2, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA] });
    await crearLote(v['1000000022'].id, 49, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA] });
    await crearLote(v['1000000023'].id, 50, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA] });
    await crearLote(v['1000000024'].id, 51, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['1000000025'].id, 99, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['1000000026'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['1000000027'].id, 101, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['1000000028'].id, 200, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });

// Ventas
    await crearLote(v['1000000029'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['1000000030'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['1000000031'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['1000000032'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['1000000033'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['1000000034'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['1000000035'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['1000000036'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA], stocks: [20, 33, 33] });

// Ventas mayor
    await crearLote(v['1000000037'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40);
    await crearLote(v['1000000038'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40);
    await crearLote(v['1000000039'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40);
    await crearLote(v['1000000040'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40);
    await crearLote(
        v['1000000041'].id,
        30,
        EstadoLote.FINALIZADO,
        ModeloNegocio.MODELO_60_40,
        { tandas: [EstadoTanda.FINALIZADA, EstadoTanda.FINALIZADA], stocks: [0, 0], forzado: true },
    );

// Cuadres
    await crearLote(v['1000000043'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40);
    await crearLote(v['1000000044'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { stocks: [3, 33, 33] });
    await crearLote(v['1000000045'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.FINALIZADA, EstadoTanda.EN_CASA, EstadoTanda.INACTIVA], stocks: [0, 20, 33] });
    await crearLote(v['1000000046'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { stocks: [5, 33, 33] });
    await crearLote(v['1000000047'].id, 50, EstadoLote.FINALIZADO, ModeloNegocio.MODELO_60_40);
    await crearLote(v['1000000048'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { stocks: [5, 33, 33] });

// Edge
    const l2h = await crearLote(v['1000000049'].id, 50, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.LIBERADA, EstadoTanda.INACTIVA] });
    await prisma.tanda.updateMany({ where: { loteId: l2h.id, numero: 1 }, data: { fechaLiberacion: minutesAgo(119) } });

    await crearLote(v['1000000050'].id, 50, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.FINALIZADA, EstadoTanda.EN_CASA], stocks: [0, 25] });
    await crearLote(v['1000000051'].id, 50, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA], stocks: [1, 25] });
    await crearLote(v['1000000052'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { stocks: [3, 33, 33] });

    // Jerarquía 50/50
    await crearLote(venN5A1.id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_50_50, { tandas: [EstadoTanda.FINALIZADA, EstadoTanda.EN_CASA, EstadoTanda.INACTIVA], stocks: [0, 20, 33] });
    await crearLote(venN5A2.id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_50_50, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA], stocks: [3, 33, 33] });
    await crearLote(venN5A3.id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_50_50, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(venN5B1.id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_50_50, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(recN4A.id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_50_50, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(recN4B.id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_50_50, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(recN3A.id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_50_50, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(recN3B.id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_50_50, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(recN2A.id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(recN2B.id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });

    // Lotes para usuarios complementarios (V60-T-CASA y V60-VM-ANT)
    const existingLoteTCasa = await prisma.lote.findFirst({ where: { vendedorId: vTCasa.id } });
    if (!existingLoteTCasa) {
        const inv = 100 * COSTO_INV;
        const loteTCasa = await prisma.lote.create({
            data: {
                vendedorId: vTCasa.id,
                cantidadTrabix: 100,
                estado: EstadoLote.ACTIVO,
                modeloNegocio: ModeloNegocio.MODELO_60_40,
                inversionTotal: decimal(inv),
                inversionVendedor: decimal(inv * 0.5),
                inversionAdmin: decimal(inv * 0.5),
                dineroRecaudado: decimal(0),
                dineroTransferido: decimal(0),
                fechaCreacion: daysAgo(30),
                fechaActivacion: daysAgo(28),
            },
        });
        await prisma.tanda.createMany({
            data: [
                { loteId: loteTCasa.id, numero: 1, stockInicial: 34, stockActual: 20, estado: EstadoTanda.EN_CASA, fechaLiberacion: daysAgo(27), fechaEnTransito: daysAgo(26), fechaEnCasa: daysAgo(25) },
                { loteId: loteTCasa.id, numero: 2, stockInicial: 33, stockActual: 33, estado: EstadoTanda.INACTIVA },
                { loteId: loteTCasa.id, numero: 3, stockInicial: 33, stockActual: 33, estado: EstadoTanda.INACTIVA },
            ],
        });
    }

    const existingLoteVMAnt = await prisma.lote.findFirst({ where: { vendedorId: vVMAnt.id } });
    if (!existingLoteVMAnt) {
        const inv = 100 * COSTO_INV;
        const loteVMAnt = await prisma.lote.create({
            data: {
                vendedorId: vVMAnt.id,
                cantidadTrabix: 100,
                estado: EstadoLote.ACTIVO,
                modeloNegocio: ModeloNegocio.MODELO_60_40,
                inversionTotal: decimal(inv),
                inversionVendedor: decimal(inv * 0.5),
                inversionAdmin: decimal(inv * 0.5),
                dineroRecaudado: decimal(0),
                dineroTransferido: decimal(0),
                fechaCreacion: daysAgo(25),
                fechaActivacion: daysAgo(23),
            },
        });
        await prisma.tanda.createMany({
            data: [
                { loteId: loteVMAnt.id, numero: 1, stockInicial: 34, stockActual: 34, estado: EstadoTanda.EN_CASA, fechaLiberacion: daysAgo(22), fechaEnTransito: daysAgo(21), fechaEnCasa: daysAgo(20) },
                { loteId: loteVMAnt.id, numero: 2, stockInicial: 33, stockActual: 33, estado: EstadoTanda.INACTIVA },
                { loteId: loteVMAnt.id, numero: 3, stockInicial: 33, stockActual: 33, estado: EstadoTanda.INACTIVA },
            ],
        });
    }

    const lc = await prisma.lote.count();
    const tc = await prisma.tanda.count();
    console.log(`   ✅ ${lc} lotes, ${tc} tandas creadas`);

    // =========================================================================
    // PARTE 9: VENTAS AL DETAL
    // =========================================================================
    console.log('\n🛒 [9/12] Creando ventas al detal...');

    async function crearVenta(vendedorId: string, estado: EstadoVenta, det: { t: TipoVenta; c: number }[]) {
        const tanda = await prisma.tanda.findFirst({ where: { lote: { vendedorId }, estado: 'EN_CASA' } });
        if (!tanda) return;
        const precios: Record<TipoVenta, number> = { UNIDAD: PRECIO_UNI, PROMO: PRECIO_PROMO, SIN_LICOR: PRECIO_SL, REGALO: 0 };
        let total = 0;
        let cantidadTrabix = 0;
        for (const d of det) {
            total += precios[d.t] * d.c;
            cantidadTrabix += d.t === 'PROMO' ? d.c * 2 : d.c;
        }
        const venta = await prisma.venta.create({
            data: {
                vendedorId,
                tandaId: tanda.id,
                loteId: tanda.loteId,
                cantidadTrabix,
                montoTotal: decimal(total),
                estado,
                fechaRegistro: daysAgo(estado === 'PENDIENTE' ? 1 : 5),
                fechaValidacion: estado === 'PENDIENTE' ? null : daysAgo(4),
            },
        });
        for (const d of det) {
            await prisma.detalleVenta.create({
                data: {
                    ventaId: venta.id,
                    tipo: d.t,
                    cantidad: d.c,
                    precioUnitario: decimal(precios[d.t]),
                    subtotal: decimal(precios[d.t] * d.c),
                },
            });
        }
    }

    // Ventas minoristas
    await crearVenta(v['1000000029'].id, EstadoVenta.PENDIENTE, [{ t: TipoVenta.UNIDAD, c: 3 }]);
    await crearVenta(v['1000000029'].id, EstadoVenta.PENDIENTE, [{ t: TipoVenta.PROMO, c: 2 }]);
    await crearVenta(v['1000000029'].id, EstadoVenta.PENDIENTE, [{ t: TipoVenta.SIN_LICOR, c: 4 }]);

    await crearVenta(v['1000000030'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.UNIDAD, c: 5 }]);
    await crearVenta(v['1000000030'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.PROMO, c: 3 }]);
    await crearVenta(v['1000000030'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.UNIDAD, c: 2 }, { t: TipoVenta.REGALO, c: 1 }]);

    await crearVenta(v['1000000031'].id, EstadoVenta.RECHAZADA, [{ t: TipoVenta.UNIDAD, c: 10 }]);
    await crearVenta(v['1000000032'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.PROMO, c: 3 }, { t: TipoVenta.UNIDAD, c: 4 }, { t: TipoVenta.SIN_LICOR, c: 2 }, { t: TipoVenta.REGALO, c: 1 }]);
    await crearVenta(v['1000000033'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.UNIDAD, c: 10 }]);
    await crearVenta(v['1000000034'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.PROMO, c: 5 }]);
    await crearVenta(v['1000000035'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.SIN_LICOR, c: 8 }]);
    await crearVenta(v['1000000036'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.REGALO, c: 7 }]);

    await crearVenta(venN5A1.id, EstadoVenta.APROBADA, [{ t: TipoVenta.UNIDAD, c: 10 }]);
    await crearVenta(venN5A1.id, EstadoVenta.APROBADA, [{ t: TipoVenta.PROMO, c: 5 }]);

    const vc = await prisma.venta.count();
    console.log(`   ✅ ${vc} ventas creadas`);

    // =========================================================================
    // PARTE 10: VENTAS AL MAYOR
    // =========================================================================
    console.log('\n💼 [10/12] Creando ventas al mayor...');
    await prisma.ventaMayor.create({
        data: {
            vendedorId: v['1000000037'].id,
            cantidadUnidades: MIN_VMAYOR + 9,
            precioUnidad: decimal(PRECIO_UNI),
            modalidad: 'ANTICIPADO',
            estado: 'PENDIENTE',
            ingresoBruto: decimal((MIN_VMAYOR + 9) * PRECIO_UNI),
            fechaRegistro: daysAgo(3),
        },
    });

    await prisma.ventaMayor.create({
        data: {
            vendedorId: v['1000000038'].id,
            cantidadUnidades: MIN_VMAYOR + 4,
            precioUnidad: decimal(PRECIO_UNI),
            modalidad: 'ANTICIPADO',
            estado: 'COMPLETADA',
            ingresoBruto: decimal((MIN_VMAYOR + 4) * PRECIO_UNI),
            fechaRegistro: daysAgo(10),
            fechaCompletada: daysAgo(5),
        },
    });

    await prisma.ventaMayor.create({
        data: {
            vendedorId: v['1000000039'].id,
            cantidadUnidades: MIN_VMAYOR,
            precioUnidad: decimal(PRECIO_UNI),
            modalidad: 'CONTRAENTREGA',
            estado: 'PENDIENTE',
            ingresoBruto: decimal(MIN_VMAYOR * PRECIO_UNI),
            fechaRegistro: daysAgo(2),
        },
    });

    await prisma.ventaMayor.create({
        data: {
            vendedorId: v['1000000040'].id,
            cantidadUnidades: MIN_VMAYOR + 14,
            precioUnidad: decimal(PRECIO_UNI),
            modalidad: 'CONTRAENTREGA',
            estado: 'COMPLETADA',
            ingresoBruto: decimal((MIN_VMAYOR + 14) * PRECIO_UNI),
            fechaRegistro: daysAgo(15),
            fechaCompletada: daysAgo(10),
        },
    });

    const lf = await prisma.lote.findFirst({ where: { vendedorId: v['1000000041'].id } });
    if (lf) {
        await prisma.ventaMayor.create({
            data: {
                vendedorId: v['1000000041'].id,
                cantidadUnidades: 30,
                precioUnidad: decimal(PRECIO_UNI),
                modalidad: 'ANTICIPADO',
                estado: 'COMPLETADA',
                ingresoBruto: decimal(30 * PRECIO_UNI),
                fechaRegistro: daysAgo(20),
                fechaCompletada: daysAgo(15),
            },
        });
    }

    const vmc = await prisma.ventaMayor.count();
    console.log(`   ✅ ${vmc} ventas mayor creadas`);
    // =========================================================================
    // PARTE 11: CUADRES Y MINI-CUADRES
    // =========================================================================
    console.log('\n💰 [11/12] Creando cuadres y mini-cuadres...');
    const tCI = await prisma.tanda.findFirst({ where: { lote: { vendedorId: v['1000000043'].id } } });
    if (tCI)
        await prisma.cuadre.create({
            data: {
                tandaId: tCI.id,
                concepto: ConceptoCuadre.INVERSION_ADMIN,
                montoEsperado: decimal(50 * COSTO_INV),
                montoRecibido: decimal(0),
                montoFaltante: decimal(50 * COSTO_INV),
                estado: EstadoCuadre.INACTIVO,
            },
        });

    const tCP = await prisma.tanda.findFirst({ where: { lote: { vendedorId: v['1000000044'].id } } });
    if (tCP)
        await prisma.cuadre.create({
            data: {
                tandaId: tCP.id,
                concepto: ConceptoCuadre.INVERSION_ADMIN,
                montoEsperado: decimal(50 * COSTO_INV),
                montoRecibido: decimal(0),
                montoFaltante: decimal(50 * COSTO_INV),
                estado: EstadoCuadre.PENDIENTE,
                fechaPendiente: daysAgo(3),
            },
        });

    const tCE = await prisma.tanda.findFirst({ where: { lote: { vendedorId: v['1000000045'].id }, numero: 1 } });
    if (tCE)
        await prisma.cuadre.create({
            data: {
                tandaId: tCE.id,
                concepto: ConceptoCuadre.INVERSION_ADMIN,
                montoEsperado: decimal(50 * COSTO_INV),
                montoRecibido: decimal(50 * COSTO_INV),
                montoFaltante: decimal(0),
                estado: EstadoCuadre.EXITOSO,
                fechaPendiente: daysAgo(10),
                fechaExitoso: daysAgo(7),
            },
        });

    const tCPa = await prisma.tanda.findFirst({ where: { lote: { vendedorId: v['1000000046'].id } } });
    if (tCPa)
        await prisma.cuadre.create({
            data: {
                tandaId: tCPa.id,
                concepto: ConceptoCuadre.MIXTO,
                montoEsperado: decimal(50 * COSTO_INV),
                montoRecibido: decimal(30 * COSTO_INV),
                montoFaltante: decimal(20 * COSTO_INV),
                estado: EstadoCuadre.PENDIENTE,
                fechaPendiente: daysAgo(5),
            },
        });

    const tMC = await prisma.tanda.findFirst({ where: { lote: { vendedorId: v['1000000047'].id }, numero: 2 } });
    if (tMC)
        await prisma.cuadre.create({
            data: {
                tandaId: tMC.id,
                concepto: ConceptoCuadre.GANANCIAS,
                montoEsperado: decimal(20000),
                montoRecibido: decimal(0),
                montoFaltante: decimal(20000),
                estado: EstadoCuadre.PENDIENTE,
                fechaPendiente: daysAgo(1),
            },
        });

    const tCD = await prisma.tanda.findFirst({ where: { lote: { vendedorId: v['1000000048'].id } } });
    if (tCD)
        await prisma.cuadre.create({
            data: {
                tandaId: tCD.id,
                concepto: ConceptoCuadre.MIXTO,
                montoEsperado: decimal(50 * COSTO_INV + DANO_NEV + MENS_SIN),
                montoRecibido: decimal(0),
                montoFaltante: decimal(50 * COSTO_INV + DANO_NEV + MENS_SIN),
                estado: EstadoCuadre.PENDIENTE,
                fechaPendiente: daysAgo(2),
            },
        });

    // Cuadres jerarquía
    const tN5A1 = await prisma.tanda.findFirst({ where: { lote: { vendedorId: venN5A1.id }, numero: 1 } });
    if (tN5A1) await prisma.cuadre.create({ data: { tandaId: tN5A1.id, concepto: ConceptoCuadre.MIXTO, montoEsperado: decimal(10 * PRECIO_UNI + 5 * PRECIO_PROMO), montoRecibido: decimal(10 * PRECIO_UNI + 5 * PRECIO_PROMO), montoFaltante: decimal(0), estado: EstadoCuadre.EXITOSO, fechaPendiente: daysAgo(5), fechaExitoso: daysAgo(2) } });

    const tN5A2 = await prisma.tanda.findFirst({ where: { lote: { vendedorId: venN5A2.id }, numero: 1 } });
    if (tN5A2) await prisma.cuadre.create({ data: { tandaId: tN5A2.id, concepto: ConceptoCuadre.INVERSION_ADMIN, montoEsperado: decimal(34 * COSTO_INV), montoRecibido: decimal(0), montoFaltante: decimal(34 * COSTO_INV), estado: EstadoCuadre.PENDIENTE, fechaPendiente: daysAgo(3) } });

    // Mini-cuadres
    const loteMiniC = await prisma.lote.findFirst({ where: { vendedor: { cedula: 1000000047 }, estado: EstadoLote.FINALIZADO } });
    if (loteMiniC) {
        const existingMiniCuadre = await prisma.miniCuadre.findFirst({ where: { loteId: loteMiniC.id } });
        if (!existingMiniCuadre) {
            const ultimaTanda = await prisma.tanda.findFirst({ where: { loteId: loteMiniC.id }, orderBy: { numero: 'desc' } });
            if (ultimaTanda) {
                await prisma.miniCuadre.create({
                    data: { loteId: loteMiniC.id, tandaId: ultimaTanda.id, estado: EstadoMiniCuadre.EXITOSO, montoFinal: decimal(15000), fechaPendiente: daysAgo(5), fechaExitoso: daysAgo(2) },
                });
            }
        }
    }

    // Mini-cuadre PENDIENTE adicional
    const loteFinalizado = await prisma.lote.findFirst({ where: { estado: EstadoLote.FINALIZADO, miniCuadre: null, NOT: { vendedor: { cedula: 1000000047 } } } });
    if (loteFinalizado) {
        const ultimaTanda = await prisma.tanda.findFirst({ where: { loteId: loteFinalizado.id }, orderBy: { numero: 'desc' } });
        if (ultimaTanda) {
            await prisma.miniCuadre.create({
                data: { loteId: loteFinalizado.id, tandaId: ultimaTanda.id, estado: EstadoMiniCuadre.PENDIENTE, montoFinal: decimal(10000), fechaPendiente: daysAgo(1) },
            });
        }
    }

    // Cuadre Mayor con Ganancias Reclutadores
    const ventaMayorCompletada = await prisma.ventaMayor.findFirst({ where: { estado: 'COMPLETADA' }, include: { vendedor: true } });
    if (ventaMayorCompletada) {
        const existingCuadreMayor = await prisma.cuadreMayor.findFirst({ where: { ventaMayorId: ventaMayorCompletada.id } });
        if (!existingCuadreMayor) {
            const ingresoBruto = Number(ventaMayorCompletada.ingresoBruto);
            const cantidadUnidades = ventaMayorCompletada.cantidadUnidades;
            const gananciaBruta = ingresoBruto - cantidadUnidades * COSTO_INV;
            const gananciaVendedor = gananciaBruta * 0.5;
            const restoCascada = gananciaBruta * 0.5;
            const n5 = restoCascada * 0.5;
            const n4 = (restoCascada - n5) * 0.5;
            const n3 = (restoCascada - n5 - n4) * 0.5;
            const n2 = (restoCascada - n5 - n4 - n3) * 0.5;
            const adminResto = restoCascada - n5 - n4 - n3 - n2;

            const cuadreMayor = await prisma.cuadreMayor.create({
                data: {
                    ventaMayorId: ventaMayorCompletada.id,
                    vendedorId: ventaMayorCompletada.vendedorId,
                    modalidad: ventaMayorCompletada.modalidad,
                    estado: EstadoCuadre.EXITOSO,
                    cantidadUnidades,
                    precioUnidad: ventaMayorCompletada.precioUnidad,
                    ingresoBruto: ventaMayorCompletada.ingresoBruto,
                    deudasSaldadas: decimal(0),
                    inversionAdminLotesExistentes: decimal(cantidadUnidades * COSTO_INV * 0.5),
                    inversionAdminLoteForzado: decimal(0),
                    inversionVendedorLotesExistentes: decimal(cantidadUnidades * COSTO_INV * 0.5),
                    inversionVendedorLoteForzado: decimal(0),
                    gananciasAdmin: decimal(adminResto),
                    gananciasVendedor: decimal(gananciaVendedor),
                    evaluacionFinanciera: { gananciaBruta, distribucion: { n5, n4, n3, n2, admin: adminResto } },
                    montoTotalAdmin: decimal(cantidadUnidades * COSTO_INV * 0.5 + adminResto),
                    montoTotalVendedor: decimal(cantidadUnidades * COSTO_INV * 0.5 + gananciaVendedor),
                    lotesInvolucradosIds: [],
                    tandasAfectadas: {},
                    cuadresCerradosIds: [],
                    fechaRegistro: daysAgo(10),
                    fechaExitoso: daysAgo(5),
                },
            });

            // Ganancias reclutadores
            const reclutadores = await prisma.usuario.findMany({
                where: {
                    cedula: { in: [1000000021, 1000000031, 1000000041, 1000000051] }
                }
            });

            const nivelesMontos = [
                { nivel: 5, monto: n5 },
                { nivel: 4, monto: n4 },
                { nivel: 3, monto: n3 },
                { nivel: 2, monto: n2 },
            ];

            // Mapear nivel → cedula específica
            const nivelACedula: Record<number, number> = {
                5: 1000000021,
                4: 1000000031,
                3: 1000000041,
                2: 1000000051,
            };

            for (const { nivel, monto } of nivelesMontos) {
                const cedulaEsperada = nivelACedula[nivel];
                const reclutador = reclutadores.find(r => r.cedula === cedulaEsperada);

                if (reclutador) {
                    await prisma.gananciaReclutador.create({
                        data: {
                            cuadreMayorId: cuadreMayor.id,
                            reclutadorId: reclutador.id,
                            nivel,
                            monto: decimal(monto),
                            transferido: nivel === 5,
                            fechaTransferencia: nivel === 5 ? daysAgo(3) : null,
                        },
                    });
                }
            }
        }
    }

    const cc = await prisma.cuadre.count();
    const mc = await prisma.miniCuadre.count();
    const cm = await prisma.cuadreMayor.count();
    console.log(`   ✅ ${cc} cuadres, ${mc} mini-cuadres, ${cm} cuadres mayor`);

    // =========================================================================
    // PARTE 12: FONDO DE RECOMPENSAS
    // =========================================================================
    console.log('\n🏆 [12/12] Creando transacciones del fondo...');

    await prisma.transaccionFondo.createMany({
        data: [
            { tipo: 'ENTRADA', monto: decimal(100 * APORTE_FONDO), fechaTransaccion: daysAgo(30) },
            { tipo: 'ENTRADA', monto: decimal(50 * APORTE_FONDO), fechaTransaccion: daysAgo(28) },
            { tipo: 'ENTRADA', monto: decimal(100 * APORTE_FONDO), fechaTransaccion: daysAgo(25) },
            { tipo: 'SALIDA', monto: decimal(25000), fechaTransaccion: daysAgo(15) },
            { tipo: 'ENTRADA', monto: decimal(200 * APORTE_FONDO), fechaTransaccion: daysAgo(5) },
            { tipo: 'SALIDA', monto: decimal(10000), fechaTransaccion: daysAgo(2) },
            // Transacciones con motivo (complement)
            { tipo: 'ENTRADA', monto: decimal(100 * APORTE_FONDO), motivo: 'Aporte lote 100 unidades - V60-L100', fechaTransaccion: daysAgo(20) },
            { tipo: 'ENTRADA', monto: decimal(50 * APORTE_FONDO), motivo: 'Aporte lote 50 unidades - V60-L50', fechaTransaccion: daysAgo(18) },
            { tipo: 'SALIDA', monto: decimal(15000), motivo: 'Pago bonificación vendedor destacado', fechaTransaccion: daysAgo(10) },
        ],
    });

    const fc = await prisma.transaccionFondo.count();
    console.log(`   ✅ ${fc} transacciones del fondo`);

    // =========================================================================
    // RESUMEN FINAL
    // =========================================================================
    const counts = await prisma.$transaction([
        prisma.usuario.count(),
        prisma.lote.count(),
        prisma.tanda.count(),
        prisma.venta.count(),
        prisma.cuadre.count(),
        prisma.equipamiento.count(),
        prisma.ventaMayor.count(),
        prisma.transaccionFondo.count(),
        prisma.miniCuadre.count(),
        prisma.cuadreMayor.count(),
        prisma.gananciaReclutador.count(),
        prisma.configuracionSistema.count(),
        prisma.tipoInsumo.count(),
    ]);

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                        ✅ SEED COMPLETADO EXITOSAMENTE                       ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║  📊 Usuarios:        ${counts[0].toString().padStart(4)}    │  📦 Lotes:           ${counts[1].toString().padStart(4)}              ║`);
    console.log(`║  📋 Tandas:          ${counts[2].toString().padStart(4)}    │  🛒 Ventas:          ${counts[3].toString().padStart(4)}              ║`);
    console.log(`║  💰 Cuadres:         ${counts[4].toString().padStart(4)}    │  🧊 Equipamientos:   ${counts[5].toString().padStart(4)}              ║`);
    console.log(`║  💼 Ventas Mayor:    ${counts[6].toString().padStart(4)}    │  🏆 Trans. Fondo:    ${counts[7].toString().padStart(4)}              ║`);
    console.log(`║  📋 Mini-Cuadres:    ${counts[8].toString().padStart(4)}    │  💼 Cuadres Mayor:   ${counts[9].toString().padStart(4)}              ║`);
    console.log(`║  👥 Gan. Reclut.:    ${counts[10].toString().padStart(4)}    │  ⚙️ Configuraciones: ${counts[11].toString().padStart(4)}              ║`);
    console.log(`║  📦 Tipos Insumo:    ${counts[12].toString().padStart(4)}    │                                        ║`);
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    console.log('║  🔑 CREDENCIALES:                                                            ║');
    console.log('║     Admin:     1234567890 / Admin123!                                          ║');
    console.log('║     Usuarios:  [cédula] / Test123!                                           ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    console.log('');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });