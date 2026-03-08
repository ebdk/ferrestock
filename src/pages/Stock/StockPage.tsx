import { FormEvent, useEffect, useState } from 'react';
import { getJson, postJson } from '../../utils/api';

type Props = {
  token: string;
};

type ProductoStock = {
  id: number;
  nombre: string;
  codigo: string;
  stock_actual: string;
  stock_minimo: string;
};

export function StockPage({ token }: Props) {
  const [inventario, setInventario] = useState<ProductoStock[]>([]);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cargarInventario() {
    const data = await getJson<ProductoStock[]>('/api/stock/inventario', token);
    setInventario(data);
  }

  useEffect(() => {
    cargarInventario().catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar stock.'));
  }, []);

  async function registrarAjuste(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMensaje(null);

    try {
      await postJson(
        '/api/stock/ajuste',
        {
          producto_id: Number(productoId),
          cantidad: Number(cantidad),
          motivo
        },
        token
      );

      setMensaje('Ajuste registrado correctamente.');
      setCantidad('');
      setMotivo('');
      await cargarInventario();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar el ajuste.');
    }
  }

  async function exportarCsv() {
    try {
      await getJson('/api/stock/exportar.csv', token);
      setMensaje('Exportación solicitada correctamente.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo exportar stock.');
    }
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="bg-slate-50 border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Inventario</h2>
          <button type="button" className="rounded-md bg-slate-900 text-white px-3 py-2" onClick={exportarCsv}>
            Exportar CSV
          </button>
        </div>

        <div className="mt-4 space-y-2 max-h-80 overflow-auto">
          {inventario.map((producto) => (
            <article key={producto.id} className="border rounded-md p-3 bg-white">
              <p className="font-medium">{producto.nombre}</p>
              <p className="text-sm text-slate-700">Código: {producto.codigo}</p>
              <p className="text-sm text-slate-700">Stock actual: {producto.stock_actual}</p>
              <p className="text-sm text-slate-700">Stock mínimo: {producto.stock_minimo}</p>
            </article>
          ))}
        </div>
      </div>

      <form className="bg-white border rounded-lg p-4 space-y-3" onSubmit={registrarAjuste}>
        <h2 className="text-xl font-semibold">Ajuste manual de stock</h2>

        <label className="block text-sm text-slate-700">
          Producto
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
          >
            <option value="">Seleccionar producto</option>
            {inventario.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.nombre}
              </option>
            ))}
          </select>
        </label>

        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Cantidad (puede ser negativa)"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />

        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Motivo del ajuste"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />

        {mensaje ? <p className="text-sm text-emerald-700">{mensaje}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button type="submit" className="rounded-md bg-slate-900 text-white px-3 py-2">
          Registrar ajuste
        </button>
      </form>
    </section>
  );
}
