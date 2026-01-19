// ===========================================
// TRABIX Backend - Prisma Seed
// Según secciones 27.1 y 27.2 del documento
//para resetear bd: npx prisma migrate reset
// ===========================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Crear tipos de insumo obligatorios (sección 27.2)
  console.log('📦 Creando tipos de insumo obligatorios...');
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

  // 2. Crear configuraciones del sistema (sección 27.1)
  console.log('⚙️ Creando configuraciones del sistema...');
  const configuraciones = [
    // PRECIOS
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

    // PORCENTAJES
    { clave: 'APORTE_FONDO', valor: '200', tipo: 'DECIMAL', descripcion: 'Aporte al fondo por TRABIX', categoria: 'PORCENTAJES' },
    { clave: 'PORCENTAJE_VENDEDOR_60_40', valor: '60', tipo: 'PERCENT', descripcion: 'Porcentaje ganancia vendedor 60/40', categoria: 'PORCENTAJES' },
    { clave: 'PORCENTAJE_ADMIN_60_40', valor: '40', tipo: 'PERCENT', descripcion: 'Porcentaje ganancia admin 60/40', categoria: 'PORCENTAJES' },
    { clave: 'PORCENTAJE_VENDEDOR_50_50', valor: '50', tipo: 'PERCENT', descripcion: 'Porcentaje ganancia vendedor 50/50', categoria: 'PORCENTAJES' },
    { clave: 'PORCENTAJE_INVERSION_VENDEDOR', valor: '50', tipo: 'PERCENT', descripcion: 'Porcentaje inversión vendedor', categoria: 'PORCENTAJES' },
    { clave: 'PORCENTAJE_INVERSION_ADMIN', valor: '50', tipo: 'PERCENT', descripcion: 'Porcentaje inversión admin', categoria: 'PORCENTAJES' },
    { clave: 'LIMITE_REGALOS', valor: '8', tipo: 'PERCENT', descripcion: 'Límite de regalos', categoria: 'PORCENTAJES' },
    { clave: 'TRIGGER_CUADRE_T2', valor: '10', tipo: 'PERCENT', descripcion: 'Trigger cuadre T2 (3 tandas)', categoria: 'PORCENTAJES' },
    { clave: 'TRIGGER_CUADRE_T3', valor: '20', tipo: 'PERCENT', descripcion: 'Trigger cuadre T3 (3 tandas)', categoria: 'PORCENTAJES' },
    { clave: 'TRIGGER_CUADRE_T1_2TANDAS', valor: '10', tipo: 'PERCENT', descripcion: 'Trigger cuadre T1 (2 tandas)', categoria: 'PORCENTAJES' },
    { clave: 'TRIGGER_CUADRE_T2_2TANDAS', valor: '20', tipo: 'PERCENT', descripcion: 'Trigger cuadre T2 (2 tandas)', categoria: 'PORCENTAJES' },
    
    // EQUIPAMIENTO
    { clave: 'MENSUALIDAD_CON_DEPOSITO', valor: '9990', tipo: 'DECIMAL', descripcion: 'Mensualidad con depósito', categoria: 'EQUIPAMIENTO' },
    { clave: 'MENSUALIDAD_SIN_DEPOSITO', valor: '19990', tipo: 'DECIMAL', descripcion: 'Mensualidad sin depósito', categoria: 'EQUIPAMIENTO' },
    { clave: 'DEPOSITO_EQUIPAMIENTO', valor: '49990', tipo: 'DECIMAL', descripcion: 'Depósito equipamiento', categoria: 'EQUIPAMIENTO' },
    { clave: 'COSTO_DANO_NEVERA', valor: '30000', tipo: 'DECIMAL', descripcion: 'Costo daño nevera', categoria: 'EQUIPAMIENTO' },
    { clave: 'COSTO_DANO_PIJAMA', valor: '60000', tipo: 'DECIMAL', descripcion: 'Costo daño pijama', categoria: 'EQUIPAMIENTO' },
    
    // TIEMPOS
    { clave: 'TIEMPO_AUTO_TRANSITO_HORAS', valor: '2', tipo: 'INT', descripcion: 'Tiempo auto-tránsito tanda', categoria: 'TIEMPOS' },
  ];

  for (const config of configuraciones) {
    await prisma.configuracionSistema.upsert({
      where: { clave: config.clave },
      update: {},
      create: config,
    });
  }

  // 3. Crear usuario Admin inicial (sección 22.2 - bcrypt 12 rounds)
  console.log('👤 Creando usuario Admin...');
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  
  await prisma.usuario.upsert({
    where: { email: 'admin@trabix.com' },
    update: {},
    create: {
      cedula: '0000000001',
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
    const tiposInsumoObligatorios = [
        { nombre: 'Granizado', esObligatorio: true },
        { nombre: 'Pitillos', esObligatorio: true },
        { nombre: 'Etiquetas', esObligatorio: true },
        { nombre: 'Tablas nutricionales', esObligatorio: true },
        { nombre: 'Envío', esObligatorio: true },
    ];
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
    await seedTiposInsumo();
  // 4. Crear registro de stock admin inicial
  console.log('📊 Creando registro de stock admin...');
  const existingStock = await prisma.stockAdmin.findFirst();
  if (!existingStock) {
    await prisma.stockAdmin.create({
      data: {
        stockFisico: 1000,
      },
    });
  }

  console.log('✅ Seed completado exitosamente');
  console.log('');
  console.log('📝 Usuario Admin creado:');
  console.log('   Email: admin@trabix.com');
  console.log('   Password: Admin123!');
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
