import request from 'supertest';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { crearApp } from '../../app';
import { firmarToken } from '../../utils/jwt';

const productosFindUniqueMock = jest.fn();
const productosUpdateMock = jest.fn();
const comprasCreateMock = jest.fn();
const compraItemsCreateManyMock = jest.fn();
const pagosCreateManyMock = jest.fn();

jest.mock('../../utils/prisma', () => ({
  prisma: {
    usuarios: { findUnique: jest.fn(), update: jest.fn() },
    clientes: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    compras: { findMany: jest.fn(), create: (...args: unknown[]) => comprasCreateMock(...args) },
    compra_items: { createMany: (...args: unknown[]) => compraItemsCreateManyMock(...args) },
    pagos: { createMany: (...args: unknown[]) => pagosCreateManyMock(...args) },
    productos: {
      findMany: jest.fn(),
      findUnique: (...args: unknown[]) => productosFindUniqueMock(...args),
      update: (...args: unknown[]) => productosUpdateMock(...args),
      create: jest.fn(),
      delete: jest.fn()
    },
    stock_movimientos: { create: jest.fn(), findMany: jest.fn() }
  }
}));

describe('Rutas de compras', () => {
  const app = crearApp();
  const tokenEmpleado = firmarToken({ usuario_id: 2, rol: 'EMPLEADO', nombre: 'Empleado' });

  beforeEach(() => {
    productosFindUniqueMock.mockReset();
    productosUpdateMock.mockReset();
    comprasCreateMock.mockReset();
    compraItemsCreateManyMock.mockReset();
    pagosCreateManyMock.mockReset();
  });

  it('crea compra con saldo pendiente y hora_inicio', async () => {
    (productosFindUniqueMock as any).mockResolvedValue({
      id: 1,
      categoria_tipo: 'FERRETERIA',
      precio_sin_iva: '1000',
      precio_con_iva: '1210',
      stock_actual: '10'
    });
    (comprasCreateMock as any).mockResolvedValue({ id: 100 });

    const response = await request(app)
      .post('/api/compras')
      .set('Authorization', `Bearer ${tokenEmpleado}`)
      .send({
        cliente_id: 1,
        precio_modo: 'CON_IVA',
        items: [
          { producto_id: 1, cantidad: 2 }
        ],
        pagos: [
          { medio: 'EFECTIVO', monto: 1000 }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body.saldo_pendiente).toBeGreaterThan(0);
    expect(response.body.hora_inicio).toBeTruthy();
    expect(productosUpdateMock).toHaveBeenCalled();
  });
});
