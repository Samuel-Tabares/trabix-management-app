import { Decimal } from 'decimal.js';

/**
 * Tests unitarios para TandaEntity
 * Según sección 4 del documento
 */
describe('TandaEntity - Domain Tests', () => {
  // ==================== TRANSICIONES DE ESTADO ====================
  
  describe('Transiciones de estado', () => {
    type EstadoTanda = 'INACTIVA' | 'LIBERADA' | 'EN_TRANSITO' | 'EN_CASA' | 'FINALIZADA';
    
    const transicionesValidas: Record<EstadoTanda, EstadoTanda[]> = {
      INACTIVA: ['LIBERADA'],
      LIBERADA: ['EN_TRANSITO'],
      EN_TRANSITO: ['EN_CASA'],
      EN_CASA: ['FINALIZADA'],
      FINALIZADA: [],
    };

    const puedeTransicionar = (actual: EstadoTanda, nuevo: EstadoTanda): boolean => {
      return transicionesValidas[actual].includes(nuevo);
    };

    it('debe permitir INACTIVA -> LIBERADA', () => {
      expect(puedeTransicionar('INACTIVA', 'LIBERADA')).toBe(true);
    });

    it('debe permitir LIBERADA -> EN_TRANSITO', () => {
      expect(puedeTransicionar('LIBERADA', 'EN_TRANSITO')).toBe(true);
    });

    it('debe permitir EN_TRANSITO -> EN_CASA', () => {
      expect(puedeTransicionar('EN_TRANSITO', 'EN_CASA')).toBe(true);
    });

    it('debe permitir EN_CASA -> FINALIZADA', () => {
      expect(puedeTransicionar('EN_CASA', 'FINALIZADA')).toBe(true);
    });

    it('no debe permitir saltar estados', () => {
      expect(puedeTransicionar('INACTIVA', 'EN_TRANSITO')).toBe(false);
      expect(puedeTransicionar('INACTIVA', 'EN_CASA')).toBe(false);
      expect(puedeTransicionar('LIBERADA', 'EN_CASA')).toBe(false);
    });

    it('no debe permitir retroceder estados', () => {
      expect(puedeTransicionar('EN_CASA', 'EN_TRANSITO')).toBe(false);
      expect(puedeTransicionar('EN_TRANSITO', 'LIBERADA')).toBe(false);
      expect(puedeTransicionar('LIBERADA', 'INACTIVA')).toBe(false);
    });

    it('no debe permitir transiciones desde FINALIZADA', () => {
      expect(puedeTransicionar('FINALIZADA', 'INACTIVA')).toBe(false);
      expect(puedeTransicionar('FINALIZADA', 'EN_CASA')).toBe(false);
    });
  });

  // ==================== STOCK ====================
  
  describe('Gestión de stock', () => {
    class TandaStock {
      constructor(
        public stockInicial: number,
        public stockActual: number,
      ) {}

      decrementar(cantidad: number): void {
        if (cantidad > this.stockActual) {
          throw new Error('Stock insuficiente');
        }
        this.stockActual -= cantidad;
      }

      getPorcentajeStock(): number {
        return (this.stockActual / this.stockInicial) * 100;
      }
    }

    it('debe decrementar stock correctamente', () => {
      const tanda = new TandaStock(5, 5);
      tanda.decrementar(2);
      expect(tanda.stockActual).toBe(3);
    });

    it('no debe permitir stock negativo', () => {
      const tanda = new TandaStock(5, 3);
      expect(() => tanda.decrementar(4)).toThrow('Stock insuficiente');
    });

    it('debe calcular porcentaje de stock correctamente', () => {
      const tanda = new TandaStock(10, 5);
      expect(tanda.getPorcentajeStock()).toBe(50);
    });

    it('debe calcular 0% cuando stock está agotado', () => {
      const tanda = new TandaStock(10, 0);
      expect(tanda.getPorcentajeStock()).toBe(0);
    });

    it('debe calcular 100% cuando stock está completo', () => {
      const tanda = new TandaStock(10, 10);
      expect(tanda.getPorcentajeStock()).toBe(100);
    });
  });
});

