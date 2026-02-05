-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'VENDEDOR', 'RECLUTADOR');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoLote" AS ENUM ('CREADO', 'ACTIVO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "ModeloNegocio" AS ENUM ('MODELO_60_40', 'MODELO_50_50');

-- CreateEnum
CREATE TYPE "EstadoTanda" AS ENUM ('INACTIVA', 'LIBERADA', 'EN_TRANSITO', 'EN_CASA', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "TipoVenta" AS ENUM ('PROMO', 'UNIDAD', 'SIN_LICOR', 'REGALO');

-- CreateEnum
CREATE TYPE "EstadoVentaMayor" AS ENUM ('PENDIENTE', 'COMPLETADA');

-- CreateEnum
CREATE TYPE "ModalidadVentaMayor" AS ENUM ('ANTICIPADO', 'CONTRAENTREGA');

-- CreateEnum
CREATE TYPE "EstadoCuadre" AS ENUM ('INACTIVO', 'PENDIENTE', 'EXITOSO');

-- CreateEnum
CREATE TYPE "ConceptoCuadre" AS ENUM ('INVERSION_ADMIN', 'GANANCIAS', 'MIXTO');

-- CreateEnum
CREATE TYPE "EstadoMiniCuadre" AS ENUM ('INACTIVO', 'PENDIENTE', 'EXITOSO');

-- CreateEnum
CREATE TYPE "EstadoEquipamiento" AS ENUM ('SOLICITADO', 'ACTIVO', 'DEVUELTO', 'DANADO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "TipoTransaccionFondo" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('STOCK_BAJO', 'CUADRE_PENDIENTE', 'INVERSION_RECUPERADA', 'CUADRE_EXITOSO', 'TANDA_LIBERADA', 'MANUAL', 'PREMIO_RECIBIDO');

-- CreateEnum
CREATE TYPE "CanalNotificacion" AS ENUM ('WEBSOCKET', 'PUSH', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "EstadoPedidoStock" AS ENUM ('BORRADOR', 'CONFIRMADO', 'RECIBIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "cedula" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "requiereCambioPassword" BOOLEAN NOT NULL DEFAULT true,
    "rol" "Rol" NOT NULL DEFAULT 'VENDEDOR',
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "reclutadorId" TEXT,
    "refreshTokenHash" TEXT,
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" TIMESTAMP(3),
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoLogin" TIMESTAMP(3),
    "fechaCambioEstado" TIMESTAMP(3),
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "fechaEliminacion" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "cantidadTrabix" INTEGER NOT NULL,
    "modeloNegocio" "ModeloNegocio" NOT NULL,
    "estado" "EstadoLote" NOT NULL DEFAULT 'CREADO',
    "inversionTotal" DECIMAL(12,2) NOT NULL,
    "inversionAdmin" DECIMAL(12,2) NOT NULL,
    "inversionVendedor" DECIMAL(12,2) NOT NULL,
    "dineroRecaudado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "dineroTransferido" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "esLoteForzado" BOOLEAN NOT NULL DEFAULT false,
    "ventaMayorOrigenId" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActivacion" TIMESTAMP(3),
    "fechaFinalizacion" TIMESTAMP(3),

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tandas" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "numero" INTEGER NOT NULL,
    "estado" "EstadoTanda" NOT NULL DEFAULT 'INACTIVA',
    "stockInicial" INTEGER NOT NULL,
    "stockActual" INTEGER NOT NULL,
    "stockConsumidoPorMayor" INTEGER NOT NULL DEFAULT 0,
    "liberadaPorCuadreMayorId" TEXT,
    "fechaLiberacion" TIMESTAMP(3),
    "fechaEnTransito" TIMESTAMP(3),
    "fechaEnCasa" TIMESTAMP(3),
    "fechaFinalizada" TIMESTAMP(3),

    CONSTRAINT "tandas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "tandaId" TEXT NOT NULL,
    "estado" "EstadoVenta" NOT NULL DEFAULT 'PENDIENTE',
    "montoTotal" DECIMAL(12,2) NOT NULL,
    "cantidadTrabix" INTEGER NOT NULL,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaValidacion" TIMESTAMP(3),

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_venta" (
    "id" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "tipo" "TipoVenta" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "detalles_venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_mayor" (
    "id" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "cantidadUnidades" INTEGER NOT NULL,
    "precioUnidad" DECIMAL(12,2) NOT NULL,
    "ingresoBruto" DECIMAL(12,2) NOT NULL,
    "conLicor" BOOLEAN NOT NULL DEFAULT true,
    "modalidad" "ModalidadVentaMayor" NOT NULL,
    "estado" "EstadoVentaMayor" NOT NULL DEFAULT 'PENDIENTE',
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCompletada" TIMESTAMP(3),

    CONSTRAINT "ventas_mayor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuentes_stock_mayor" (
    "id" TEXT NOT NULL,
    "ventaMayorId" TEXT NOT NULL,
    "tandaId" TEXT NOT NULL,
    "cantidadConsumida" INTEGER NOT NULL,
    "tipoStock" TEXT NOT NULL,

    CONSTRAINT "fuentes_stock_mayor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes_venta_mayor" (
    "id" TEXT NOT NULL,
    "ventaMayorId" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,

    CONSTRAINT "lotes_venta_mayor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuadres" (
    "id" TEXT NOT NULL,
    "tandaId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoCuadre" NOT NULL DEFAULT 'INACTIVO',
    "concepto" "ConceptoCuadre" NOT NULL,
    "montoEsperado" DECIMAL(12,2) NOT NULL,
    "montoRecibido" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "montoFaltante" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "montoCubiertoPorMayor" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cerradoPorCuadreMayorId" TEXT,
    "fechaPendiente" TIMESTAMP(3),
    "fechaExitoso" TIMESTAMP(3),

    CONSTRAINT "cuadres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuadres_mayor" (
    "id" TEXT NOT NULL,
    "ventaMayorId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "modalidad" "ModalidadVentaMayor" NOT NULL,
    "estado" "EstadoCuadre" NOT NULL DEFAULT 'PENDIENTE',
    "cantidadUnidades" INTEGER NOT NULL,
    "precioUnidad" DECIMAL(12,2) NOT NULL,
    "ingresoBruto" DECIMAL(12,2) NOT NULL,
    "deudasSaldadas" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "inversionAdminLotesExistentes" DECIMAL(12,2) NOT NULL,
    "inversionAdminLoteForzado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "inversionVendedorLotesExistentes" DECIMAL(12,2) NOT NULL,
    "inversionVendedorLoteForzado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gananciasAdmin" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gananciasVendedor" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "evaluacionFinanciera" JSONB NOT NULL,
    "montoTotalAdmin" DECIMAL(12,2) NOT NULL,
    "montoTotalVendedor" DECIMAL(12,2) NOT NULL,
    "lotesInvolucradosIds" TEXT[],
    "tandasAfectadas" JSONB NOT NULL,
    "cuadresCerradosIds" TEXT[],
    "loteForzadoId" TEXT,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaExitoso" TIMESTAMP(3),

    CONSTRAINT "cuadres_mayor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mini_cuadres" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "tandaId" TEXT NOT NULL,
    "estado" "EstadoMiniCuadre" NOT NULL DEFAULT 'INACTIVO',
    "montoFinal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fechaPendiente" TIMESTAMP(3),
    "fechaExitoso" TIMESTAMP(3),

    CONSTRAINT "mini_cuadres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamientos" (
    "id" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "estado" "EstadoEquipamiento" NOT NULL DEFAULT 'SOLICITADO',
    "tieneDeposito" BOOLEAN NOT NULL DEFAULT false,
    "depositoPagado" DECIMAL(12,2),
    "mensualidadActual" DECIMAL(12,2) NOT NULL,
    "ultimaMensualidadPagada" TIMESTAMP(3),
    "deudaDano" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deudaPerdida" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEntrega" TIMESTAMP(3),
    "fechaDevolucion" TIMESTAMP(3),
    "depositoDevuelto" BOOLEAN NOT NULL DEFAULT false,
    "fechaDevolucionDeposito" TIMESTAMP(3),

    CONSTRAINT "equipamientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_stock" (
    "id" TEXT NOT NULL,
    "cantidadTrabix" INTEGER NOT NULL,
    "estado" "EstadoPedidoStock" NOT NULL DEFAULT 'BORRADOR',
    "costoTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costoRealPorTrabix" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRecepcion" TIMESTAMP(3),
    "fechaCancelacion" TIMESTAMP(3),
    "motivoCancelacion" TEXT,
    "notas" TEXT,

    CONSTRAINT "pedidos_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_costo_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "esObligatorio" BOOLEAN NOT NULL DEFAULT false,
    "cantidad" INTEGER,
    "costoTotal" DECIMAL(12,2) NOT NULL,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalles_costo_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_insumo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "esObligatorio" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipos_insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuraciones_sistema" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "modificable" BOOLEAN NOT NULL DEFAULT true,
    "ultimaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoPorId" TEXT,

    CONSTRAINT "configuraciones_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_configuraciones" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valorAnterior" TEXT NOT NULL,
    "valorNuevo" TEXT NOT NULL,
    "modificadoPorId" TEXT NOT NULL,
    "motivo" TEXT,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_configuraciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_admin" (
    "id" TEXT NOT NULL,
    "stockFisico" INTEGER NOT NULL DEFAULT 0,
    "ultimoPedidoId" TEXT,
    "ultimaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacciones_fondo" (
    "id" TEXT NOT NULL,
    "tipo" "TipoTransaccionFondo" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "motivo" TEXT,
    "loteOrigenId" TEXT,
    "fechaTransaccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transacciones_fondo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "datos" JSONB,
    "canal" "CanalNotificacion" NOT NULL DEFAULT 'WEBSOCKET',
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaLeida" TIMESTAMP(3),

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "datosAnteriores" JSONB,
    "datosNuevos" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ganancias_reclutadores" (
    "id" TEXT NOT NULL,
    "cuadreMayorId" TEXT NOT NULL,
    "reclutadorId" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "transferido" BOOLEAN NOT NULL DEFAULT false,
    "fechaTransferencia" TIMESTAMP(3),

    CONSTRAINT "ganancias_reclutadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_store" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "occurredOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "retries" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_blacklist" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_fondo" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "concepto" TEXT NOT NULL,
    "loteId" TEXT,
    "vendedorBeneficiarioId" TEXT,
    "fechaTransaccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_fondo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cedula_key" ON "usuarios"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_telefono_key" ON "usuarios"("telefono");

-- CreateIndex
CREATE INDEX "lotes_vendedorId_estado_idx" ON "lotes"("vendedorId", "estado");

-- CreateIndex
CREATE INDEX "lotes_estado_fechaCreacion_idx" ON "lotes"("estado", "fechaCreacion");

-- CreateIndex
CREATE INDEX "tandas_loteId_estado_idx" ON "tandas"("loteId", "estado");

-- CreateIndex
CREATE INDEX "tandas_estado_idx" ON "tandas"("estado");

-- CreateIndex
CREATE INDEX "ventas_vendedorId_estado_idx" ON "ventas"("vendedorId", "estado");

-- CreateIndex
CREATE INDEX "ventas_loteId_tandaId_idx" ON "ventas"("loteId", "tandaId");

-- CreateIndex
CREATE INDEX "ventas_fechaRegistro_idx" ON "ventas"("fechaRegistro");

-- CreateIndex
CREATE UNIQUE INDEX "cuadres_tandaId_key" ON "cuadres"("tandaId");

-- CreateIndex
CREATE INDEX "cuadres_estado_idx" ON "cuadres"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "cuadres_mayor_ventaMayorId_key" ON "cuadres_mayor"("ventaMayorId");

-- CreateIndex
CREATE INDEX "cuadres_mayor_estado_idx" ON "cuadres_mayor"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "mini_cuadres_loteId_key" ON "mini_cuadres"("loteId");

-- CreateIndex
CREATE UNIQUE INDEX "equipamientos_vendedorId_key" ON "equipamientos"("vendedorId");

-- CreateIndex
CREATE INDEX "pedidos_stock_estado_idx" ON "pedidos_stock"("estado");

-- CreateIndex
CREATE INDEX "pedidos_stock_fechaCreacion_idx" ON "pedidos_stock"("fechaCreacion");

-- CreateIndex
CREATE INDEX "detalles_costo_pedido_pedidoId_idx" ON "detalles_costo_pedido"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_insumo_nombre_key" ON "tipos_insumo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_sistema_clave_key" ON "configuraciones_sistema"("clave");

-- CreateIndex
CREATE INDEX "configuraciones_sistema_categoria_idx" ON "configuraciones_sistema"("categoria");

-- CreateIndex
CREATE INDEX "configuraciones_sistema_clave_idx" ON "configuraciones_sistema"("clave");

-- CreateIndex
CREATE INDEX "historial_configuraciones_clave_idx" ON "historial_configuraciones"("clave");

-- CreateIndex
CREATE INDEX "historial_configuraciones_fechaCambio_idx" ON "historial_configuraciones"("fechaCambio");

-- CreateIndex
CREATE INDEX "ganancias_reclutadores_cuadreMayorId_idx" ON "ganancias_reclutadores"("cuadreMayorId");

-- CreateIndex
CREATE INDEX "ganancias_reclutadores_reclutadorId_idx" ON "ganancias_reclutadores"("reclutadorId");

-- CreateIndex
CREATE INDEX "event_store_aggregateType_aggregateId_idx" ON "event_store"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "event_store_eventName_occurredOn_idx" ON "event_store"("eventName", "occurredOn");

-- CreateIndex
CREATE INDEX "outbox_processedAt_createdAt_idx" ON "outbox"("processedAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "token_blacklist_tokenId_key" ON "token_blacklist"("tokenId");

-- CreateIndex
CREATE INDEX "token_blacklist_expiresAt_idx" ON "token_blacklist"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");

-- CreateIndex
CREATE INDEX "idempotency_keys_expiresAt_idx" ON "idempotency_keys"("expiresAt");

-- CreateIndex
CREATE INDEX "movimientos_fondo_tipo_fechaTransaccion_idx" ON "movimientos_fondo"("tipo", "fechaTransaccion");

-- CreateIndex
CREATE INDEX "movimientos_fondo_vendedorBeneficiarioId_idx" ON "movimientos_fondo"("vendedorBeneficiarioId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_reclutadorId_fkey" FOREIGN KEY ("reclutadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_ventaMayorOrigenId_fkey" FOREIGN KEY ("ventaMayorOrigenId") REFERENCES "ventas_mayor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tandas" ADD CONSTRAINT "tandas_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_tandaId_fkey" FOREIGN KEY ("tandaId") REFERENCES "tandas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_venta" ADD CONSTRAINT "detalles_venta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_mayor" ADD CONSTRAINT "ventas_mayor_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuentes_stock_mayor" ADD CONSTRAINT "fuentes_stock_mayor_ventaMayorId_fkey" FOREIGN KEY ("ventaMayorId") REFERENCES "ventas_mayor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_venta_mayor" ADD CONSTRAINT "lotes_venta_mayor_ventaMayorId_fkey" FOREIGN KEY ("ventaMayorId") REFERENCES "ventas_mayor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuadres" ADD CONSTRAINT "cuadres_tandaId_fkey" FOREIGN KEY ("tandaId") REFERENCES "tandas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuadres_mayor" ADD CONSTRAINT "cuadres_mayor_ventaMayorId_fkey" FOREIGN KEY ("ventaMayorId") REFERENCES "ventas_mayor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mini_cuadres" ADD CONSTRAINT "mini_cuadres_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamientos" ADD CONSTRAINT "equipamientos_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_costo_pedido" ADD CONSTRAINT "detalles_costo_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos_stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_configuraciones" ADD CONSTRAINT "historial_configuraciones_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ganancias_reclutadores" ADD CONSTRAINT "ganancias_reclutadores_cuadreMayorId_fkey" FOREIGN KEY ("cuadreMayorId") REFERENCES "cuadres_mayor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
