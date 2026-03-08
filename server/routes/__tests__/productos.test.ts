import request from 'supertest';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { crearApp } from '../../app';
import { firmarToken } from '../../utils/jwt';

const findManyMock = jest.fn();
const createMock = jest.fn();
const updateMock = jest.fn();
const deleteMock = jest.fn();

jest.mock('../../utils/prisma', () => ({
  prisma: {
    usuarios: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    clientes: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    compras: {
      findMany: jest.fn()
    },
    productos: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      create: (...args: unknown[]) => createMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
      delete: (...args: unknown[]) => deleteMock(...args)
    }
  }
}));

describe('Rutas de productos', () => {
  const app = crearApp();
  const tokenAdmin = firmarToken({ usuario_id: 1, rol: 'ADMIN', nombre: 'Admin' });
  const tokenEmpleado = firmarToken({ usuario_id: 2, rol: 'EMPLEADO', nombre: 'Empleado' });

  beforeEach(() => {
    findManyMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
  });

  it('lista productos para empleado', async () => {
    (findManyMock as any).mockResolvedValueOnce([{ id: 1, nombre: 'Planchuela 3/4"' }]);

    const response = await request(app)
      .get('/api/productos?busqueda=planchuela')
      .set('Authorization', `Bearer ${tokenEmpleado}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array)
        })
      })
    );
  });

  it('filtra productos por categoría cuando se envía query categoria', async () => {
    (findManyMock as any).mockResolvedValueOnce([]);

    const response = await request(app)
      .get('/api/productos?categoria=CORRALON')
      .set('Authorization', `Bearer ${tokenEmpleado}`);

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          categoria_tipo: 'CORRALON'
        })
      })
    );
  });

  it('crea producto solo para admin', async () => {
    const payload = {
      nombre: 'Electrodo 6013',
      codigo: 'EL-6013',
      categoria_tipo: 'FERRETERIA',
      unidad_venta: 'caja',
      precio_sin_iva: 1000,
      precio_con_iva: 1210,
      stock_actual: 50,
      stock_minimo: 10,
      densidad_pulgadas: null,
      longitud_metros: null,
      precio_por_metro: null,
      activo: true
    };

    const responseEmpleado = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenEmpleado}`)
      .send(payload);

    expect(responseEmpleado.status).toBe(403);

    (createMock as any).mockResolvedValueOnce({ id: 10, ...payload });

    const responseAdmin = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(payload);

    expect(responseAdmin.status).toBe(201);
    expect(responseAdmin.body.id).toBe(10);
  });

  it('actualiza y elimina producto como admin', async () => {
    (updateMock as any).mockResolvedValueOnce({ id: 1, nombre: 'Actualizado' });

    const responseUpdate = await request(app)
      .put('/api/productos/1')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Actualizado',
        codigo: 'COD-1',
        categoria_tipo: 'FERRETERIA',
        unidad_venta: 'unidad',
        precio_sin_iva: 500,
        precio_con_iva: 605,
        stock_actual: 30,
        stock_minimo: 5,
        densidad_pulgadas: null,
        longitud_metros: null,
        precio_por_metro: null,
        activo: true
      });

    expect(responseUpdate.status).toBe(200);

    (deleteMock as any).mockResolvedValueOnce({ id: 1 });

    const responseDelete = await request(app)
      .delete('/api/productos/1')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(responseDelete.status).toBe(200);
    expect(responseDelete.body.mensaje).toBe('Producto eliminado correctamente.');
  });

  it('valida campos obligatorios para productos de corralon', async () => {
    const response = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Planchuela 1/2"',
        codigo: 'PL-12',
        categoria_tipo: 'CORRALON',
        unidad_venta: 'barra',
        precio_sin_iva: 5000,
        precio_con_iva: 6050,
        stock_actual: 10,
        stock_minimo: 2,
        densidad_pulgadas: null,
        longitud_metros: null,
        precio_por_metro: null,
        activo: true
      });

    expect(response.status).toBe(400);
    expect(response.body.mensaje).toBe('Para CORRALON, densidad, longitud y precio por metro son obligatorios.');
  });
});
