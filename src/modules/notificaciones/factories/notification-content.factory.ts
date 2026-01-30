import { Injectable } from '@nestjs/common';
import { TipoNotificacion } from '@prisma/client';

/**
 * Interface para contenido de notificación
 */
export interface NotificacionContent {
    titulo: string;
    mensaje: string;
    datos?: Record<string, unknown>;
}

/**
 * Datos para notificación de stock bajo
 */
interface StockBajoData {
    porcentaje?: number;
    stockActual?: number;
    [key: string]: unknown;
}

/**
 * Datos para notificación de cuadre pendiente
 */
interface CuadrePendienteData {
    montoEsperado?: number;
    cuadreId?: string;
    [key: string]: unknown;
}

/**
 * Datos para notificación de cuadre exitoso
 */
interface CuadreExitosoData {
    montoTransferido?: number;
    cuadreId?: string;
    [key: string]: unknown;
}

/**
 * Datos para notificación de tanda liberada
 */
interface TandaLiberadaData {
    numeroTanda?: number;
    cantidad?: number;
    loteId?: string;
    [key: string]: unknown;
}

/**
 * Datos para notificación manual
 */
interface ManualData {
    titulo?: string;
    mensaje?: string;
    [key: string]: unknown;
}

/**
 * Datos para notificación de premio recibido
 */
interface PremioRecibidoData {
    monto?: number;
    motivo?: string;
    [key: string]: unknown;
}

/**
 * Factory para crear contenido de notificaciones
 * Según Factory Pattern del documento
 *
 * Cada tipo de notificación tiene su propio formato de contenido
 */
@Injectable()
export class NotificationContentFactory {
    /**
     * Crea el contenido de una notificación según su tipo
     */
    create(
        tipo: TipoNotificacion,
        datos: Record<string, unknown>,
    ): NotificacionContent {
        switch (tipo) {
            case 'STOCK_BAJO':
                return this.createStockBajo(datos as StockBajoData);
            case 'CUADRE_PENDIENTE':
                return this.createCuadrePendiente(datos as CuadrePendienteData);
            case 'INVERSION_RECUPERADA':
                return this.createInversionRecuperada(datos);
            case 'CUADRE_EXITOSO':
                return this.createCuadreExitoso(datos as CuadreExitosoData);
            case 'TANDA_LIBERADA':
                return this.createTandaLiberada(datos as TandaLiberadaData);
            case 'PREMIO_RECIBIDO':
                return this.createPremioRecibido(datos as PremioRecibidoData);
            case 'MANUAL':
                return this.createManual(datos as ManualData);
            default:
                return this.createGeneric(datos as ManualData);
        }
    }

    private createStockBajo(datos: StockBajoData): NotificacionContent {
        const porcentaje = datos.porcentaje ?? 25;
        return {
            titulo: '⚠️ Stock Bajo',
            mensaje: `Tu stock está al ${porcentaje}%. Considera reabastecer pronto.`,
            datos,
        };
    }

    private createCuadrePendiente(datos: CuadrePendienteData): NotificacionContent {
        const monto = datos.montoEsperado ?? 0;
        return {
            titulo: '💰 Cuadre Pendiente',
            mensaje: `Tienes un cuadre pendiente por $${monto.toLocaleString('es-CO')}. Por favor, transfiere el monto.`,
            datos,
        };
    }

    private createInversionRecuperada(datos: Record<string, unknown>): NotificacionContent {
        return {
            titulo: '🎉 ¡Inversión Recuperada!',
            mensaje: 'Has recuperado tu inversión inicial. A partir de ahora, todo es ganancia.',
            datos,
        };
    }

    private createCuadreExitoso(datos: CuadreExitosoData): NotificacionContent {
        const monto = datos.montoTransferido ?? 0;
        return {
            titulo: '✅ Cuadre Exitoso',
            mensaje: `Se ha confirmado la transferencia de $${monto.toLocaleString('es-CO')}.`,
            datos,
        };
    }

    private createTandaLiberada(datos: TandaLiberadaData): NotificacionContent {
        const numero = datos.numeroTanda ?? 0;
        const cantidad = datos.cantidad ?? 0;
        return {
            titulo: '📦 Tanda Liberada',
            mensaje: `La tanda ${numero} ha sido liberada. ${cantidad} TRABIX están en camino.`,
            datos,
        };
    }

    private createPremioRecibido(datos: PremioRecibidoData): NotificacionContent {
        const monto = datos.monto ?? 0;
        const motivo = datos.motivo ?? 'premio del fondo de recompensas';
        return {
            titulo: '🏆 ¡Premio Recibido!',
            mensaje: `Has recibido un premio de $${monto.toLocaleString('es-CO')} por ${motivo}.`,
            datos,
        };
    }

    private createManual(datos: ManualData): NotificacionContent {
        return {
            titulo: datos.titulo ?? 'Notificación',
            mensaje: datos.mensaje ?? '',
            datos,
        };
    }

    private createGeneric(datos: ManualData): NotificacionContent {
        return {
            titulo: datos.titulo ?? 'Notificación',
            mensaje: datos.mensaje ?? 'Tienes una nueva notificación.',
            datos,
        };
    }
}