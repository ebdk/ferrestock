/** @jest-environment jsdom */
import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LoginPage } from '../LoginPage';

const postJsonMock = jest.fn();

jest.mock('../../../utils/api', () => ({
  postJson: (...args: unknown[]) => postJsonMock(...args)
}));

describe('LoginPage', () => {
  it('envía credenciales y ejecuta onSesionIniciada', async () => {
    const onSesionIniciada = jest.fn();
    (postJsonMock as any).mockResolvedValueOnce({
      token: 'token-demo',
      usuario: {
        id: 1,
        nombre: 'Admin',
        rol: 'ADMIN',
        requiere_cambio_clave: false
      }
    });

    render(<LoginPage onSesionIniciada={onSesionIniciada} />);

    fireEvent.change(screen.getByPlaceholderText('Ingresá tu usuario'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('Ingresá tu contraseña'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(onSesionIniciada).toHaveBeenCalledTimes(1);
    });
  });

  it('muestra error cuando falla el login', async () => {
    (postJsonMock as any).mockRejectedValueOnce(new Error('Usuario o contraseña incorrectos.'));

    render(<LoginPage onSesionIniciada={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Ingresá tu usuario'), { target: { value: 'x' } });
    fireEvent.change(screen.getByPlaceholderText('Ingresá tu contraseña'), { target: { value: 'y' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Usuario o contraseña incorrectos.')).toBeTruthy();
  });
});
