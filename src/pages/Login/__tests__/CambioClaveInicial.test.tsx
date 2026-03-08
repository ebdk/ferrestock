/** @jest-environment jsdom */
import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CambioClaveInicial } from '../CambioClaveInicial';

const postJsonMock = jest.fn();

jest.mock('../../../utils/api', () => ({
  postJson: (...args: unknown[]) => postJsonMock(...args)
}));

describe('CambioClaveInicial', () => {
  it('muestra error si las contraseñas no coinciden', async () => {
    render(<CambioClaveInicial token="token-demo" onCompletado={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'clave1234' } });
    fireEvent.change(screen.getByPlaceholderText('Repetí la contraseña'), { target: { value: 'otra1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar contraseña' }));

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeTruthy();
  });

  it('envía nueva clave y ejecuta onCompletado', async () => {
    const onCompletado = jest.fn();
    (postJsonMock as any).mockResolvedValueOnce({ mensaje: 'ok' });

    render(<CambioClaveInicial token="token-demo" onCompletado={onCompletado} />);

    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'clave1234' } });
    fireEvent.change(screen.getByPlaceholderText('Repetí la contraseña'), { target: { value: 'clave1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar contraseña' }));

    await waitFor(() => {
      expect(onCompletado).toHaveBeenCalledTimes(1);
    });
  });
});
