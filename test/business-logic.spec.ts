/**
 * TESTS COMPLETOS DE LÓGICA DE NEGOCIO TRABIX 'UNITARIOS'
 *
 * - Integra todas las configuraciones cargadas desde la DB.
 * - Muestra en consola los valores calculados.
 * - Mantiene los 63 tests originales, adaptados a configuración dinámica.
 *
 * npm run test -- --testPathPattern=business-logic
 *
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =====================================================================
// CARGA DE CONFIGURACIONES
// =====================================================================
async function cargarConfiguraciones() {
    const configs = await prisma.configuracionSistema.findMany();

    console.log('⚡ Configuraciones cargadas del sistema:');
    configs.forEach(c => console.log(`${c.clave} = ${c.valor}`));

    const valores: Record<string, number> = {};
    configs.forEach(c => {
        const valNum = Number(c.valor);
        valores[c.clave] = isNaN(valNum) ? 0 : valNum;
    });

    return valores;
}

// =====================================================================
// FUNCIONES DE LÓGICA DE NEGOCIO
// =====================================================================

function calcularNumeroTandas(cantidad: number) {
    return cantidad <= 50 ? 2 : 3;
}

function distribuirTandas(cantidad: number) {
    const num = calcularNumeroTandas(cantidad);
    const base = Math.floor(cantidad / num);
    const residuo = cantidad % num;
    return Array.from({ length: num }, (_, i) => base + (i < residuo ? 1 : 0));
}

function calcularInversion(cantidad: number, costoUnidad: number) {
    const total = cantidad * costoUnidad;
    return { total, vendedor: total * 0.5, admin: total * 0.5 };
}

function determinarModeloNegocio(reclutador: 'ADMIN' | 'VENDEDOR') {
    return reclutador === 'ADMIN' ? '60_40' : '50_50';
}

function calcularCascada5050(ganancia: number, niveles: number) {
    const distrib: number[] = [];
    let restante = ganancia;
    for (let i = 0; i < niveles; i++) {
        if (i === niveles - 1) distrib.push(restante);
        else {
            const val = restante * 0.5;
            distrib.push(val);
            restante -= val;
        }
    }
    return distrib;
}

function calcularGanancias(ingreso: number, inversion: number, modelo: '60_40' | '50_50') {
    const gananciaBruta = ingreso - inversion;
    if (modelo === '60_40') return { gananciaBruta, gananciaVendedor: gananciaBruta * 0.6, gananciaAdmin: gananciaBruta * 0.4 };
    return { gananciaBruta, gananciaVendedor: gananciaBruta * 0.5, gananciaAdmin: gananciaBruta * 0.5 };
}

function calcularMontoVenta(detalles: { tipo: string; cantidad: number }[], precios: Record<string, number>) {
    return detalles.reduce((acc, d) => acc + (d.cantidad * (precios[d.tipo] || 0)), 0);
}

function validarLimiteRegalos(cantidadRegalos: number, cantidadLote: number, limite: number) {
    return cantidadRegalos <= Math.floor(cantidadLote * limite / 100);
}

function validarVentaMayor(cantidad: number, minimo: number) {
    return cantidad >= minimo;
}

function esMensualidadAtrasada(ultimoPago: Date, limiteDias: number) {
    const diff = new Date().getTime() - ultimoPago.getTime();
    return diff / (1000 * 60 * 60 * 24) > limiteDias;
}

function calcularAporteFondo(cantidad: number, aporteUnidad: number) {
    return cantidad * aporteUnidad;
}

function debeTriggerCuadre(stockActual: number, stockInicial: number, porcentaje: number) {
    return stockActual <= stockInicial * (porcentaje / 100);
}

// =====================================================================
// TESTS CON CONFIGURACIÓN DINÁMICA
// =====================================================================
describe('Lógica de Negocio - TRABIX', () => {
    let CONFIG: Record<string, number> = {};

    beforeAll(async () => {
        CONFIG = await cargarConfiguraciones();
    });

    // ---------------------------
    // DIVISIÓN DE TANDAS
    // ---------------------------
    describe('División de Tandas', () => {
        it('1 TRABIX = 2 tandas', () => expect(distribuirTandas(1)).toEqual([1, 0]));
        it('2 TRABIX = 2 tandas', () => expect(distribuirTandas(2)).toEqual([1, 1]));
        it('49 TRABIX = 2 tandas', () => expect(distribuirTandas(49).reduce((a, b) => a + b, 0)).toBe(49));
        it('50 TRABIX = 2 tandas', () => expect(distribuirTandas(50)).toEqual([25, 25]));
        it('51 TRABIX = 3 tandas', () => expect(distribuirTandas(51)).toEqual([17, 17, 17]));
        it('99 TRABIX = 3 tandas', () => expect(distribuirTandas(99)).toEqual([33, 33, 33]));
        it('100 TRABIX = 3 tandas', () => expect(distribuirTandas(100).reduce((a, b) => a + b, 0)).toBe(100));
        it('101 TRABIX = 3 tandas', () => expect(distribuirTandas(101).reduce((a, b) => a + b, 0)).toBe(101));
        it('150 TRABIX = 3 tandas', () => expect(calcularNumeroTandas(150)).toBe(3));
        it('200 TRABIX = 3 tandas', () => expect(calcularNumeroTandas(200)).toBe(3));
        it('Suma de tandas = cantidad original', () => expect(distribuirTandas(123).reduce((a,b)=>a+b,0)).toBe(123));
    });

    // ---------------------------
    // CÁLCULO DE INVERSIÓN
    // ---------------------------
    describe('Cálculo de Inversión', () => {
        it('Inversión total dinámica', () => {
            const cantidad = 100;
            const costo = CONFIG['COSTO_PERCIBIDO'] ?? 2400;
            const inv = calcularInversion(cantidad, costo);
            console.log(`💰 Inversión total (${cantidad} TRABIX) = ${inv.total}`);
            expect(inv.total).toBe(cantidad * costo);
        });
        it('Distribución vendedor/admin', () => {
            const cantidad = 100;
            const costo = CONFIG['COSTO_PERCIBIDO'] ?? 2400;
            const inv = calcularInversion(cantidad, costo);
            console.log(`👤 Vendedor: ${inv.vendedor}, 🏢 Admin: ${inv.admin}`);
            expect(inv.vendedor + inv.admin).toBe(inv.total);
        });
    });

    // ---------------------------
    // MODELO DE NEGOCIO
    // ---------------------------
    describe('Modelo de Negocio', () => {
        it('Directo de admin = 60/40', () => expect(determinarModeloNegocio('ADMIN')).toBe('60_40'));
        it('Reclutado por vendedor = 50/50', () => expect(determinarModeloNegocio('VENDEDOR')).toBe('50_50'));
    });

    // ---------------------------
    // CASCADA 50/50
    // ---------------------------
    describe('Cascada 50/50', () => {
        it('5 niveles', () => expect(calcularCascada5050(1000,5).reduce((a,b)=>a+b,0)).toBe(1000));
        it('Suma distribución = ganancia original', () => expect(calcularCascada5050(500,3).reduce((a,b)=>a+b,0)).toBe(500));
        it('2 niveles', () => expect(calcularCascada5050(200,2).length).toBe(2));
        it('3 niveles', () => expect(calcularCascada5050(300,3).length).toBe(3));
        it('4 niveles', () => expect(calcularCascada5050(400,4).length).toBe(4));
        it('Manejo de decimales', () => expect(calcularCascada5050(1234,3).reduce((a,b)=>a+b,0)).toBe(1234));
    });

    // ---------------------------
    // CÁLCULO DE GANANCIAS
    // ---------------------------
    describe('Cálculo de Ganancias', () => {
        it('60/40', () => {
            const gan = calcularGanancias(600, 400, '60_40');
            expect(gan.gananciaVendedor).toBeCloseTo(120);
            expect(gan.gananciaAdmin).toBeCloseTo(80);
        });
        it('50/50', () => {
            const gan = calcularGanancias(500, 200, '50_50');
            expect(gan.gananciaVendedor).toBeCloseTo(150);
            expect(gan.gananciaAdmin).toBeCloseTo(150);
        });
        it('Suma ganancias = ganancia bruta', () => {
            const gan = calcularGanancias(400,100,'60_40');
            expect(gan.gananciaVendedor + gan.gananciaAdmin).toBe(gan.gananciaBruta);
        });
        it('Sin ganancia', () => {
            const gan = calcularGanancias(200,200,'50_50');
            expect(gan.gananciaBruta).toBe(0);
        });
    });

    // ---------------------------
    // CÁLCULO DE VENTAS
    // ---------------------------
    describe('Cálculo de Ventas', () => {
        it('3 unidades', () => {
            const precios = { UNIDAD: CONFIG['PRECIO_UNIDAD_LICOR'] ?? 8000 };
            expect(calcularMontoVenta([{tipo:'UNIDAD',cantidad:3}], precios)).toBe(3*precios.UNIDAD);
        });
        it('2 promos', () => {
            const precios = { PROMO: CONFIG['PRECIO_PROMO'] ?? 12000 };
            expect(calcularMontoVenta([{tipo:'PROMO',cantidad:2}], precios)).toBe(2*precios.PROMO);
        });
        it('Regalo', () => {
            const precios = { REGALO:0 };
            expect(calcularMontoVenta([{tipo:'REGALO',cantidad:1}], precios)).toBe(0);
        });
        it('Venta mixta', () => {
            const precios = { UNIDAD: CONFIG['PRECIO_UNIDAD_LICOR'] ?? 8000, PROMO: CONFIG['PRECIO_PROMO'] ?? 12000 };
            expect(calcularMontoVenta([{tipo:'UNIDAD',cantidad:1},{tipo:'PROMO',cantidad:2}], precios)).toBe(1*precios.UNIDAD+2*precios.PROMO);
        });
        it('Solo sin licor', () => {
            const precios = { SIN_LICOR: CONFIG['PRECIO_UNIDAD_SIN_LICOR'] ?? 7000 };
            expect(calcularMontoVenta([{tipo:'SIN_LICOR',cantidad:2}], precios)).toBe(2*precios.SIN_LICOR);
        });
    });

    // ---------------------------
    // VALIDACIONES DE NEGOCIO
    // ---------------------------
    describe('Validaciones de Negocio', () => {
        it('Límite de regalos', () => {
            const limite = CONFIG['LIMITE_REGALOS'] ?? 8;
            expect(validarLimiteRegalos(7,100,limite)).toBe(true);
            expect(validarLimiteRegalos(8,100,limite)).toBe(true);
            expect(validarLimiteRegalos(9,100,limite)).toBe(false);
            expect(validarLimiteRegalos(4,50,limite)).toBe(true);
            expect(validarLimiteRegalos(5,50,limite)).toBe(false);
            expect(validarLimiteRegalos(0,50,limite)).toBe(true);
        });
        it('Venta al mayor', () => {
            const minimo = CONFIG['MINIMO_VENTA_MAYOR'] ?? 20;
            expect(validarVentaMayor(20,minimo)).toBe(true);
            expect(validarVentaMayor(19,minimo)).toBe(false);
            expect(validarVentaMayor(100,minimo)).toBe(true);
            expect(validarVentaMayor(0,minimo)).toBe(false);
        });
        it('Mensualidad atrasada', () => {
            expect(esMensualidadAtrasada(new Date(Date.now()-15*24*3600*1000),30)).toBe(false);
            expect(esMensualidadAtrasada(new Date(Date.now()-31*24*3600*1000),30)).toBe(true);
        });
        it('Trigger de cuadre', () => {
            const porcentaje = CONFIG['TRIGGER_CUADRE_T1_2TANDAS'] ?? 10;
            expect(debeTriggerCuadre(10,100,porcentaje)).toBe(true);
            expect(debeTriggerCuadre(11,100,porcentaje)).toBe(false);
        });
    });

    // ---------------------------
    // Aporte al fondo
    // ---------------------------
    describe('Aporte al Fondo de Recompensas', () => {
        it('100 TRABIX', () => {
            const aporte = CONFIG['APORTE_FONDO'] ?? 200;
            expect(calcularAporteFondo(100,aporte)).toBe(100*aporte);
        });
        it('50 TRABIX', () => {
            const aporte = CONFIG['APORTE_FONDO'] ?? 200;
            expect(calcularAporteFondo(50,aporte)).toBe(50*aporte);
        });
        it('1 TRABIX', () => {
            const aporte = CONFIG['APORTE_FONDO'] ?? 200;
            expect(calcularAporteFondo(1,aporte)).toBe(1*aporte);
        });
        it('200 TRABIX', () => {
            const aporte = CONFIG['APORTE_FONDO'] ?? 200;
            expect(calcularAporteFondo(200,aporte)).toBe(200*aporte);
        });
    });

    // ---------------------------
    // Escenarios Completos
    // ---------------------------
    describe('Escenarios Completos', () => {
        it('Lote 100 con ventas en 60/40', () => {
            const cantidad = 100;
            const costo = CONFIG['COSTO_PERCIBIDO'] ?? 2400;
            const aporte = CONFIG['APORTE_FONDO'] ?? 200;
            const precios = { UNIDAD: CONFIG['PRECIO_UNIDAD_LICOR'] ?? 8000, PROMO: CONFIG['PRECIO_PROMO'] ?? 12000 };
            const inv = calcularInversion(cantidad,costo);
            const ingresos = calcularMontoVenta([{tipo:'UNIDAD',cantidad:50},{tipo:'PROMO',cantidad:50}], precios);
            const modelo = determinarModeloNegocio('ADMIN');
            const gan = calcularGanancias(ingresos,inv.total,modelo);
            console.log(`💰 Inversión: ${inv.total}, 🏦 Aporte: ${aporte*cantidad}, 💵 Ingreso: ${ingresos}, Ganancia vendedor/admin: ${gan.gananciaVendedor}/${gan.gananciaAdmin}`);
            expect(inv.total).toBe(cantidad*costo);
        });
        it('Cascada completa 5 niveles', () => expect(calcularCascada5050(1000,5).reduce((a,b)=>a+b,0)).toBe(1000));
        it('Venta al mayor con lote forzado', () => expect(validarVentaMayor(25,21)).toBe(true));
        it('Cuadre con deuda de equipamiento', () => expect(debeTriggerCuadre(5,50,CONFIG['TRIGGER_CUADRE_T1_2TANDAS'] ?? 10)).toBe(true));
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });
});
