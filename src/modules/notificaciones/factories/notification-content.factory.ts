import { Injectable } from '@nestjs/common';
import { TipoNotificacion } from '@prisma/client';

/**
 * Interface para contenido de notificación
 */
export interface NotificacionContent {
  titulo: string;
  mensaje: string;
  datos?: Record<string, any>;
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
    datos: Record<string, any>,
  ): NotificacionContent {
    switch (tipo) {
      case 'STOCK_BAJO':
        return this.createStockBajo(datos);
      case 'CUADRE_PENDIENTE':
        return this.createCuadrePendiente(datos);
      case 'INVERSION_RECUPERADA':
        return this.createInversionRecuperada(datos);
      case 'CUADRE_EXITOSO':
        return this.createCuadreExitoso(datos);
      case 'TANDA_LIBERADA':
        return this.createTandaLiberada(datos);
      case 'MANUAL':
        return this.createManual(datos);
      default:
        return this.createGeneric(datos);
    }
  }

  private createStockBajo(datos: Record<string, any>): NotificacionContent {
    const porcentaje = datos.porcentaje || 25;
    return {
      titulo: '⚠️ Stock Bajo',
      mensaje: `Tu stock está al ${porcentaje}%. Considera reabastecer pronto.`,
      datos,
    };
  }

  private createCuadrePendiente(datos: Record<string, any>): NotificacionContent {
    const monto = datos.montoEsperado || 0;
    return {
      titulo: '💰 Cuadre Pendiente',
      mensaje: `Tienes un cuadre pendiente por $${monto.toLocaleString()}. Por favor, transfiere el monto.`,
      datos,
    };
  }

  private createInversionRecuperada(datos: Record<string, any>): NotificacionContent {
    return {
      titulo: '🎉 ¡Inversión Recuperada!',
      mensaje: 'Has recuperado tu inversión inicial. A partir de ahora, todo es ganancia.',
      datos,
    };
  }

  private createCuadreExitoso(datos: Record<string, any>): NotificacionContent {
    const monto = datos.montoTransferido || 0;
    return {
      titulo: '✅ Cuadre Exitoso',
      mensaje: `Se ha confirmado la transferencia de $${monto.toLocaleString()}.`,
      datos,
    };
  }

  private createTandaLiberada(datos: Record<string, any>): NotificacionContent {
    const numero = datos.numeroTanda || 0;
    const cantidad = datos.cantidad || 0;
    return {
      titulo: '📦 Tanda Liberada',
      mensaje: `La tanda ${numero} ha sido liberada. ${cantidad} TRABIX están en camino.`,
      datos,
    };
  }

  private createManual(datos: Record<string, any>): NotificacionContent {
    return {
      titulo: datos.titulo || 'Notificación',
      mensaje: datos.mensaje || '',
      datos,
    };
  }

  private createGeneric(datos: Record<string, any>): NotificacionContent {
    return {
      titulo: datos.titulo || 'Notificación',
      mensaje: datos.mensaje || 'Tienes una nueva notificación.',
      datos,
    };
  }
}
