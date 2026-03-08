import { FormEvent, useState } from 'react';
import { postJson } from '../../utils/api';
import type { UsuarioSesion } from '../../types/sesion';

type Props = {
  onSesionIniciada: (token: string, usuario: UsuarioSesion) => void;
};

type RespuestaLogin = {
  token: string;
  usuario: UsuarioSesion;
};

export function LoginPage({ onSesionIniciada }: Props) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setCargando(true);
    setError(null);

    try {
      const data = await postJson<RespuestaLogin>('/api/autenticacion/iniciar-sesion', {
        usuario,
        password
      });

      onSesionIniciada(data.token, data.usuario);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <form className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-4" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-semibold text-slate-900">Ingreso al sistema</h1>

        <label className="block space-y-1">
          <span className="text-sm text-slate-700">Usuario</span>
          <input
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Ingresá tu usuario"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-slate-700">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Ingresá tu contraseña"
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-md bg-slate-900 text-white py-2 disabled:opacity-50"
        >
          {cargando ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
    </main>
  );
}
