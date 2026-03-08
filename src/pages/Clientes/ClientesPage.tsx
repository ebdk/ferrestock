import { FormEvent, useEffect, useState } from 'react';
import { deleteJson, getJson, postJson, putJson } from '../../utils/api';
import type { Cliente, CompraHistorial } from '../../types/clientes';

type Props = {
  token: string;
};

type FormCliente = {
  nombre: string;
  direccion: string;
  lat: string;
  lng: string;
  telefonos: string;
  notas: string;
  activo: boolean;
};

const inicial: FormCliente = {
  nombre: '',
  direccion: '',
  lat: '',
  lng: '',
  telefonos: '',
  notas: '',
  activo: true
};

export function ClientesPage({ token }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [historial, setHistorial] = useState<CompraHistorial[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState<FormCliente>(inicial);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cargarClientes(texto = '') {
    const query = texto ? `?busqueda=${encodeURIComponent(texto)}` : '';
    const data = await getJson<Cliente[]>(`/api/clientes${query}`, token);
    setClientes(data);
  }

  async function geocodificarDireccion() {
    if (!form.direccion.trim()) {
      setError('Ingresá una dirección para geocodificar.');
      return;
    }

    try {
      const data = await getJson<{ lat: number; lng: number }>(
        `/api/clientes/geocodificar?direccion=${encodeURIComponent(form.direccion)}`,
        token
      );

      setForm((prev) => ({
        ...prev,
        lat: String(data.lat),
        lng: String(data.lng)
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo geocodificar la dirección.');
    }
  }

  useEffect(() => {
    cargarClientes().catch((e) => setError(e instanceof Error ? e.message : 'No se pudieron cargar los clientes.'));
  }, []);

  async function verHistorial(cliente: Cliente) {
    setClienteSeleccionado(cliente);
    const data = await getJson<CompraHistorial[]>(`/api/clientes/${cliente.id}/historial-compras`, token);
    setHistorial(data);
  }

  function cargarEnFormulario(cliente: Cliente) {
    setEditandoId(cliente.id);
    setForm({
      nombre: cliente.nombre,
      direccion: cliente.direccion,
      lat: cliente.lat ?? '',
      lng: cliente.lng ?? '',
      telefonos: cliente.telefonos.join(', '),
      notas: cliente.notas ?? '',
      activo: cliente.activo
    });
  }

  async function handleGuardar(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = {
      nombre: form.nombre,
      direccion: form.direccion,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
      telefonos: form.telefonos
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      notas: form.notas || null,
      activo: form.activo
    };

    try {
      if (editandoId) {
        await putJson(`/api/clientes/${editandoId}`, payload, token);
      } else {
        await postJson('/api/clientes', payload, token);
      }

      setForm(inicial);
      setEditandoId(null);
      await cargarClientes(busqueda);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el cliente.');
    }
  }

  async function eliminarCliente(id: number) {
    try {
      await deleteJson(`/api/clientes/${id}`, token);
      await cargarClientes(busqueda);
      if (clienteSeleccionado?.id === id) {
        setClienteSeleccionado(null);
        setHistorial([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar el cliente.');
    }
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="bg-slate-50 border rounded-lg p-4">
        <h2 className="text-xl font-semibold">Clientes</h2>

        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-md border px-3 py-2"
            placeholder="Buscar por nombre, teléfono o dirección"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button
            className="rounded-md bg-slate-900 text-white px-3"
            onClick={() => cargarClientes(busqueda)}
          >
            Buscar
          </button>
        </div>

        <div className="mt-4 space-y-2 max-h-80 overflow-auto">
          {clientes.map((cliente) => (
            <article key={cliente.id} className="border rounded-md p-3 bg-white">
              <p className="font-medium">{cliente.nombre}</p>
              <p className="text-sm text-slate-700">{cliente.direccion}</p>
              <p className="text-sm text-slate-700">Teléfonos: {cliente.telefonos.join(', ')}</p>
              <p className="text-sm text-slate-700">Estado: {cliente.activo ? 'Activo' : 'Inactivo'}</p>
              <div className="mt-2 flex gap-2">
                <button className="text-sm px-2 py-1 bg-slate-200 rounded" onClick={() => cargarEnFormulario(cliente)}>
                  Editar
                </button>
                <button
                  className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded"
                  onClick={() => eliminarCliente(cliente.id)}
                >
                  Eliminar
                </button>
                <button className="text-sm px-2 py-1 bg-emerald-100 text-emerald-800 rounded" onClick={() => verHistorial(cliente)}>
                  Historial
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <form className="bg-white border rounded-lg p-4 space-y-3" onSubmit={handleGuardar}>
          <h2 className="text-xl font-semibold">{editandoId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <input className="w-full rounded-md border px-3 py-2" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <input className="w-full rounded-md border px-3 py-2" placeholder="Dirección" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          <button
            type="button"
            className="rounded-md bg-slate-200 px-3 py-2 text-sm"
            onClick={geocodificarDireccion}
          >
            Geocodificar dirección
          </button>
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-md border px-3 py-2" placeholder="Latitud (opcional)" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
            <input className="rounded-md border px-3 py-2" placeholder="Longitud (opcional)" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
          </div>
          <input className="w-full rounded-md border px-3 py-2" placeholder="Teléfonos separados por coma" value={form.telefonos} onChange={(e) => setForm({ ...form, telefonos: e.target.value })} />
          <textarea className="w-full rounded-md border px-3 py-2" placeholder="Notas internas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
            Cliente activo
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <button className="rounded-md bg-slate-900 text-white px-3 py-2" type="submit">
              {editandoId ? 'Guardar cambios' : 'Crear cliente'}
            </button>
            {editandoId ? (
              <button
                type="button"
                className="rounded-md bg-slate-200 px-3 py-2"
                onClick={() => {
                  setEditandoId(null);
                  setForm(inicial);
                }}
              >
                Cancelar edición
              </button>
            ) : null}
          </div>
        </form>

        <section className="bg-white border rounded-lg p-4">
          <h2 className="text-xl font-semibold">Historial de compras</h2>
          <p className="text-sm text-slate-600 mt-1">
            {clienteSeleccionado ? `Cliente seleccionado: ${clienteSeleccionado.nombre}` : 'Seleccioná un cliente para ver su historial.'}
          </p>
          <ul className="mt-3 space-y-2">
            {historial.map((compra) => (
              <li key={compra.id} className="text-sm border rounded p-2">
                Compra #{compra.id} - Fecha: {new Date(compra.fecha).toLocaleDateString('es-AR')} - Total: ${' '}
                {Number(compra.total_con_iva).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </li>
            ))}
            {!historial.length && clienteSeleccionado ? <li className="text-sm text-slate-600">Este cliente aún no tiene compras registradas.</li> : null}
          </ul>
        </section>
      </div>
    </section>
  );
}
