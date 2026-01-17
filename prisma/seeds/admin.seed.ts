import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Configuraciones por defecto del sistema
 * Según sección 1 del documento - Configuraciones Modificables
 */
const configuracionesDefecto = [
  // === PRECIOS ===
  {
    clave: 'COSTO_PERCIBIDO',
    valor: '2400',
    tipo: 'DECIMAL',
    descripcion: 'Costo percibido por TRABIX (inversión del vendedor)',
    categoria: 'PRECIOS',
  },
  {
    clave: 'APORTE_FONDO',
    valor: '200',
    tipo: 'DECIMAL',
    descripcion: 'Aporte al fondo de recompensas por TRABIX',
    categoria: 'PRECIOS',
  },
  {
    clave: 'PRECIO_PROMO',
    valor: '12000',
    tipo: 'DECIMAL',
    descripcion: 'Precio PROMO (2 con licor)',
    categoria: 'PRECIOS',
  },
  {
    clave: 'PRECIO_UNIDAD_LICOR',
    valor: '8000',
    tipo: 'DECIMAL',
    descripcion: 'Precio UNIDAD con licor',
    categoria: 'PRECIOS',
  },
  {
    clave: 'PRECIO_UNIDAD_SIN_LICOR',
    valor: '7000',
    tipo: 'DECIMAL',
    descripcion: 'Precio UNIDAD sin licor',
    categoria: 'PRECIOS',
  },
  // Precios al mayor
  {
    clave: 'PRECIO_MAYOR_20_LICOR',
    valor: '4900',
    tipo: 'DECIMAL',
    descripcion: 'Precio mayor >20 con licor',
    categoria: 'PRECIOS',
  },
  {
    clave: 'PRECIO_MAYOR_50_LICOR',
    valor: '4700',
    tipo: 'DECIMAL',
    descripcion: 'Precio mayor >50 con licor',
    categoria: 'PRECIOS',
  },
  {
    clave: 'PRECIO_MAYOR_100_LICOR',
    valor: '4500',
    tipo: 'DECIMAL',
    descripcion: 'Precio mayor >100 con licor',
    categoria: 'PRECIOS',
  },
  {
    clave: 'PRECIO_MAYOR_20_SIN_LICOR',
    valor: '4800',
    tipo: 'DECIMAL',
    descripcion: 'Precio mayor >20 sin licor',
    categoria: 'PRECIOS',
  },
  {
    clave: 'PRECIO_MAYOR_50_SIN_LICOR',
    valor: '4500',
    tipo: 'DECIMAL',
    descripcion: 'Precio mayor >50 sin licor',
    categoria: 'PRECIOS',
  },
  {
    clave: 'PRECIO_MAYOR_100_SIN_LICOR',
    valor: '4200',
    tipo: 'DECIMAL',
    descripcion: 'Precio mayor >100 sin licor',
    categoria: 'PRECIOS',
  },

  // === PORCENTAJES ===
  {
    clave: 'PORCENTAJE_VENDEDOR_60_40',
    valor: '60',
    tipo: 'PERCENT',
    descripcion: 'Porcentaje ganancia vendedor modelo 60/40',
    categoria: 'PORCENTAJES',
  },
  {
    clave: 'PORCENTAJE_ADMIN_60_40',
    valor: '40',
    tipo: 'PERCENT',
    descripcion: 'Porcentaje ganancia admin modelo 60/40',
    categoria: 'PORCENTAJES',
  },
  {
    clave: 'PORCENTAJE_VENDEDOR_50_50',
    valor: '50',
    tipo: 'PERCENT',
    descripcion: 'Porcentaje ganancia vendedor modelo 50/50',
    categoria: 'PORCENTAJES',
  },
  {
    clave: 'PORCENTAJE_INVERSION_VENDEDOR',
    valor: '50',
    tipo: 'PERCENT',
    descripcion: 'Porcentaje inversión del vendedor',
    categoria: 'PORCENTAJES',
  },
  {
    clave: 'PORCENTAJE_INVERSION_ADMIN',
    valor: '50',
    tipo: 'PERCENT',
    descripcion: 'Porcentaje inversión del admin',
    categoria: 'PORCENTAJES',
  },
  {
    clave: 'LIMITE_REGALOS',
    valor: '8',
    tipo: 'PERCENT',
    descripcion: 'Límite de regalos por tanda',
    categoria: 'PORCENTAJES',
  },
  // Triggers de cuadre
  {
    clave: 'TRIGGER_CUADRE_T2',
    valor: '10',
    tipo: 'PERCENT',
    descripcion: 'Trigger cuadre T2 (3 tandas)',
    categoria: 'PORCENTAJES',
  },
  {
    clave: 'TRIGGER_CUADRE_T3',
    valor: '20',
    tipo: 'PERCENT',
    descripcion: 'Trigger cuadre T3 (3 tandas)',
    categoria: 'PORCENTAJES',
  },
  {
    clave: 'TRIGGER_CUADRE_T1_2TANDAS',
    valor: '10',
    tipo: 'PERCENT',
    descripcion: 'Trigger cuadre T1 (2 tandas)',
    categoria: 'PORCENTAJES',
  },
  {
    clave: 'TRIGGER_CUADRE_T2_2TANDAS',
    valor: '20',
    tipo: 'PERCENT',
    descripcion: 'Trigger cuadre T2 (2 tandas)',
    categoria: 'PORCENTAJES',
  },

  // === EQUIPAMIENTO ===
  {
    clave: 'MENSUALIDAD_CON_DEPOSITO',
    valor: '9990',
    tipo: 'DECIMAL',
    descripcion: 'Mensualidad equipamiento con depósito',
    categoria: 'EQUIPAMIENTO',
  },
  {
    clave: 'MENSUALIDAD_SIN_DEPOSITO',
    valor: '19990',
    tipo: 'DECIMAL',
    descripcion: 'Mensualidad equipamiento sin depósito',
    categoria: 'EQUIPAMIENTO',
  },
  {
    clave: 'DEPOSITO_EQUIPAMIENTO',
    valor: '49990',
    tipo: 'DECIMAL',
    descripcion: 'Depósito inicial equipamiento',
    categoria: 'EQUIPAMIENTO',
  },
  {
    clave: 'COSTO_DANO_NEVERA',
    valor: '30000',
    tipo: 'DECIMAL',
    descripcion: 'Costo por daño de nevera',
    categoria: 'EQUIPAMIENTO',
  },
  {
    clave: 'COSTO_DANO_PIJAMA',
    valor: '60000',
    tipo: 'DECIMAL',
    descripcion: 'Costo por daño de pijama',
    categoria: 'EQUIPAMIENTO',
  },

  // === TIEMPOS ===
  {
    clave: 'TIEMPO_AUTO_TRANSITO_HORAS',
    valor: '2',
    tipo: 'INT',
    descripcion: 'Tiempo auto-tránsito de tanda (horas)',
    categoria: 'TIEMPOS',
  },
];

