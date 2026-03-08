/** @jest-environment jsdom */
import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('../pages/Login/LoginPage', () => ({
  LoginPage: ({ onSesionIniciada }: any) => (
    <div>
      <button
        onClick={() =>
          onSesionIniciada('token-demo', {
            id: 1,
            nombre: 'Juan Repartidor',
            rol: 'REPARTIDOR',
            requiere_cambio_clave: false
          })
        }
      >
        Simular login repartidor
      </button>
      <button
        onClick={() =>
          onSesionIniciada('token-admin', {
            id: 2,
            nombre: 'Admin',
            rol: 'ADMIN',
            requiere_cambio_clave: false
          })
        }
      >
        Simular login admin
      </button>
    </div>
  )
}));

jest.mock('../pages/Panel/PanelGeneralPage', () => ({
  PanelGeneralPage: () => <div>Panel principal</div>
}));

jest.mock('../pages/Repartidor/RepartidorPage', () => ({
  RepartidorPage: () => <div>Ruta del día</div>
}));

jest.mock('../pages/Login/CambioClaveInicial', () => ({
  CambioClaveInicial: () => <div>Cambio de contraseña obligatorio</div>
}));

const { App } = require('../App');

describe('App', () => {
  it('redirige a vista repartidor cuando el rol es REPARTIDOR', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Simular login repartidor' }));

    expect(await screen.findByText('Ruta del día')).toBeTruthy();
  });

  it('redirige al panel general cuando el rol es ADMIN', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Simular login admin' }));

    expect(await screen.findByText('Panel principal')).toBeTruthy();
  });
});
