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

const { ComprasPage } = require('../ComprasPage');

describe('ComprasPage', () => {
  beforeEach(() => {
    getJsonMock.mockReset();
    postJsonMock.mockReset();
  });

  it('muestra total y saldo pendiente con pago parcial', async () => {
    (getJsonMock as any).mockResolvedValueOnce([
      { id: 1, nombre: 'Electrodo', categoria_tipo: 'FERRETERIA', precio_con_iva: '1210', stock_actual: '10', longitud_metros: null }
    ]);

    render(<ComprasPage token="token-demo" />);

    fireEvent.change(await screen.findByLabelText('Producto'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Cantidad'), { target: { value: '2' } });
    fireEvent.change(screen.getByPlaceholderText('Pago 1'), { target: { value: '1000' } });

    expect(await screen.findByText('Total con IVA: $2.420,00')).toBeTruthy();
    expect(await screen.findByText('Saldo pendiente: $1.420,00')).toBeTruthy();
  });

  it('muestra advertencia de corte en corralon cuando longitud es menor a estandar', async () => {
    (getJsonMock as any).mockResolvedValueOnce([
      { id: 2, nombre: 'Planchuela', categoria_tipo: 'CORRALON', precio_por_metro: '2000', stock_actual: '8', longitud_metros: '6' }
    ]);

    render(<ComprasPage token="token-demo" />);

    fireEvent.change(await screen.findByLabelText('Producto'), { target: { value: '2' } });
    fireEvent.change(screen.getByPlaceholderText('Cantidad'), { target: { value: '2' } });
    fireEvent.change(screen.getByPlaceholderText('Longitud por barra (m)'), { target: { value: '4' } });

    expect(await screen.findByText(/Corte requerido/)).toBeTruthy();
  });

  it('envia compra al confirmar', async () => {
    (getJsonMock as any).mockResolvedValueOnce([
      { id: 1, nombre: 'Electrodo', categoria_tipo: 'FERRETERIA', precio_con_iva: '1210', stock_actual: '10', longitud_metros: null }
    ]);
    (postJsonMock as any).mockResolvedValueOnce({ id: 100, saldo_pendiente: 0 });

    render(<ComprasPage token="token-demo" />);

    fireEvent.change(await screen.findByLabelText('Producto'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Cantidad'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Pago 1'), { target: { value: '1210' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar compra' }));

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith('/api/compras', expect.any(Object), 'token-demo');
    });
  });
});
