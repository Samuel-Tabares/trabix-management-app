/**
 * SEED COMPLEMENTARIO - TRABIX Backend
 *
 * Añade datos faltantes que los tests esperan pero el seed principal no crea.
 * Ejecutar DESPUÉS del seed principal.
 *
 * Ejecutar: npx ts-node prisma/seeds/test-scenarios-complement.seed.ts
 */

import {
    PrismaClient,
    Rol,
    EstadoUsuario,
    ModeloNegocio,
    EstadoLote,
    EstadoTanda,
    EstadoCuadre,
    EstadoMiniCuadre,
    Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = (pwd: string) => bcrypt.hashSync(pwd, 12);
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const decimal = (n: number) => new Prisma.Decimal(n);

let CONFIG: Record<string, number> = {};

async function main() {
    console.log('🌱 SEED COMPLEMENTARIO');
    console.log('='.repeat(80));

    // Cargar configuraciones
    const configs = await prisma.configuracionSistema.findMany();
    for (const cfg of configs) CONFIG[cfg.clave] = parseFloat(cfg.valor);

    const COSTO_INV = CONFIG['COSTO_PERCIBIDO'];

    const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMIN' } });
    if (!admin) throw new Error('❌ Admin no encontrado');

    // =========================================================================
    // 1. USUARIOS CON CÉDULAS QUE LOS TESTS ESPERAN
    // =========================================================================
    console.log('\n👤 USUARIOS FALTANTES');

    // V60-T-CASA (los tests usan este nombre, el seed tiene V60-T-ENCASA)
    const vTCasa = await prisma.usuario.upsert({
        where: { cedula: 'V60-T-CASA' },
        update: {},
        create: {
            cedula: 'V60-T-CASA',
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

    // V60-VM-ANT (tests buscan este, seed tiene V60-VM-ANT-P)
    const vVMAnt = await prisma.usuario.upsert({
        where: { cedula: 'V60-VM-ANT' },
        update: {},
        create: {
            cedula: 'V60-VM-ANT',
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

    // V60-SIN-L (tests buscan este, seed tiene V60-SIN-L-VM)
    await prisma.usuario.upsert({
        where: { cedula: 'V60-SIN-L' },
        update: {},
        create: {
            cedula: 'V60-SIN-L',
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

    // Usuario con requiereCambioPassword = true (actualizar V60-SINPWD)
    await prisma.usuario.upsert({
        where: { cedula: 'V60-SINPWD' },
        update: { requiereCambioPassword: true },
        create: {
            cedula: 'V60-SINPWD',
            nombre: 'Sin Password Cambiado',
            apellidos: 'Test',
            email: 'v60.sinpwd@test.com',
            telefono: `320${Math.random().toString().slice(2, 9)}`,
            passwordHash: hash('Test123!'),
            requiereCambioPassword: true,
            rol: Rol.VENDEDOR,
            estado: EstadoUsuario.ACTIVO,
            reclutadorId: admin.id,
        },
    });

    console.log('   ✅ Usuarios alias creados');

    // =========================================================================
    // 2. LOTE PARA V60-T-CASA CON TANDA EN_CASA
    // =========================================================================
    console.log('\n📦 LOTE PARA V60-T-CASA');

    const existingLoteTCasa = await prisma.lote.findFirst({
        where: { vendedorId: vTCasa.id },
    });

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

        // Crear 3 tandas (100 > 50)
        await prisma.tanda.createMany({
            data: [
                {
                    loteId: loteTCasa.id,
                    numero: 1,
                    stockInicial: 34,
                    stockActual: 20,
                    estado: EstadoTanda.EN_CASA,
                    fechaLiberacion: daysAgo(27),
                    fechaEnTransito: daysAgo(26),
                    fechaEnCasa: daysAgo(25),
                },
                {
                    loteId: loteTCasa.id,
                    numero: 2,
                    stockInicial: 33,
                    stockActual: 33,
                    estado: EstadoTanda.INACTIVA,
                },
                {
                    loteId: loteTCasa.id,
                    numero: 3,
                    stockInicial: 33,
                    stockActual: 33,
                    estado: EstadoTanda.INACTIVA,
                },
            ],
        });
        console.log('   ✅ Lote V60-T-CASA creado');
    } else {
        console.log('   ⏭️ Lote V60-T-CASA ya existe');
    }

    // =========================================================================
    // 3. MINI-CUADRE
    // =========================================================================
    console.log('\n📋 MINI-CUADRES');

    const loteMiniC = await prisma.lote.findFirst({
        where: {
            vendedor: { cedula: 'V60-MINI-C' },
            estado: EstadoLote.FINALIZADO,
        },
    });

    if (loteMiniC) {
        const existingMiniCuadre = await prisma.miniCuadre.findFirst({
            where: { loteId: loteMiniC.id },
        });

        if (!existingMiniCuadre) {
            // Obtener la última tanda para el tandaId
            const ultimaTanda = await prisma.tanda.findFirst({
                where: { loteId: loteMiniC.id },
                orderBy: { numero: 'desc' },
            });

            await prisma.miniCuadre.create({
                data: {
                    loteId: loteMiniC.id,
                    tandaId: ultimaTanda?.id || '',
                    estado: EstadoMiniCuadre.EXITOSO,
                    montoFinal: decimal(15000),
                    fechaPendiente: daysAgo(5),
                    fechaExitoso: daysAgo(2),
                },
            });
            console.log('   ✅ MiniCuadre EXITOSO creado');
        } else {
            console.log('   ⏭️ MiniCuadre ya existe');
        }
    }

    // Crear otro MiniCuadre PENDIENTE para más cobertura
    const loteFinalizado = await prisma.lote.findFirst({
        where: {
            estado: EstadoLote.FINALIZADO,
            miniCuadre: null,
            NOT: { vendedor: { cedula: 'V60-MINI-C' } },
        },
    });

    if (loteFinalizado) {
        const ultimaTanda = await prisma.tanda.findFirst({
            where: { loteId: loteFinalizado.id },
            orderBy: { numero: 'desc' },
        });

        if (ultimaTanda) {
            await prisma.miniCuadre.create({
                data: {
                    loteId: loteFinalizado.id,
                    tandaId: ultimaTanda.id,
                    estado: EstadoMiniCuadre.PENDIENTE,
                    montoFinal: decimal(10000),
                    fechaPendiente: daysAgo(1),
                },
            });
            console.log('   ✅ MiniCuadre PENDIENTE creado');
        }
    }

    // =========================================================================
    // 4. CUADRE MAYOR CON GANANCIAS RECLUTADORES
    // =========================================================================
    console.log('\n💼 CUADRE MAYOR Y GANANCIAS RECLUTADORES');

    // Buscar una venta mayor COMPLETADA
    const ventaMayorCompletada = await prisma.ventaMayor.findFirst({
        where: { estado: 'COMPLETADA' },
        include: { vendedor: true },
    });

    if (ventaMayorCompletada) {
        const existingCuadreMayor = await prisma.cuadreMayor.findFirst({
            where: { ventaMayorId: ventaMayorCompletada.id },
        });

        if (!existingCuadreMayor) {
            const ingresoBruto = Number(ventaMayorCompletada.ingresoBruto);
            const cantidadUnidades = ventaMayorCompletada.cantidadUnidades;

            // Calcular distribución cascada (simplificado)
            const gananciaBruta = ingresoBruto - cantidadUnidades * COSTO_INV;
            const gananciaVendedor = gananciaBruta * 0.5;
            const restoCascada = gananciaBruta * 0.5;

            // Distribución en cascada: 50% en cada nivel
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
                    cantidadUnidades: cantidadUnidades,
                    precioUnidad: ventaMayorCompletada.precioUnidad,
                    ingresoBruto: ventaMayorCompletada.ingresoBruto,
                    deudasSaldadas: decimal(0),
                    inversionAdminLotesExistentes: decimal(cantidadUnidades * COSTO_INV * 0.5),
                    inversionAdminLoteForzado: decimal(0),
                    inversionVendedorLotesExistentes: decimal(cantidadUnidades * COSTO_INV * 0.5),
                    inversionVendedorLoteForzado: decimal(0),
                    gananciasAdmin: decimal(adminResto),
                    gananciasVendedor: decimal(gananciaVendedor),
                    evaluacionFinanciera: {
                        gananciaBruta,
                        distribucion: { n5, n4, n3, n2, admin: adminResto },
                    },
                    montoTotalAdmin: decimal(cantidadUnidades * COSTO_INV * 0.5 + adminResto),
                    montoTotalVendedor: decimal(cantidadUnidades * COSTO_INV * 0.5 + gananciaVendedor),
                    lotesInvolucradosIds: [],
                    tandasAfectadas: {},
                    cuadresCerradosIds: [],
                    fechaRegistro: daysAgo(10),
                    fechaExitoso: daysAgo(5),
                },
            });

            // Crear ganancias reclutadores (niveles 2-5)
            const reclutadores = await prisma.usuario.findMany({
                where: {
                    cedula: { in: ['REC-N2-A', 'REC-N3-A', 'REC-N4-A', 'VEN-N5-A1'] },
                },
            });

            const nivelesMontos = [
                { nivel: 5, monto: n5 },
                { nivel: 4, monto: n4 },
                { nivel: 3, monto: n3 },
                { nivel: 2, monto: n2 },
            ];

            for (const { nivel, monto } of nivelesMontos) {
                const reclutador = reclutadores.find((r) => {
                    if (nivel === 5) return r.cedula.includes('N5');
                    if (nivel === 4) return r.cedula.includes('N4');
                    if (nivel === 3) return r.cedula.includes('N3');
                    if (nivel === 2) return r.cedula.includes('N2');
                    return false;
                });

                if (reclutador) {
                    await prisma.gananciaReclutador.create({
                        data: {
                            cuadreMayorId: cuadreMayor.id,
                            reclutadorId: reclutador.id,
                            nivel,
                            monto: decimal(monto),
                            transferido: nivel === 5, // Solo el nivel 5 está transferido
                            fechaTransferencia: nivel === 5 ? daysAgo(3) : null,
                        },
                    });
                }
            }

            console.log('   ✅ CuadreMayor EXITOSO + 4 GananciaReclutador creados');
        } else {
            console.log('   ⏭️ CuadreMayor ya existe');
        }
    } else {
        console.log('   ⚠️ No hay VentaMayor COMPLETADA para crear CuadreMayor');
    }

    // =========================================================================
    // 5. TRANSACCIONES FONDO CON MOTIVO
    // =========================================================================
    console.log('\n🏆 TRANSACCIONES FONDO CON MOTIVO');

    const APORTE_FONDO = CONFIG['APORTE_FONDO_POR_TRABIX'] || 200;

    await prisma.transaccionFondo.createMany({
        data: [
            {
                tipo: 'ENTRADA',
                monto: decimal(100 * APORTE_FONDO),
                motivo: 'Aporte lote 100 unidades - V60-L100',
                fechaTransaccion: daysAgo(20),
            },
            {
                tipo: 'ENTRADA',
                monto: decimal(50 * APORTE_FONDO),
                motivo: 'Aporte lote 50 unidades - V60-L50',
                fechaTransaccion: daysAgo(18),
            },
            {
                tipo: 'SALIDA',
                monto: decimal(15000),
                motivo: 'Pago bonificación vendedor destacado',
                fechaTransaccion: daysAgo(10),
            },
        ],
    });

    console.log('   ✅ 3 transacciones con motivo creadas');

    // =========================================================================
    // 6. LOTE PARA V60-VM-ANT
    // =========================================================================
    console.log('\n📦 LOTE PARA V60-VM-ANT');

    const existingLoteVMAnt = await prisma.lote.findFirst({
        where: { vendedorId: vVMAnt.id },
    });

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
                {
                    loteId: loteVMAnt.id,
                    numero: 1,
                    stockInicial: 34,
                    stockActual: 34,
                    estado: EstadoTanda.EN_CASA,
                    fechaLiberacion: daysAgo(22),
                    fechaEnTransito: daysAgo(21),
                    fechaEnCasa: daysAgo(20),
                },
                {
                    loteId: loteVMAnt.id,
                    numero: 2,
                    stockInicial: 33,
                    stockActual: 33,
                    estado: EstadoTanda.INACTIVA,
                },
                {
                    loteId: loteVMAnt.id,
                    numero: 3,
                    stockInicial: 33,
                    stockActual: 33,
                    estado: EstadoTanda.INACTIVA,
                },
            ],
        });
        console.log('   ✅ Lote V60-VM-ANT creado');
    } else {
        console.log('   ⏭️ Lote V60-VM-ANT ya existe');
    }

    // =========================================================================
    // 7. VERIFICAR ADMIN001 (crear si no existe)
    // =========================================================================
    console.log('\n👑 VERIFICAR ADMIN001');

    const admin001 = await prisma.usuario.findFirst({
        where: { cedula: 'ADMIN001' },
    });

    if (!admin001) {
        // Si el admin principal no tiene cedula ADMIN001, crear alias
        await prisma.usuario.update({
            where: { id: admin.id },
            data: { cedula: 'ADMIN001' },
        });
        console.log('   ✅ Admin actualizado a ADMIN001');
    } else {
        console.log('   ⏭️ ADMIN001 ya existe');
    }

    // =========================================================================
    // RESUMEN
    // =========================================================================
    const counts = await prisma.$transaction([
        prisma.usuario.count(),
        prisma.lote.count(),
        prisma.tanda.count(),
        prisma.miniCuadre.count(),
        prisma.cuadreMayor.count(),
        prisma.gananciaReclutador.count(),
        prisma.transaccionFondo.count(),
    ]);

    console.log('\n' + '='.repeat(80));
    console.log('✅ SEED COMPLEMENTARIO COMPLETADO');
    console.log(`   Usuarios: ${counts[0]} | Lotes: ${counts[1]} | Tandas: ${counts[2]}`);
    console.log(`   MiniCuadres: ${counts[3]} | CuadresMayor: ${counts[4]} | GananciasRec: ${counts[5]}`);
    console.log(`   TransaccionesFondo: ${counts[6]}`);
    console.log('\n🚀 Datos complementarios listos!\n');
}

main()
    .catch((e) => {
        console.error('❌', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());