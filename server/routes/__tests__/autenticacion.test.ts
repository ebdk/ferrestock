import request from 'supertest';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { crearApp } from '../../app';
import { firmarToken } from '../../utils/jwt';

const findUniqueMock = jest.fn();
const updateMock = jest.fn();
const compareMock = jest.fn();
const hashMock = jest.fn();

jest.mock('../../utils/prisma', () => ({
  prisma: {
    usuarios: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      update: (...args: unknown[]) => updateMock(...args)
    }
  }
}));

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    compare: (...args: unknown[]) => compareMock(...args),
    hash: (...args: unknown[]) => hashMock(...args)
  }
}));

describe('Rutas de autenticación', () => {
  const app = crearApp();

  beforeEach(() => {
    findUniqueMock.mockReset();
    updateMock.mockReset();
    compareMock.mockReset();
    hashMock.mockReset();
  });

  it('inicia sesión con credenciales válidas', async () => {
    (findUniqueMock as any).mockResolvedValueOnce({
      id: 1,
      nombre: 'Admin',
      email: 'admin',
      password_hash: 'hash_guardado',
      rol: 'ADMIN',
      activo: true,
      requiere_cambio_clave: true
    });
    (compareMock as any).mockResolvedValueOnce(true);

    const response = await request(app)
      .post('/api/autenticacion/iniciar-sesion')
      .send({ usuario: 'admin', password: 'admin123' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.usuario.rol).toBe('ADMIN');
    expect(response.body.usuario.requiere_cambio_clave).toBe(true);
  });

  it('rechaza login cuando el payload es inválido', async () => {
    const response = await request(app)
      .post('/api/autenticacion/iniciar-sesion')
      .send({ usuario: '', password: '' });

    expect(response.status).toBe(400);
    expect(response.body.mensaje).toBe('El usuario es obligatorio.');
  });

  it('rechaza login cuando el usuario no existe o está inactivo', async () => {
    (findUniqueMock as any).mockResolvedValueOnce(null);

    const responseNoExiste = await request(app)
      .post('/api/autenticacion/iniciar-sesion')
      .send({ usuario: 'x', password: 'y' });

    expect(responseNoExiste.status).toBe(401);
    expect(responseNoExiste.body.mensaje).toBe('Usuario o contraseña incorrectos.');

    (findUniqueMock as any).mockResolvedValueOnce({
      id: 1,
      nombre: 'Empleado',
      email: 'empleado',
      password_hash: 'hash',
      rol: 'EMPLEADO',
      activo: false,
      requiere_cambio_clave: false
    });

    const responseInactivo = await request(app)
      .post('/api/autenticacion/iniciar-sesion')
      .send({ usuario: 'empleado', password: '123' });

    expect(responseInactivo.status).toBe(401);
    expect(responseInactivo.body.mensaje).toBe('Usuario o contraseña incorrectos.');
  });

  it('rechaza login cuando la contraseña no coincide', async () => {
    (findUniqueMock as any).mockResolvedValueOnce({
      id: 1,
      nombre: 'Admin',
      email: 'admin',
      password_hash: 'hash_guardado',
      rol: 'ADMIN',
      activo: true,
      requiere_cambio_clave: true
    });
    (compareMock as any).mockResolvedValueOnce(false);

    const response = await request(app)
      .post('/api/autenticacion/iniciar-sesion')
      .send({ usuario: 'admin', password: 'incorrecta' });

    expect(response.status).toBe(401);
    expect(response.body.mensaje).toBe('Usuario o contraseña incorrectos.');
  });

  it('cambia la contraseña con token válido', async () => {
    (hashMock as any).mockResolvedValueOnce('hash_nuevo');
    (updateMock as any).mockResolvedValueOnce({ id: 1 });

    const token = firmarToken({ usuario_id: 1, rol: 'ADMIN', nombre: 'Admin' });

    const response = await request(app)
      .post('/api/autenticacion/cambiar-clave')
      .set('Authorization', `Bearer ${token}`)
      .send({ nueva_clave: 'nuevaClave123' });

    expect(response.status).toBe(200);
    expect(response.body.mensaje).toBe('Contraseña actualizada correctamente.');
    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it('rechaza cambio de contraseña sin token', async () => {
    const response = await request(app)
      .post('/api/autenticacion/cambiar-clave')
      .send({ nueva_clave: 'nuevaClave123' });

    expect(response.status).toBe(401);
    expect(response.body.mensaje).toBe('Sesión inválida o vencida.');
  });
});
