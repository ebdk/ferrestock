import { FormEvent, useState } from 'react';
import { postJson } from '../../utils/api';

type Props = {
  token: string;
  onCompletado: () => void;
};

export function CambioClaveInicial({ token, onCompletado }: Props) {
  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (nuevaClave !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      await postJson('/api/autenticacion/cambiar-clave', { nueva_clave: nuevaClave }, token);
      onCompletado();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar la contraseña.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <form className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-4" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-semibold text-slate-900">Cambio de contraseña obligatorio</h1>
        <p className="text-sm text-slate-700">
          Por seguridad, debés cambiar la contraseña inicial antes de continuar.
        </p>

        <label className="block space-y-1">
          <span className="text-sm text-slate-700">Nueva contraseña</span>
          <input
            type="password"
            value={nuevaClave}
            onChange={(e) => setNuevaClave(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Mínimo 8 caracteres"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-slate-700">Repetir nueva contraseña</span>
          <input
            type="password"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Repetí la contraseña"
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-md bg-slate-900 text-white py-2 disabled:opacity-50"
        >
          {cargando ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
      </form>
    </main>
  );
}
