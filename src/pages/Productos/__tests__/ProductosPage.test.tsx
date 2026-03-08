/** @jest-environment jsdom */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const getJsonMock = jest.fn();
const postJsonMock = jest.fn();

jest.mock('../../../utils/api', () => ({
  getJson: (...args: unknown[]) => getJsonMock(...args),
  postJson: (...args: unknown[]) => postJsonMock(...args),
  putJson: jest.fn(),
  deleteJson: jest.fn()
}));

const { ProductosPage } = require('../ProductosPage');

describe('ProductosPage', () => {
  beforeEach(() => {
    getJsonMock.mockReset();
    postJsonMock.mockReset();
  });

  it('carga y muestra productos', async () => {
    (getJsonMock as any).mockResolvedValueOnce([
      { id: 1, nombre: 'Planchuela 3/4"', codigo: 'PL-34', categoria_tipo: 'CORRALON', stock_actual: '12' }
    ]);

    render(<ProductosPage token="token-demo" rol="EMPLEADO" />);

    expect(await screen.findByText('Planchuela 3/4"')).toBeTruthy();
  });

  it('permite buscar productos', async () => {
    (getJsonMock as any).mockResolvedValueOnce([]);
    (getJsonMock as any).mockResolvedValueOnce([]);

    render(<ProductosPage token="token-demo" rol="EMPLEADO" />);

    fireEvent.change(await screen.findByPlaceholderText('Buscar por nombre o código'), {
      target: { value: 'electrodo' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => {
      expect(getJsonMock).toHaveBeenLastCalledWith('/api/productos?busqueda=electrodo', 'token-demo');
    });
  });

  it('solo admin puede crear producto', async () => {
    (getJsonMock as any).mockResolvedValue([]);

    render(<ProductosPage token="token-demo" rol="EMPLEADO" />);
    await waitFor(() => {
      expect(getJsonMock).toHaveBeenCalled();
    });
    expect(screen.queryByRole('button', { name: 'Crear producto' })).toBeNull();

    render(<ProductosPage token="token-demo" rol="ADMIN" />);
    await waitFor(() => {
      expect(getJsonMock).toHaveBeenCalled();
    });
    expect(screen.getByRole('button', { name: 'Crear producto' })).toBeTruthy();
  });

  it('muestra alerta visual cuando stock está por debajo del mínimo', async () => {
    (getJsonMock as any).mockResolvedValueOnce([
      {
        id: 1,
        nombre: 'Electrodo 6013',
        codigo: 'EL-6013',
        categoria_tipo: 'FERRETERIA',
        stock_actual: '2',
        stock_minimo: '5'
      }
    ]);

    render(<ProductosPage token="token-demo" rol="EMPLEADO" />);

    expect(await screen.findByText('Stock mínimo alcanzado')).toBeTruthy();
  });

  it('muestra campos de corralon al seleccionar categoria CORRALON', async () => {
    (getJsonMock as any).mockResolvedValue([]);

    render(<ProductosPage token="token-demo" rol="ADMIN" />);
    await waitFor(() => {
      expect(getJsonMock).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'CORRALON' } });

    expect(screen.getByPlaceholderText('Densidad en pulgadas (ej: 1/2\")')).toBeTruthy();
    expect(screen.getByPlaceholderText('Longitud estándar en metros')).toBeTruthy();
    expect(screen.getByPlaceholderText('Precio por metro')).toBeTruthy();
  });
});
