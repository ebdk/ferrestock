/** @jest-environment jsdom */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const getJsonMock = jest.fn();
const postJsonMock = jest.fn();
const putJsonMock = jest.fn();
const deleteJsonMock = jest.fn();

jest.mock('../../../utils/api', () => ({
  getJson: (...args: unknown[]) => getJsonMock(...args),
  postJson: (...args: unknown[]) => postJsonMock(...args),
  putJson: (...args: unknown[]) => putJsonMock(...args),
  deleteJson: (...args: unknown[]) => deleteJsonMock(...args)
}));

const { ProductosPage } = require('../ProductosPage');

describe('ProductosPage', () => {
  beforeEach(() => {
    getJsonMock.mockReset();
    postJsonMock.mockReset();
    putJsonMock.mockReset();
    deleteJsonMock.mockReset();
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

  it('permite filtrar por categoria', async () => {
    (getJsonMock as any).mockResolvedValueOnce([]);
    (getJsonMock as any).mockResolvedValueOnce([]);

    render(<ProductosPage token="token-demo" rol="EMPLEADO" />);

    fireEvent.change(await screen.findByLabelText('Filtrar categoría'), { target: { value: 'CORRALON' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => {
      expect(getJsonMock).toHaveBeenLastCalledWith('/api/productos?categoria=CORRALON', 'token-demo');
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

  it('calcula precio con iva al escribir precio sin iva', async () => {
    (getJsonMock as any).mockResolvedValue([]);

    render(<ProductosPage token="token-demo" rol="ADMIN" />);
    await waitFor(() => {
      expect(getJsonMock).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByPlaceholderText('Precio sin IVA'), { target: { value: '1000' } });

    expect((screen.getByPlaceholderText('Precio con IVA') as HTMLInputElement).value).toBe('1210,00');
  });

  it('permite editar y eliminar productos solo para admin', async () => {
    (getJsonMock as any).mockResolvedValue([{ id: 1, nombre: 'Prod', codigo: 'P-1', categoria_tipo: 'FERRETERIA', stock_actual: '10', stock_minimo: '1' }]);
    (putJsonMock as any).mockResolvedValue({ id: 1 });
    (deleteJsonMock as any).mockResolvedValue({ mensaje: 'ok' });

    render(<ProductosPage token="token-demo" rol="ADMIN" />);
    expect(await screen.findByText('Prod')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(putJsonMock).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(deleteJsonMock).toHaveBeenCalled());
  });
});
