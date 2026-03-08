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

const { StockPage } = require('../StockPage');

describe('StockPage', () => {
  beforeEach(() => {
    getJsonMock.mockReset();
    postJsonMock.mockReset();
    (getJsonMock as any).mockResolvedValue([]);
  });

  it('muestra inventario actual', async () => {
    (getJsonMock as any).mockResolvedValueOnce([
      { id: 1, nombre: 'Electrodo', codigo: 'E-1', stock_actual: '10', stock_minimo: '2' }
    ]);

    render(<StockPage token="token-demo" />);

    expect(await screen.findByText('Código: E-1')).toBeTruthy();
  });

  it('registra ajuste manual con motivo obligatorio', async () => {
    (getJsonMock as any).mockResolvedValueOnce([
      { id: 1, nombre: 'Electrodo', codigo: 'E-1', stock_actual: '10', stock_minimo: '2' }
    ]);
    (getJsonMock as any).mockResolvedValueOnce([
      { id: 1, nombre: 'Electrodo', codigo: 'E-1', stock_actual: '8', stock_minimo: '2' }
    ]);
    (postJsonMock as any).mockResolvedValueOnce({ mensaje: 'ok' });

    render(<StockPage token="token-demo" />);

    fireEvent.change(await screen.findByLabelText('Producto'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Cantidad (puede ser negativa)'), { target: { value: '-2' } });
    fireEvent.change(screen.getByPlaceholderText('Motivo del ajuste'), { target: { value: 'Merma' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar ajuste' }));

    await waitFor(() => {
      expect(postJsonMock).toHaveBeenCalledWith(
        '/api/stock/ajuste',
        { producto_id: 1, cantidad: -2, motivo: 'Merma' },
        'token-demo'
      );
    });
  });

  it('solicita exportación csv', async () => {
    (getJsonMock as any).mockResolvedValueOnce([]);
    (getJsonMock as any).mockResolvedValueOnce('nombre,codigo,stock_actual,stock_minimo');

    render(<StockPage token="token-demo" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Exportar CSV' }));

    await waitFor(() => {
      expect(getJsonMock).toHaveBeenLastCalledWith('/api/stock/exportar.csv', 'token-demo');
    });
  });
});
