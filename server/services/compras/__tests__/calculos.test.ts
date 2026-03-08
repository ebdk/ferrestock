import { describe, expect, it } from '@jest/globals';
import { calcularLineaCompra, calcularSaldoPendiente } from '../calculos';

describe('Cálculos de compras', () => {
  it('calcula subtotal de ferreteria por cantidad', () => {
    const linea = calcularLineaCompra({
      categoria_tipo: 'FERRETERIA',
      cantidad: 3,
      precio_unitario: 1000
    });

    expect(linea.subtotal).toBe(3000);
    expect(linea.es_corte).toBe(false);
  });

  it('calcula subtotal de corralon por metro y marca corte', () => {
    const linea = calcularLineaCompra({
      categoria_tipo: 'CORRALON',
      cantidad: 2,
      precio_por_metro: 2000,
      longitud_metros: 4,
      longitud_estandar: 6
    });

    expect(linea.subtotal).toBe(16000);
    expect(linea.es_corte).toBe(true);
    expect(linea.mensaje_corte).toContain('Corte requerido');
  });

  it('calcula saldo pendiente cuando el pago es parcial', () => {
    const saldo = calcularSaldoPendiente({
      total: 50000,
      pagos: [15000, 10000]
    });

    expect(saldo).toBe(25000);
  });
});
