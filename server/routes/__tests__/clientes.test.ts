import request from 'supertest';
import { describe, expect, it, jest } from '@jest/globals';
import { crearApp } from '../../app';
import { firmarToken } from '../../utils/jwt';

const findManyMock = jest.fn();
const createMock = jest.fn();
const updateMock = jest.fn();
const deleteMock = jest.fn();
const comprasFindManyMock = jest.fn();

jest.mock('../../utils/prisma', () => ({
  prisma: {
    clientes: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      create: (...args: unknown[]) => createMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
      delete: (...args: unknown[]) => deleteMock(...args)
    },
    compras: {
      findMany: (...args: unknown[]) => comprasFindManyMock(...args)
    }
  }
}));

describe('Rutas de clientes', () => {
  const app = crearApp();
  const tokenEmpleado = firmarToken({
    usuario_id: 1,
    rol: 'EMPLEADO',
    nombre: 'Empleado Prueba'
  });

  it('rechaza acceso sin token', async () => {
    const response = await request(app).get('/api/clientes');

    expect(response.status).toBe(401);
    expect(response.body.mensaje).toBe('Sesión inválida o vencida.');
  });

  it('lista clientes filtrando por búsqueda', async () => {
    (findManyMock as any).mockResolvedValueOnce([{ id: 1, nombre: 'Juan Pérez', telefonos: ['111'] }]);

    const response = await request(app)
      .get('/api/clientes?busqueda=juan')
      .set('Authorization', `Bearer ${tokenEmpleado}`);

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledTimes(1);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].nombre).toBe('Juan Pérez');
  });

  it('crea cliente con datos válidos', async () => {
    (createMock as any).mockResolvedValueOnce({ id: 10, nombre: 'Cliente Nuevo' });

    const response = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenEmpleado}`)
      .send({
        nombre: 'Cliente Nuevo',
        direccion: 'Calle 123',
        lat: null,
        lng: null,
        telefonos: ['222'],
        notas: null,
        activo: true
      });

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(response.body.id).toBe(10);
  });

  it('devuelve historial de compras por cliente', async () => {
    (comprasFindManyMock as any).mockResolvedValueOnce([{ id: 1, cliente_id: 1, total_con_iva: '1200.00' }]);

    const response = await request(app)
      .get('/api/clientes/1/historial-compras')
      .set('Authorization', `Bearer ${tokenEmpleado}`);

    expect(response.status).toBe(200);
    expect(comprasFindManyMock).toHaveBeenCalledTimes(1);
    expect(response.body[0].id).toBe(1);
  });

  it('actualiza cliente por id', async () => {
    (updateMock as any).mockResolvedValueOnce({ id: 1, nombre: 'Actualizado' });

    const response = await request(app)
      .put('/api/clientes/1')
      .set('Authorization', `Bearer ${tokenEmpleado}`)
      .send({
        nombre: 'Actualizado',
        direccion: 'Calle 999',
        lat: null,
        lng: null,
        telefonos: ['333'],
        notas: null,
        activo: true
      });

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(response.body.nombre).toBe('Actualizado');
  });

  it('elimina cliente por id', async () => {
    (deleteMock as any).mockResolvedValueOnce({ id: 1 });

    const response = await request(app)
      .delete('/api/clientes/1')
      .set('Authorization', `Bearer ${tokenEmpleado}`);

    expect(response.status).toBe(200);
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(response.body.mensaje).toBe('Cliente eliminado correctamente.');
  });

  it('geocodifica una dirección y devuelve lat/lng', async () => {
    const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ lat: '-34.7211', lon: '-58.2546' }]
    } as any);

    const response = await request(app)
      .get('/api/clientes/geocodificar?direccion=Zapiola%20Bernal')
      .set('Authorization', `Bearer ${tokenEmpleado}`);

    expect(response.status).toBe(200);
    expect(response.body.lat).toBe(-34.7211);
    expect(response.body.lng).toBe(-58.2546);
    fetchMock.mockRestore();
  });
});
