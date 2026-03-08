import request from 'supertest';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { crearApp } from '../../app';
import { firmarToken } from '../../utils/jwt';

const productosFindManyMock = jest.fn();
const productosFindUniqueMock = jest.fn();
const productosUpdateMock = jest.fn();
const stockCreateMock = jest.fn();
const stockFindManyMock = jest.fn();

jest.mock('../../utils/prisma', () => ({
  prisma: {
    usuarios: { findUnique: jest.fn(), update: jest.fn() },
    clientes: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    compras: { findMany: jest.fn() },
    productos: {
      findMany: (...args: unknown[]) => productosFindManyMock(...args),
      findUnique: (...args: unknown[]) => productosFindUniqueMock(...args),
      update: (...args: unknown[]) => productosUpdateMock(...args),
      create: jest.fn(),
      delete: jest.fn()
    },
    stock_movimientos: {
      create: (...args: unknown[]) => stockCreateMock(...args),
      findMany: (...args: unknown[]) => stockFindManyMock(...args)
    }
  }
}));

describe('Rutas de stock', () => {
  const app = crearApp();
  const tokenEmpleado = firmarToken({ usuario_id: 2, rol: 'EMPLEADO', nombre: 'Empleado' });

  beforeEach(() => {
    productosFindManyMock.mockReset();
    productosFindUniqueMock.mockReset();
    productosUpdateMock.mockReset();
    stockCreateMock.mockReset();
    stockFindManyMock.mockReset();
  });

  it('lista inventario actual', async () => {
    (productosFindManyMock as any).mockResolvedValueOnce([{ id: 1, nombre: 'Prod', stock_actual: '10' }]);

    const response = await request(app)
      .get('/api/stock/inventario')
      .set('Authorization', `Bearer ${tokenEmpleado}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it('rechaza ajuste sin motivo', async () => {
    const response = await request(app)
      .post('/api/stock/ajuste')
      .set('Authorization', `Bearer ${tokenEmpleado}`)
      .send({ producto_id: 1, cantidad: -2, motivo: '' });

    expect(response.status).toBe(400);
    expect(response.body.mensaje).toBe('El motivo es obligatorio.');
  });

  it('aplica ajuste y registra movimiento', async () => {
    (productosFindUniqueMock as any).mockResolvedValueOnce({ id: 1, stock_actual: '10' });
    (productosUpdateMock as any).mockResolvedValueOnce({ id: 1, stock_actual: '8' });
    (stockCreateMock as any).mockResolvedValueOnce({ id: 1 });

    const response = await request(app)
      .post('/api/stock/ajuste')
      .set('Authorization', `Bearer ${tokenEmpleado}`)
      .send({ producto_id: 1, cantidad: -2, motivo: 'Merma' });

    expect(response.status).toBe(200);
    expect(productosUpdateMock).toHaveBeenCalled();
    expect(stockCreateMock).toHaveBeenCalled();
  });

  it('exporta inventario en csv', async () => {
    (productosFindManyMock as any).mockResolvedValueOnce([
      { id: 1, nombre: 'Prod', codigo: 'P-1', stock_actual: '10', stock_minimo: '2' }
    ]);

    const response = await request(app)
      .get('/api/stock/exportar.csv')
      .set('Authorization', `Bearer ${tokenEmpleado}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('nombre,codigo,stock_actual,stock_minimo');
    expect(response.text).toContain('Prod,P-1,10,2');
  });
});