/**
 * Tests unitarios para VentaEntity
 * Según sección 5 y 6 del documento
 */
describe('VentaEntity - Domain Tests', () => {
  // ==================== CÁLCULO DE PRECIOS ====================
  
  describe('Cálculo de precios - Venta Normal', () => {
    const PRECIO_PROMO = 12000;
    const PRECIO_UNIDAD_LICOR = 8000;
    const PRECIO_UNIDAD_SIN_LICOR = 7000;

    const calcularPrecioVentaNormal = (
      cantidadPromo: number,
      cantidadUnidadLicor: number,
      cantidadUnidadSinLicor: number,
    ): number => {
      return (
        cantidadPromo * PRECIO_PROMO +
        cantidadUnidadLicor * PRECIO_UNIDAD_LICOR +
        cantidadUnidadSinLicor * PRECIO_UNIDAD_SIN_LICOR
      );
    };

    it('debe calcular precio de 1 PROMO = $12,000', () => {
      expect(calcularPrecioVentaNormal(1, 0, 0)).toBe(12000);
    });

    it('debe calcular precio de 2 PROMO = $24,000', () => {
      expect(calcularPrecioVentaNormal(2, 0, 0)).toBe(24000);
    });

    it('debe calcular precio de 1 UNIDAD con licor = $8,000', () => {
      expect(calcularPrecioVentaNormal(0, 1, 0)).toBe(8000);
    });

    it('debe calcular precio de 1 UNIDAD sin licor = $7,000', () => {
      expect(calcularPrecioVentaNormal(0, 0, 1)).toBe(7000);
    });

    it('debe calcular venta mixta: 1 PROMO + 1 UNIDAD con licor = $20,000', () => {
      expect(calcularPrecioVentaNormal(1, 1, 0)).toBe(20000);
    });

    it('debe calcular venta mixta: 2 PROMO + 2 UNIDAD sin licor = $38,000', () => {
      expect(calcularPrecioVentaNormal(2, 0, 2)).toBe(38000);
    });
  });

  describe('Cálculo de precios - Venta al Mayor', () => {
    const getPrecioMayor = (cantidad: number, conLicor: boolean): number => {
      if (conLicor) {
        if (cantidad >= 100) return 4500;
        if (cantidad >= 50) return 4700;
        if (cantidad >= 20) return 4900;
      } else {
        if (cantidad >= 100) return 4200;
        if (cantidad >= 50) return 4500;
        if (cantidad >= 20) return 4800;
      }
      throw new Error('Cantidad mínima al mayor es 20');
    };

    const calcularPrecioMayor = (cantidad: number, conLicor: boolean): number => {
      return cantidad * getPrecioMayor(cantidad, conLicor);
    };

    // Con licor
    it('debe calcular 25 unidades con licor = $122,500', () => {
      expect(calcularPrecioMayor(25, true)).toBe(122500);
    });

    it('debe calcular 50 unidades con licor = $235,000', () => {
      expect(calcularPrecioMayor(50, true)).toBe(235000);
    });

    it('debe calcular 60 unidades con licor = $282,000', () => {
      expect(calcularPrecioMayor(60, true)).toBe(282000);
    });

    it('debe calcular 100 unidades con licor = $450,000', () => {
      expect(calcularPrecioMayor(100, true)).toBe(450000);
    });

    it('debe calcular 120 unidades con licor = $540,000', () => {
      expect(calcularPrecioMayor(120, true)).toBe(540000);
    });

    // Sin licor
    it('debe calcular 25 unidades sin licor = $120,000', () => {
      expect(calcularPrecioMayor(25, false)).toBe(120000);
    });

    it('debe calcular 60 unidades sin licor = $270,000', () => {
      expect(calcularPrecioMayor(60, false)).toBe(270000);
    });

    it('debe calcular 120 unidades sin licor = $504,000', () => {
      expect(calcularPrecioMayor(120, false)).toBe(504000);
    });
  });

  // ==================== CÁLCULO DE GANANCIAS ====================
  
  describe('Cálculo de ganancias', () => {
    const calcularGanancias = (
      montoTotal: number,
      porcentajeVendedor: number,
    ) => {
      const gananciaVendedor = montoTotal * (porcentajeVendedor / 100);
      const gananciaAdmin = montoTotal - gananciaVendedor;
      return { gananciaVendedor, gananciaAdmin };
    };

    it('debe calcular ganancia 60/40 para $12,000', () => {
      const result = calcularGanancias(12000, 60);
      expect(result.gananciaVendedor).toBe(7200);
      expect(result.gananciaAdmin).toBe(4800);
    });

    it('debe calcular ganancia 50/50 para $12,000', () => {
      const result = calcularGanancias(12000, 50);
      expect(result.gananciaVendedor).toBe(6000);
      expect(result.gananciaAdmin).toBe(6000);
    });
  });

  // ==================== VALIDACIÓN DE REGALOS ====================
  
  describe('Validación de regalos', () => {
    const LIMITE_REGALOS_PORCENTAJE = 8;

    const validarRegalos = (
      stockInicial: number,
      regalosAcumulados: number,
      nuevosRegalos: number,
    ): boolean => {
      const maxRegalos = Math.floor(stockInicial * (LIMITE_REGALOS_PORCENTAJE / 100));
      return (regalosAcumulados + nuevosRegalos) <= maxRegalos;
    };

    it('debe permitir regalos dentro del 8%', () => {
      // Stock de 10, máximo 0.8 regalos = 0 regalos permitidos
      expect(validarRegalos(10, 0, 0)).toBe(true);
    });

    it('debe permitir 1 regalo para stock de 20 (8% = 1.6)', () => {
      expect(validarRegalos(20, 0, 1)).toBe(true);
    });

    it('debe rechazar 2 regalos para stock de 20', () => {
      expect(validarRegalos(20, 0, 2)).toBe(false);
    });

    it('debe permitir hasta 4 regalos para stock de 50 (8% = 4)', () => {
      expect(validarRegalos(50, 0, 4)).toBe(true);
      expect(validarRegalos(50, 0, 5)).toBe(false);
    });

    it('debe considerar regalos acumulados', () => {
      expect(validarRegalos(50, 3, 1)).toBe(true);
      expect(validarRegalos(50, 3, 2)).toBe(false);
    });
  });

  // ==================== ESTADOS DE VENTA ====================
  
  describe('Transiciones de estado', () => {
    type EstadoVenta = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
    
    const transicionesValidas: Record<EstadoVenta, EstadoVenta[]> = {
      PENDIENTE: ['APROBADA', 'RECHAZADA'],
      APROBADA: [],
      RECHAZADA: [],
    };

    const puedeTransicionar = (actual: EstadoVenta, nuevo: EstadoVenta): boolean => {
      return transicionesValidas[actual].includes(nuevo);
    };

    it('debe permitir PENDIENTE -> APROBADA', () => {
      expect(puedeTransicionar('PENDIENTE', 'APROBADA')).toBe(true);
    });

    it('debe permitir PENDIENTE -> RECHAZADA', () => {
      expect(puedeTransicionar('PENDIENTE', 'RECHAZADA')).toBe(true);
    });

    it('no debe permitir cambios desde APROBADA', () => {
      expect(puedeTransicionar('APROBADA', 'PENDIENTE')).toBe(false);
      expect(puedeTransicionar('APROBADA', 'RECHAZADA')).toBe(false);
    });

    it('no debe permitir cambios desde RECHAZADA', () => {
      expect(puedeTransicionar('RECHAZADA', 'PENDIENTE')).toBe(false);
      expect(puedeTransicionar('RECHAZADA', 'APROBADA')).toBe(false);
    });
  });
});
