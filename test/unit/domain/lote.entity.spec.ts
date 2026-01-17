import { Decimal } from 'decimal.js';

/**
 * Tests unitarios para LoteEntity
 * Según sección 3 y 4 del documento
 */
describe('LoteEntity - Domain Tests', () => {
  // ==================== DISTRIBUCIÓN DE TANDAS ====================
  
  describe('Distribución de tandas', () => {
    const calcularDistribucion = (cantidadTrabix: number): number[] => {
      if (cantidadTrabix < 6 || cantidadTrabix > 20) {
        throw new Error('Cantidad debe estar entre 6 y 20 TRABIX');
      }
      
      const numTandas = cantidadTrabix <= 10 ? 2 : 3;
      const base = Math.floor(cantidadTrabix / numTandas);
      const resto = cantidadTrabix % numTandas;
      
      const tandas: number[] = [];
      for (let i = 0; i < numTandas; i++) {
        tandas.push(base + (i < resto ? 1 : 0));
      }
      
      return tandas;
    };

    // 2 tandas (6-10 TRABIX)
    it('debe distribuir 6 TRABIX en 2 tandas: [3, 3]', () => {
      expect(calcularDistribucion(6)).toEqual([3, 3]);
    });

    it('debe distribuir 7 TRABIX en 2 tandas: [4, 3]', () => {
      expect(calcularDistribucion(7)).toEqual([4, 3]);
    });

    it('debe distribuir 8 TRABIX en 2 tandas: [4, 4]', () => {
      expect(calcularDistribucion(8)).toEqual([4, 4]);
    });

    it('debe distribuir 9 TRABIX en 2 tandas: [5, 4]', () => {
      expect(calcularDistribucion(9)).toEqual([5, 4]);
    });

    it('debe distribuir 10 TRABIX en 2 tandas: [5, 5]', () => {
      expect(calcularDistribucion(10)).toEqual([5, 5]);
    });

    // 3 tandas (11-20 TRABIX)
    it('debe distribuir 11 TRABIX en 3 tandas: [4, 4, 3]', () => {
      expect(calcularDistribucion(11)).toEqual([4, 4, 3]);
    });

    it('debe distribuir 12 TRABIX en 3 tandas: [4, 4, 4]', () => {
      expect(calcularDistribucion(12)).toEqual([4, 4, 4]);
    });

    it('debe distribuir 15 TRABIX en 3 tandas: [5, 5, 5]', () => {
      expect(calcularDistribucion(15)).toEqual([5, 5, 5]);
    });

    it('debe distribuir 17 TRABIX en 3 tandas: [6, 6, 5]', () => {
      expect(calcularDistribucion(17)).toEqual([6, 6, 5]);
    });

    it('debe distribuir 20 TRABIX en 3 tandas: [7, 7, 6]', () => {
      expect(calcularDistribucion(20)).toEqual([7, 7, 6]);
    });

    // Validaciones
    it('debe rechazar cantidad menor a 6 TRABIX', () => {
      expect(() => calcularDistribucion(5)).toThrow('Cantidad debe estar entre 6 y 20 TRABIX');
    });

    it('debe rechazar cantidad mayor a 20 TRABIX', () => {
      expect(() => calcularDistribucion(21)).toThrow('Cantidad debe estar entre 6 y 20 TRABIX');
    });
  });

  // ==================== CÁLCULO DE INVERSIÓN ====================
  
  describe('Cálculo de inversión', () => {
    const COSTO_PERCIBIDO_POR_TRABIX = new Decimal(2400);
    const PORCENTAJE_VENDEDOR = new Decimal(0.5);
    const PORCENTAJE_ADMIN = new Decimal(0.5);

    const calcularInversion = (cantidadTrabix: number) => {
      const total = COSTO_PERCIBIDO_POR_TRABIX.times(cantidadTrabix);
      const vendedor = total.times(PORCENTAJE_VENDEDOR);
      const admin = total.times(PORCENTAJE_ADMIN);
      
      return {
        total: total.toNumber(),
        vendedor: vendedor.toNumber(),
        admin: admin.toNumber(),
      };
    };

    it('debe calcular inversión para 6 TRABIX', () => {
      const result = calcularInversion(6);
      expect(result.total).toBe(14400);
      expect(result.vendedor).toBe(7200);
      expect(result.admin).toBe(7200);
    });

    it('debe calcular inversión para 10 TRABIX', () => {
      const result = calcularInversion(10);
      expect(result.total).toBe(24000);
      expect(result.vendedor).toBe(12000);
      expect(result.admin).toBe(12000);
    });

    it('debe calcular inversión para 15 TRABIX', () => {
      const result = calcularInversion(15);
      expect(result.total).toBe(36000);
      expect(result.vendedor).toBe(18000);
      expect(result.admin).toBe(18000);
    });

    it('debe calcular inversión para 20 TRABIX', () => {
      const result = calcularInversion(20);
      expect(result.total).toBe(48000);
      expect(result.vendedor).toBe(24000);
      expect(result.admin).toBe(24000);
    });
  });

  // ==================== ESTADOS DE LOTE ====================
  
  describe('Transiciones de estado', () => {
    type EstadoLote = 'PENDIENTE' | 'ACTIVO' | 'FINALIZADO' | 'CANCELADO';
    
    const transicionesValidas: Record<EstadoLote, EstadoLote[]> = {
      PENDIENTE: ['ACTIVO', 'CANCELADO'],
      ACTIVO: ['FINALIZADO'],
      FINALIZADO: [],
      CANCELADO: [],
    };

    const puedeTransicionar = (actual: EstadoLote, nuevo: EstadoLote): boolean => {
      return transicionesValidas[actual].includes(nuevo);
    };

    it('debe permitir PENDIENTE -> ACTIVO', () => {
      expect(puedeTransicionar('PENDIENTE', 'ACTIVO')).toBe(true);
    });

    it('debe permitir PENDIENTE -> CANCELADO', () => {
      expect(puedeTransicionar('PENDIENTE', 'CANCELADO')).toBe(true);
    });

    it('debe permitir ACTIVO -> FINALIZADO', () => {
      expect(puedeTransicionar('ACTIVO', 'FINALIZADO')).toBe(true);
    });

    it('no debe permitir ACTIVO -> PENDIENTE', () => {
      expect(puedeTransicionar('ACTIVO', 'PENDIENTE')).toBe(false);
    });

    it('no debe permitir FINALIZADO -> ningún estado', () => {
      expect(puedeTransicionar('FINALIZADO', 'ACTIVO')).toBe(false);
      expect(puedeTransicionar('FINALIZADO', 'PENDIENTE')).toBe(false);
    });

    it('no debe permitir CANCELADO -> ningún estado', () => {
      expect(puedeTransicionar('CANCELADO', 'ACTIVO')).toBe(false);
      expect(puedeTransicionar('CANCELADO', 'PENDIENTE')).toBe(false);
    });
  });
});
