import { useMemo, useState } from 'react';
import { LoginPage } from './pages/Login/LoginPage';
import { RepartidorPage } from './pages/Repartidor/RepartidorPage';
import { PanelGeneralPage } from './pages/Panel/PanelGeneralPage';
import { CambioClaveInicial } from './pages/Login/CambioClaveInicial';
import type { UsuarioSesion } from './types/sesion';

type SesionActiva = {
  token: string;
  usuario: UsuarioSesion;
};

export function App() {
  const [sesion, setSesion] = useState<SesionActiva | null>(null);

  const requiereCambioClave = useMemo(() => {
    return sesion?.usuario.requiere_cambio_clave ?? false;
  }, [sesion]);

  if (!sesion) {
    return (
      <LoginPage
        onSesionIniciada={(token, usuario) => {
          setSesion({ token, usuario });
        }}
      />
    );
  }

  if (requiereCambioClave) {
    return (
      <CambioClaveInicial
        token={sesion.token}
        onCompletado={() => {
          setSesion({
            ...sesion,
            usuario: {
              ...sesion.usuario,
              requiere_cambio_clave: false
            }
          });
        }}
      />
    );
  }

  if (sesion.usuario.rol === 'REPARTIDOR') {
    return <RepartidorPage nombre={sesion.usuario.nombre} />;
  }

  return <PanelGeneralPage nombre={sesion.usuario.nombre} rol={sesion.usuario.rol} token={sesion.token} />;
}
