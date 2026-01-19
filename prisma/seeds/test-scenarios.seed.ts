/**
 * SEED EXHAUSTIVO DE ESCENARIOS - TRABIX Backend
 *
 * Crea TODOS los escenarios posibles. NO toca configuraciones - las LEE del sistema.
 *
 * Ejecutar: npx ts-node prisma/seeds/test-scenarios.seed.ts
 */

import {
    PrismaClient, Rol, EstadoUsuario, ModeloNegocio, EstadoLote, EstadoTanda,
    EstadoVenta, EstadoCuadre, ConceptoCuadre, TipoVenta, Prisma
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = (pwd: string) => bcrypt.hashSync(pwd, 12);
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000);
const decimal = (n: number) => new Prisma.Decimal(n);


let CONFIG: Record<string, number> = {};

async function main() {
    console.log('🌱 SEED EXHAUSTIVO DE ESCENARIOS');
    console.log('='.repeat(80));

    const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMIN' } });
    if (!admin) throw new Error('❌ Admin no encontrado. Ejecuta: npx prisma db seed');

    // Cargar configuraciones
    const configs = await prisma.configuracionSistema.findMany();
    for (const cfg of configs) CONFIG[cfg.clave] = parseFloat(cfg.valor);

    const COSTO_INV = CONFIG['COSTO_INVERSION_TRABIX'];
    const APORTE_FONDO = CONFIG['APORTE_FONDO_POR_TRABIX'];
    const PRECIO_UNI = CONFIG['PRECIO_UNIDAD'];
    const PRECIO_PROMO = CONFIG['PRECIO_PROMO'];
    const PRECIO_SL = CONFIG['PRECIO_SIN_LICOR'];
    const DEPOSITO = CONFIG['COSTO_DEPOSITO'];
    const MENS_CON = CONFIG['MENSUALIDAD_CON_DEPOSITO'];
    const MENS_SIN = CONFIG['MENSUALIDAD_SIN_DEPOSITO'];
    const DANO_NEV = CONFIG['COSTO_DANO_NEVERA'];
    const DANO_PIJ = CONFIG['COSTO_DANO_PIJAMA'];
    const MIN_VMAYOR = CONFIG['MINIMO_VENTA_MAYOR'];

    console.log(`\n📋 Configs: INV=$${COSTO_INV} | UNI=$${PRECIO_UNI} | PROMO=$${PRECIO_PROMO}`);

    // Stock
    let stock = await prisma.stockAdmin.findFirst();
    if (!stock) stock = await prisma.stockAdmin.create({ data: { stockFisico: 50000 } });
    else await prisma.stockAdmin.update({ where: { id: stock.id }, data: { stockFisico: 50000 } });

    // ===== JERARQUÍA 5 NIVELES =====
    console.log('\n👥 JERARQUÍA 5 NIVELES (2 ramas)');

    // @ts-ignore
    const recN2A = await prisma.usuario.upsert({
        where: { cedula: 'REC-N2-A' }, update: {},
        create: { cedula: 'REC-N2-A', nombre: 'Reclutador A', apellidos: 'Nivel 2', email: 'rec.n2.a@test.com', telefono: '3100000021', passwordHash: hash('Test123!'), rol: Rol.VENDEDOR, estado: EstadoUsuario.ACTIVO, reclutadorId: admin.id },
    });
    const recN3A = await prisma.usuario.upsert({
        where: { cedula: 'REC-N3-A' }, update: {},
        create: { cedula: 'REC-N3-A', nombre: 'Reclutador A', apellidos: 'Nivel 3', email: 'rec.n3.a@test.com', telefono: '3100000031', passwordHash: hash('Test123!'), rol: Rol.VENDEDOR, estado: EstadoUsuario.ACTIVO, reclutadorId: recN2A.id },
    });
    const recN4A = await prisma.usuario.upsert({
        where: { cedula: 'REC-N4-A' }, update: {},
        create: { cedula: 'REC-N4-A', nombre: 'Reclutador A', apellidos: 'Nivel 4', email: 'rec.n4.a@test.com', telefono: '3100000041', passwordHash: hash('Test123!'), rol: Rol.VENDEDOR, estado: EstadoUsuario.ACTIVO, reclutadorId: recN3A.id },
    });
    const venN5A1 = await prisma.usuario.upsert({
        where: { cedula: 'VEN-N5-A1' }, update: {},
        create: { cedula: 'VEN-N5-A1', nombre: 'Vendedor A1', apellidos: 'Nivel 5', email: 'ven.n5.a1@test.com', telefono: '3100000051', passwordHash: hash('Test123!'), rol: Rol.VENDEDOR, estado: EstadoUsuario.ACTIVO, reclutadorId: recN4A.id },
    });
    const venN5A2 = await prisma.usuario.upsert({
        where: { cedula: 'VEN-N5-A2' }, update: {},
        create: { cedula: 'VEN-N5-A2', nombre: 'Vendedor A2', apellidos: 'Nivel 5', email: 'ven.n5.a2@test.com', telefono: '3100000052', passwordHash: hash('Test123!'), rol: Rol.VENDEDOR, estado: EstadoUsuario.ACTIVO, reclutadorId: recN4A.id },
    });
    const venN5A3 = await prisma.usuario.upsert({
        where: { cedula: 'VEN-N5-A3' }, update: {},
        create: { cedula: 'VEN-N5-A3', nombre: 'Vendedor A3', apellidos: 'Nivel 5', email: 'ven.n5.a3@test.com', telefono: '3100000053', passwordHash: hash('Test123!'), rol: Rol.VENDEDOR, estado: EstadoUsuario.ACTIVO, reclutadorId: recN4A.id },
    });

    // Rama B
    const recN2B = await prisma.usuario.upsert({
        where: { cedula: 'REC-N2-B' }, update: {},
        create: { cedula: 'REC-N2-B', nombre: 'Reclutador B', apellidos: 'Nivel 2', email: 'rec.n2.b@test.com', telefono: '3100000022', passwordHash: hash('Test123!'), rol: Rol.VENDEDOR, estado: EstadoUsuario.ACTIVO, reclutadorId: admin.id },
    });
    const recN3B = await prisma.usuario.upsert({
        where: { cedula: 'REC-N3-B' }, update: {},
        create: { cedula: 'REC-N3-B', nombre: 'Reclutador B', apellidos: 'Nivel 3', email: 'rec.n3.b@test.com', telefono: '3100000033', passwordHash: hash('Test123!'), rol: Rol.VENDEDOR, estado: EstadoUsuario.ACTIVO, reclutadorId: recN2B.id },
    });
    const recN4B = await prisma.usuario.upsert({
        where: { cedula: 'REC-N4-B' }, update: {},
        create: { cedula: 'REC-N4-B', nombre: 'Reclutador B', apellidos: 'Nivel 4', email: 'rec.n4.b@test.com', telefono: '3100000043', passwordHash: hash('Test123!'), rol: Rol.VENDEDOR, estado: EstadoUsuario.ACTIVO, reclutadorId: recN3B.id },
    });
    const venN5B1 = await prisma.usuario.upsert({
        where: { cedula: 'VEN-N5-B1' }, update: {},
        create: { cedula: 'VEN-N5-B1', nombre: 'Vendedor B1', apellidos: 'Nivel 5', email: 'ven.n5.b1@test.com', telefono: '3100000054', passwordHash: hash('Test123!'), rol: Rol.VENDEDOR, estado: EstadoUsuario.ACTIVO, reclutadorId: recN4B.id },
    });

    console.log('   ✅ Jerarquía creada');

    // ===== VENDEDORES 60/40 =====
    console.log('\n👤 VENDEDORES 60/40 (50 escenarios)');

    const escenarios = [
        // Estados
        { cedula: 'V60-ACTIVO', nombre: 'Activo', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-SINPWD', nombre: 'Sin Pwd', estado: EstadoUsuario.ACTIVO, pwd: false },
        { cedula: 'V60-INACTIVO', nombre: 'Inactivo', estado: EstadoUsuario.INACTIVO, pwd: true },
        // Equipamiento
        { cedula: 'V60-EQ-ALDIA', nombre: 'Eq Al Día', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-EQ-SINDEP', nombre: 'Eq Sin Dep', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-EQ-ATRAS', nombre: 'Eq Atrasado', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-EQ-DANO-N', nombre: 'Daño Nevera', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-EQ-DANO-P', nombre: 'Daño Pijama', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-EQ-DANO-A', nombre: 'Daño Ambos', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-EQ-PERDIDO', nombre: 'Perdido', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-EQ-DEVUELTO', nombre: 'Devuelto', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-EQ-SOLICIT', nombre: 'Solicitado', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-SIN-EQ', nombre: 'Sin Equipo', estado: EstadoUsuario.ACTIVO, pwd: true },
        // Lotes
        { cedula: 'V60-L-CREADO', nombre: 'Lote Creado', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-T-LIBERADA', nombre: 'T Liberada', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-T-TRANSITO', nombre: 'T Tránsito', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-T-ENCASA', nombre: 'T EnCasa', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-L-FINAL', nombre: 'Lote Final', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-MULTI-L', nombre: 'Multi Lotes', estado: EstadoUsuario.ACTIVO, pwd: true },
        // Tamaños
        { cedula: 'V60-L1', nombre: 'Lote 1', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-L2', nombre: 'Lote 2', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-L49', nombre: 'Lote 49', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-L50', nombre: 'Lote 50', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-L51', nombre: 'Lote 51', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-L99', nombre: 'Lote 99', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-L100', nombre: 'Lote 100', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-L101', nombre: 'Lote 101', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-L200', nombre: 'Lote 200', estado: EstadoUsuario.ACTIVO, pwd: true },
        // Ventas
        { cedula: 'V60-VD-PEND', nombre: 'V Pendiente', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-VD-APROB', nombre: 'V Aprobada', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-VD-RECH', nombre: 'V Rechazada', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-VD-MIXTA', nombre: 'V Mixta', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-VD-UNI', nombre: 'Solo Uni', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-VD-PROMO', nombre: 'Solo Promo', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-VD-SL', nombre: 'Solo SL', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-LIM-REG', nombre: 'Lim Regalo', estado: EstadoUsuario.ACTIVO, pwd: true },
        // Ventas Mayor
        { cedula: 'V60-VM-ANT-P', nombre: 'VM Ant Pend', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-VM-ANT-C', nombre: 'VM Ant Comp', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-VM-CON-P', nombre: 'VM Con Pend', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-VM-CON-C', nombre: 'VM Con Comp', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-VM-FORZ', nombre: 'VM Forzado', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-SIN-L-VM', nombre: 'Sin L VMayor', estado: EstadoUsuario.ACTIVO, pwd: true },
        // Cuadres
        { cedula: 'V60-C-INACT', nombre: 'C Inactivo', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-C-PEND', nombre: 'C Pendiente', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-C-EXIT', nombre: 'C Exitoso', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-C-PARC', nombre: 'C Parcial', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-MINI-C', nombre: 'Mini Cuadre', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-C-DEUDA', nombre: 'C Con Deuda', estado: EstadoUsuario.ACTIVO, pwd: true },
        // Edge cases
        { cedula: 'V60-EDGE-2H', nombre: 'Edge 2H', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-EDGE-S0', nombre: 'Stock 0', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-EDGE-S1', nombre: 'Stock 1', estado: EstadoUsuario.ACTIVO, pwd: true },
        { cedula: 'V60-EDGE-TRIG', nombre: 'Trigger', estado: EstadoUsuario.ACTIVO, pwd: true },
    ];

    const v: Record<string, any> = {};
    for (const e of escenarios) {
        v[e.cedula] = await prisma.usuario.upsert({
            where: { cedula: e.cedula }, update: {},
            create: { cedula: e.cedula, nombre: e.nombre, apellidos: 'Test', email: `${e.cedula.toLowerCase()}@test.com`, telefono: `320${Math.random().toString().slice(2,9)}`, passwordHash: hash('Test123!'), rol: Rol.VENDEDOR, estado: e.estado, reclutadorId: admin.id },
        });
    }
    console.log(`   ✅ ${escenarios.length} vendedores`);

    // ===== EQUIPAMIENTO =====
    console.log('\n🧊 EQUIPAMIENTO');
    await prisma.equipamiento.upsert({ where: { vendedorId: v['V60-EQ-ALDIA'].id }, update: {}, create: { vendedorId: v['V60-EQ-ALDIA'].id, estado: 'ACTIVO', tieneDeposito: true, depositoPagado: decimal(DEPOSITO), mensualidadActual: decimal(MENS_CON), ultimaMensualidadPagada: new Date(), fechaSolicitud: daysAgo(60), fechaEntrega: daysAgo(55) }});
    await prisma.equipamiento.upsert({ where: { vendedorId: v['V60-EQ-SINDEP'].id }, update: {}, create: { vendedorId: v['V60-EQ-SINDEP'].id, estado: 'ACTIVO', tieneDeposito: false, mensualidadActual: decimal(MENS_SIN), ultimaMensualidadPagada: new Date(), fechaSolicitud: daysAgo(50), fechaEntrega: daysAgo(45) }});
    await prisma.equipamiento.upsert({ where: { vendedorId: v['V60-EQ-ATRAS'].id }, update: {}, create: { vendedorId: v['V60-EQ-ATRAS'].id, estado: 'ACTIVO', tieneDeposito: false, mensualidadActual: decimal(MENS_SIN), ultimaMensualidadPagada: daysAgo(45), fechaSolicitud: daysAgo(90), fechaEntrega: daysAgo(85) }});
    await prisma.equipamiento.upsert({ where: { vendedorId: v['V60-EQ-DANO-N'].id }, update: {}, create: { vendedorId: v['V60-EQ-DANO-N'].id, estado: 'DANADO', tieneDeposito: true, depositoPagado: decimal(DEPOSITO), mensualidadActual: decimal(MENS_CON), deudaDano: decimal(DANO_NEV), ultimaMensualidadPagada: new Date(), fechaSolicitud: daysAgo(100), fechaEntrega: daysAgo(95) }});
    await prisma.equipamiento.upsert({ where: { vendedorId: v['V60-EQ-DANO-P'].id }, update: {}, create: { vendedorId: v['V60-EQ-DANO-P'].id, estado: 'DANADO', tieneDeposito: true, depositoPagado: decimal(DEPOSITO), mensualidadActual: decimal(MENS_CON), deudaDano: decimal(DANO_PIJ), ultimaMensualidadPagada: new Date(), fechaSolicitud: daysAgo(100), fechaEntrega: daysAgo(95) }});
    await prisma.equipamiento.upsert({ where: { vendedorId: v['V60-EQ-DANO-A'].id }, update: {}, create: { vendedorId: v['V60-EQ-DANO-A'].id, estado: 'DANADO', tieneDeposito: true, depositoPagado: decimal(DEPOSITO), mensualidadActual: decimal(MENS_CON), deudaDano: decimal(DANO_NEV + DANO_PIJ), ultimaMensualidadPagada: new Date(), fechaSolicitud: daysAgo(80), fechaEntrega: daysAgo(75) }});
    await prisma.equipamiento.upsert({ where: { vendedorId: v['V60-EQ-PERDIDO'].id }, update: {}, create: { vendedorId: v['V60-EQ-PERDIDO'].id, estado: 'PERDIDO', tieneDeposito: true, depositoPagado: decimal(DEPOSITO), mensualidadActual: decimal(MENS_CON), deudaPerdida: decimal(DANO_NEV + DANO_PIJ), ultimaMensualidadPagada: daysAgo(20), fechaSolicitud: daysAgo(150), fechaEntrega: daysAgo(145) }});
    await prisma.equipamiento.upsert({ where: { vendedorId: v['V60-EQ-DEVUELTO'].id }, update: {}, create: { vendedorId: v['V60-EQ-DEVUELTO'].id, estado: 'DEVUELTO', tieneDeposito: true, depositoPagado: decimal(DEPOSITO), depositoDevuelto: true, fechaDevolucionDeposito: daysAgo(5), mensualidadActual: decimal(MENS_CON), ultimaMensualidadPagada: daysAgo(10), fechaSolicitud: daysAgo(200), fechaEntrega: daysAgo(195), fechaDevolucion: daysAgo(5) }});
    await prisma.equipamiento.upsert({ where: { vendedorId: v['V60-EQ-SOLICIT'].id }, update: {}, create: { vendedorId: v['V60-EQ-SOLICIT'].id, estado: 'SOLICITADO', tieneDeposito: true, depositoPagado: decimal(DEPOSITO), mensualidadActual: decimal(MENS_CON), fechaSolicitud: daysAgo(2) }});
    await prisma.equipamiento.upsert({ where: { vendedorId: v['V60-C-DEUDA'].id }, update: {}, create: { vendedorId: v['V60-C-DEUDA'].id, estado: 'DANADO', tieneDeposito: false, mensualidadActual: decimal(MENS_SIN), deudaDano: decimal(DANO_NEV), ultimaMensualidadPagada: daysAgo(35), fechaSolicitud: daysAgo(100), fechaEntrega: daysAgo(95) }});
    console.log('   ✅ 10 equipamientos');

    // ===== LOTES =====
    console.log('\n📦 LOTES Y TANDAS');

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
                fechaActivacion:
                    estado !== EstadoLote.CREADO ? daysAgo((opt.dias || 30) - 2) : null,
            },
        });

        const ESTADOS_EN_TRANSITO = [
            EstadoTanda.EN_TRANSITO,
            EstadoTanda.EN_CASA,
            EstadoTanda.FINALIZADA,
        ] as const;

        const ESTADOS_EN_CASA = [
            EstadoTanda.EN_CASA,
            EstadoTanda.FINALIZADA,
        ] as const;

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
                    fechaLiberacion:
                        et === EstadoTanda.INACTIVA ? null : daysAgo(27 - i),
                    fechaEnTransito: ESTADOS_EN_TRANSITO.includes(
                        et as typeof ESTADOS_EN_TRANSITO[number]
                    )
                        ? daysAgo(26 - i)
                        : null,
                    fechaEnCasa: ESTADOS_EN_CASA.includes(
                        et as typeof ESTADOS_EN_CASA[number]
                    )
                        ? daysAgo(25 - i)
                        : null,
                    fechaFinalizada:
                        et === EstadoTanda.FINALIZADA ? daysAgo(1) : null,
                },
            });
        }

        return lote;
    }


    // Estados de lote
    await crearLote(v['V60-L-CREADO'].id, 100, EstadoLote.CREADO);
    await crearLote(v['V60-T-LIBERADA'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.LIBERADA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-T-TRANSITO'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_TRANSITO, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-T-ENCASA'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA], stocks: [25, 33, 33] });
    await crearLote(v['V60-L-FINAL'].id, 50, EstadoLote.FINALIZADO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.FINALIZADA, EstadoTanda.FINALIZADA], stocks: [0, 0] });

    // Multi lotes
    for (let i = 0; i < 4; i++) await crearLote(v['V60-MULTI-L'].id, 50, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA], stocks: [25 - i * 3, 25], dias: 60 - i * 10 });

    // Tamaños
    await crearLote(v['V60-L1'].id, 1, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-L2'].id, 2, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-L49'].id, 49, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-L50'].id, 50, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-L51'].id, 51, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-L99'].id, 99, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-L100'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-L101'].id, 101, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-L200'].id, 200, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });

    // Para ventas
    await crearLote(v['V60-VD-PEND'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-VD-APROB'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-VD-RECH'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-VD-MIXTA'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-VD-UNI'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-VD-PROMO'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-VD-SL'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-LIM-REG'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA], stocks: [20, 33, 33] });

    // Para ventas mayor
    await crearLote(v['V60-VM-ANT-P'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-VM-ANT-C'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-VM-CON-P'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-VM-CON-C'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-VM-FORZ'].id, 30, EstadoLote.FINALIZADO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.FINALIZADA, EstadoTanda.FINALIZADA], stocks: [0, 0], forzado: true });

    // Para cuadres
    await crearLote(v['V60-C-INACT'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA] });
    await crearLote(v['V60-C-PEND'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA], stocks: [3, 33, 33] });
    await crearLote(v['V60-C-EXIT'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.FINALIZADA, EstadoTanda.EN_CASA, EstadoTanda.INACTIVA], stocks: [0, 20, 33] });
    await crearLote(v['V60-C-PARC'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA], stocks: [5, 33, 33] });
    await crearLote(v['V60-MINI-C'].id, 50, EstadoLote.FINALIZADO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.FINALIZADA, EstadoTanda.FINALIZADA], stocks: [0, 0] });
    await crearLote(v['V60-C-DEUDA'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA], stocks: [5, 33, 33] });

    // Edge cases
    const l2h = await crearLote(v['V60-EDGE-2H'].id, 50, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.LIBERADA, EstadoTanda.INACTIVA] });
    await prisma.tanda.updateMany({ where: { loteId: l2h.id, numero: 1 }, data: { fechaLiberacion: minutesAgo(119) } });
    await crearLote(v['V60-EDGE-S0'].id, 50, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.FINALIZADA, EstadoTanda.EN_CASA], stocks: [0, 25] });
    await crearLote(v['V60-EDGE-S1'].id, 50, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA], stocks: [1, 25] });
    await crearLote(v['V60-EDGE-TRIG'].id, 100, EstadoLote.ACTIVO, ModeloNegocio.MODELO_60_40, { tandas: [EstadoTanda.EN_CASA, EstadoTanda.INACTIVA, EstadoTanda.INACTIVA], stocks: [3, 33, 33] });

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

    const lc = await prisma.lote.count();
    const tc = await prisma.tanda.count();
    console.log(`   ✅ ${lc} lotes, ${tc} tandas`);

    // ===== VENTAS DETAL =====
    console.log('\n🛒 VENTAS AL DETAL');

    async function crearVenta(vendedorId: string, estado: EstadoVenta, det: { t: TipoVenta, c: number }[]) {
        const tanda = await prisma.tanda.findFirst({ where: { lote: { vendedorId }, estado: 'EN_CASA' } });
        if (!tanda) return;
        const precios: Record<TipoVenta, number> = { UNIDAD: PRECIO_UNI, PROMO: PRECIO_PROMO, SIN_LICOR: PRECIO_SL, REGALO: 0 };
        let total = 0;
        let cantidadTrabix = 0;
        for (const d of det) total += precios[d.t] * d.c;
        const venta = await prisma.venta.create({ data: { vendedorId, tandaId: tanda.id, loteId: tanda.loteId, cantidadTrabix, montoTotal: decimal(total), estado, fechaRegistro: daysAgo(estado === 'PENDIENTE' ? 1 : 5), fechaValidacion: estado !== 'PENDIENTE' ? daysAgo(4) : null }});
        for (const d of det) await prisma.detalleVenta.create({ data: { ventaId: venta.id, tipo: d.t, cantidad: d.c, precioUnitario: decimal(precios[d.t]), subtotal: decimal(precios[d.t] * d.c) }});
    }

    await crearVenta(v['V60-VD-PEND'].id, EstadoVenta.PENDIENTE, [{ t: TipoVenta.UNIDAD, c: 3 }]);
    await crearVenta(v['V60-VD-PEND'].id, EstadoVenta.PENDIENTE, [{ t: TipoVenta.PROMO, c: 2 }]);
    await crearVenta(v['V60-VD-PEND'].id, EstadoVenta.PENDIENTE, [{ t: TipoVenta.SIN_LICOR, c: 4 }]);
    await crearVenta(v['V60-VD-APROB'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.UNIDAD, c: 5 }]);
    await crearVenta(v['V60-VD-APROB'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.PROMO, c: 3 }]);
    await crearVenta(v['V60-VD-APROB'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.UNIDAD, c: 2 }, { t: TipoVenta.REGALO, c: 1 }]);
    await crearVenta(v['V60-VD-RECH'].id, EstadoVenta.RECHAZADA, [{ t: TipoVenta.UNIDAD, c: 10 }]);
    await crearVenta(v['V60-VD-MIXTA'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.PROMO, c: 3 }, { t: TipoVenta.UNIDAD, c: 4 }, { t: TipoVenta.SIN_LICOR, c: 2 }, { t: TipoVenta.REGALO, c: 1 }]);
    await crearVenta(v['V60-VD-UNI'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.UNIDAD, c: 10 }]);
    await crearVenta(v['V60-VD-PROMO'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.PROMO, c: 5 }]);
    await crearVenta(v['V60-VD-SL'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.SIN_LICOR, c: 8 }]);
    await crearVenta(v['V60-LIM-REG'].id, EstadoVenta.APROBADA, [{ t: TipoVenta.REGALO, c: 7 }]);
    await crearVenta(venN5A1.id, EstadoVenta.APROBADA, [{ t: TipoVenta.UNIDAD, c: 10 }]);
    await crearVenta(venN5A1.id, EstadoVenta.APROBADA, [{ t: TipoVenta.PROMO, c: 5 }]);

    const vc = await prisma.venta.count();
    console.log(`   ✅ ${vc} ventas`);

    // ===== VENTAS MAYOR =====
    console.log('\n💼 VENTAS AL MAYOR');
    await prisma.ventaMayor.create({ data: { vendedorId: v['V60-VM-ANT-P'].id, cantidadUnidades: MIN_VMAYOR + 9, precioUnidad: decimal(PRECIO_UNI), modalidad: 'ANTICIPADO', estado: 'PENDIENTE', ingresoBruto: decimal((MIN_VMAYOR + 9) * PRECIO_UNI), fechaRegistro: daysAgo(3) }});
    await prisma.ventaMayor.create({ data: { vendedorId: v['V60-VM-ANT-C'].id, cantidadUnidades: MIN_VMAYOR + 4, precioUnidad: decimal(PRECIO_UNI), modalidad: 'ANTICIPADO', estado: 'COMPLETADA', ingresoBruto: decimal((MIN_VMAYOR + 4) * PRECIO_UNI), fechaRegistro: daysAgo(10), fechaCompletada: daysAgo(5) }});
    await prisma.ventaMayor.create({ data: { vendedorId: v['V60-VM-CON-P'].id, cantidadUnidades: MIN_VMAYOR, precioUnidad: decimal(PRECIO_UNI), modalidad: 'CONTRAENTREGA', estado: 'PENDIENTE', ingresoBruto: decimal(MIN_VMAYOR * PRECIO_UNI), fechaRegistro: daysAgo(2) }});
    await prisma.ventaMayor.create({ data: { vendedorId: v['V60-VM-CON-C'].id, cantidadUnidades: MIN_VMAYOR + 14, precioUnidad: decimal(PRECIO_UNI), modalidad: 'CONTRAENTREGA', estado: 'COMPLETADA', ingresoBruto: decimal((MIN_VMAYOR + 14) * PRECIO_UNI), fechaRegistro: daysAgo(15), fechaCompletada: daysAgo(10) }});
    const lf = await prisma.lote.findFirst({ where: { vendedorId: v['V60-VM-FORZ'].id } });
    if (lf) await prisma.ventaMayor.create({ data: { vendedorId: v['V60-VM-FORZ'].id, cantidadUnidades: 30, precioUnidad: decimal(PRECIO_UNI), modalidad: 'ANTICIPADO', estado: 'COMPLETADA', ingresoBruto: decimal(30 * PRECIO_UNI), fechaRegistro: daysAgo(20), fechaCompletada: daysAgo(15) }});

    const vmc = await prisma.ventaMayor.count();
    console.log(`   ✅ ${vmc} ventas mayor`);

    // ===== CUADRES =====
    console.log('\n💰 CUADRES');
    const tCI = await prisma.tanda.findFirst({ where: { lote: { vendedorId: v['V60-C-INACT'].id } } });
    if (tCI) await prisma.cuadre.create({ data: { tandaId: tCI.id, concepto: ConceptoCuadre.INVERSION_ADMIN, montoEsperado: decimal(50 * COSTO_INV), montoRecibido: decimal(0), montoFaltante: decimal(50 * COSTO_INV), estado: EstadoCuadre.INACTIVO }});
    const tCP = await prisma.tanda.findFirst({ where: { lote: { vendedorId: v['V60-C-PEND'].id } } });
    if (tCP) await prisma.cuadre.create({ data: { tandaId: tCP.id, concepto: ConceptoCuadre.INVERSION_ADMIN, montoEsperado: decimal(50 * COSTO_INV), montoRecibido: decimal(0), montoFaltante: decimal(50 * COSTO_INV), estado: EstadoCuadre.PENDIENTE, fechaPendiente: daysAgo(3) }});
    const tCE = await prisma.tanda.findFirst({ where: { lote: { vendedorId: v['V60-C-EXIT'].id }, numero: 1 } });
    if (tCE) await prisma.cuadre.create({ data: { tandaId: tCE.id, concepto: ConceptoCuadre.INVERSION_ADMIN, montoEsperado: decimal(50 * COSTO_INV), montoRecibido: decimal(50 * COSTO_INV), montoFaltante: decimal(0), estado: EstadoCuadre.EXITOSO, fechaPendiente: daysAgo(10), fechaExitoso: daysAgo(7) }});
    const tCPa = await prisma.tanda.findFirst({ where: { lote: { vendedorId: v['V60-C-PARC'].id } } });
    if (tCPa) await prisma.cuadre.create({ data: { tandaId: tCPa.id, concepto: ConceptoCuadre.MIXTO, montoEsperado: decimal(50 * COSTO_INV), montoRecibido: decimal(30 * COSTO_INV), montoFaltante: decimal(20 * COSTO_INV), estado: EstadoCuadre.PENDIENTE, fechaPendiente: daysAgo(5) }});
    const tMC = await prisma.tanda.findFirst({ where: { lote: { vendedorId: v['V60-MINI-C'].id }, numero: 2 } });
    if (tMC) await prisma.cuadre.create({ data: { tandaId: tMC.id, concepto: ConceptoCuadre.GANANCIAS, montoEsperado: decimal(20000), montoRecibido: decimal(0), montoFaltante: decimal(20000), estado: EstadoCuadre.PENDIENTE, fechaPendiente: daysAgo(1) }});
    const tCD = await prisma.tanda.findFirst({ where: { lote: { vendedorId: v['V60-C-DEUDA'].id } } });
    if (tCD) await prisma.cuadre.create({ data: { tandaId: tCD.id, concepto: ConceptoCuadre.MIXTO, montoEsperado: decimal(50 * COSTO_INV + DANO_NEV + MENS_SIN), montoRecibido: decimal(0), montoFaltante: decimal(50 * COSTO_INV + DANO_NEV + MENS_SIN), estado: EstadoCuadre.PENDIENTE, fechaPendiente: daysAgo(2) }});

    // Cuadres jerarquía
    const tN5A1 = await prisma.tanda.findFirst({ where: { lote: { vendedorId: venN5A1.id }, numero: 1 } });
    if (tN5A1) await prisma.cuadre.create({ data: { tandaId: tN5A1.id, concepto: ConceptoCuadre.MIXTO, montoEsperado: decimal(10 * PRECIO_UNI + 5 * PRECIO_PROMO), montoRecibido: decimal(10 * PRECIO_UNI + 5 * PRECIO_PROMO), montoFaltante: decimal(0), estado: EstadoCuadre.EXITOSO, fechaPendiente: daysAgo(5), fechaExitoso: daysAgo(2) }});
    const tN5A2 = await prisma.tanda.findFirst({ where: { lote: { vendedorId: venN5A2.id }, numero: 1 } });
    if (tN5A2) await prisma.cuadre.create({ data: { tandaId: tN5A2.id, concepto: ConceptoCuadre.INVERSION_ADMIN, montoEsperado: decimal(34 * COSTO_INV), montoRecibido: decimal(0), montoFaltante: decimal(34 * COSTO_INV), estado: EstadoCuadre.PENDIENTE, fechaPendiente: daysAgo(3) }});

    const cc = await prisma.cuadre.count();
    console.log(`   ✅ ${cc} cuadres`);

    // ===== FONDO =====
    console.log('\n🏆 FONDO RECOMPENSAS');
    await prisma.transaccionFondo.createMany({ data: [
            { tipo: 'ENTRADA', monto: decimal(100 * APORTE_FONDO),  fechaTransaccion: daysAgo(30) },
            { tipo: 'ENTRADA', monto: decimal(50 * APORTE_FONDO),  fechaTransaccion: daysAgo(28) },
            { tipo: 'ENTRADA', monto: decimal(100 * APORTE_FONDO),  fechaTransaccion: daysAgo(25) },
            { tipo: 'SALIDA', monto: decimal(25000),  fechaTransaccion: daysAgo(15) },
            { tipo: 'ENTRADA', monto: decimal(200 * APORTE_FONDO),  fechaTransaccion: daysAgo(5) },
            { tipo: 'SALIDA', monto: decimal(10000), fechaTransaccion: daysAgo(2) },
        ]});

    const fc = await prisma.transaccionFondo.count();
    console.log(`   ✅ ${fc} transacciones`);

    // ===== RESUMEN =====
    const counts = await prisma.$transaction([prisma.usuario.count(), prisma.lote.count(), prisma.tanda.count(), prisma.venta.count(), prisma.cuadre.count(), prisma.equipamiento.count(), prisma.ventaMayor.count(), prisma.transaccionFondo.count()]);
    console.log('\n' + '='.repeat(80));
    console.log('✅ SEED COMPLETADO');
    console.log(`   Usuarios: ${counts[0]} | Lotes: ${counts[1]} | Tandas: ${counts[2]} | Ventas: ${counts[3]}`);
    console.log(`   Cuadres: ${counts[4]} | Equipamientos: ${counts[5]} | VMayor: ${counts[6]} | Fondo: ${counts[7]}`);
    console.log('\n📋 Password: Test123! para todos (Admin123! para admin)');
    console.log('🚀 Listo para pruebas!\n');
}

main().catch(e => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());