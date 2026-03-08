/** @jest-environment jsdom */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClientesPage } from '../ClientesPage';

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

describe('ClientesPage', () => {
  beforeEach(() => {
    getJsonMock.mockReset();
    postJsonMock.mockReset();
    putJsonMock.mockReset();
    deleteJsonMock.mockReset();
  });

  it('muestra clientes al cargar la pantalla', async () => {
    (getJsonMock as any).mockResolvedValueOnce([
      {
        id: 1,
        nombre: 'Juan Pérez',
        direccion: 'Av. Mitre 1200',
        lat: null,
        lng: null,
        telefonos: ['11-1234-5678'],
        notas: null,
        activo: true,
        created_at: '2026-03-08T00:00:00.000Z'
      }
    ]);

    render(<ClientesPage token="token-demo" />);

    expect(await screen.findByText('Juan Pérez')).toBeTruthy();
    expect(getJsonMock).toHaveBeenCalledWith('/api/clientes', 'token-demo');
  });

  it('ejecuta búsqueda cuando se presiona el botón Buscar', async () => {
    (getJsonMock as any).mockResolvedValueOnce([]);
    (getJsonMock as any).mockResolvedValueOnce([]);

    render(<ClientesPage token="token-demo" />);

    const inputBusqueda = await screen.findByPlaceholderText('Buscar por nombre, teléfono o dirección');
    fireEvent.change(inputBusqueda, { target: { value: 'ramirez' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => {
      expect(getJsonMock).toHaveBeenLastCalledWith('/api/clientes?busqueda=ramirez', 'token-demo');
    });
  });
});