/**
 * Tipos de insumo obligatorios
 * Según documento: Granizado, Pitillos, Etiquetas, Tablas nutricionales, Envío
 */
const tiposInsumoObligatorios = [
  { nombre: 'Granizado', esObligatorio: true },
  { nombre: 'Pitillos', esObligatorio: true },
  { nombre: 'Etiquetas', esObligatorio: true },
  { nombre: 'Tablas nutricionales', esObligatorio: true },
  { nombre: 'Envío', esObligatorio: true },
];

async function seedConfiguraciones() {
  console.log('🔧 Seeding configuraciones del sistema...');

  for (const config of configuracionesDefecto) {
    await prisma.configuracionSistema.upsert({
      where: { clave: config.clave },
      update: {},
      create: config,
    });
  }

  console.log(`✅ ${configuracionesDefecto.length} configuraciones creadas/actualizadas`);
}

async function seedTiposInsumo() {
  console.log('📦 Seeding tipos de insumo...');

  for (const tipo of tiposInsumoObligatorios) {
    await prisma.tipoInsumo.upsert({
      where: { nombre: tipo.nombre },
      update: {},
      create: tipo,
    });
  }

  console.log(`✅ ${tiposInsumoObligatorios.length} tipos de insumo obligatorios creados`);
}

async function seedStockAdmin() {
  console.log('📊 Seeding stock admin...');

  const existingStock = await prisma.stockAdmin.findFirst();
  if (!existingStock) {
    await prisma.stockAdmin.create({
      data: {
        stockFisico: 0,
      },
    });
    console.log('✅ Stock admin inicializado');
  } else {
    console.log('ℹ️ Stock admin ya existe');
  }
}

export async function seedAdmin() {
  await seedConfiguraciones();
  await seedTiposInsumo();
  await seedStockAdmin();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('🎉 Seed de admin completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en seed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
