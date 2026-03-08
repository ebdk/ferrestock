import { FormEvent, useEffect, useState } from 'react';
import { getJson, postJson } from '../../utils/api';

type Props = {
  token: string;
  rol: 'ADMIN' | 'EMPLEADO';
};

type Producto = {
  id: number;
  nombre: string;
  codigo: string;
  categoria_tipo: 'FERRETERIA' | 'CORRALON';
  stock_actual: string;
};

export function ProductosPage({ token, rol }: Props) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function cargarProductos(texto = '') {
    const query = texto ? `?busqueda=${encodeURIComponent(texto)}` : '';
    const data = await getJson<Producto[]>(`/api/productos${query}`, token);
    setProductos(data);
  }

  useEffect(() => {
    cargarProductos().catch((e) => setError(e instanceof Error ? e.message : 'No se pudieron cargar los productos.'));
  }, []);

  async function crearProducto(event: FormEvent) {
    event.preventDefault();

    if (rol !== 'ADMIN') {
      return;
    }

    try {
      await postJson(
        '/api/productos',
        {
          nombre,
          codigo,
          categoria_tipo: 'FERRETERIA',
          unidad_venta: 'unidad',
          precio_sin_iva: 0,
          precio_con_iva: 0,
          stock_actual: 0,
          stock_minimo: 0,
          densidad_pulgadas: null,
          longitud_metros: null,
          precio_por_metro: null,
          activo: true
        },
        token
      );

      setNombre('');
      setCodigo('');
      await cargarProductos(busqueda);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el producto.');
    }
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="bg-slate-50 border rounded-lg p-4">
        <h2 className="text-xl font-semibold">Productos</h2>
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-md border px-3 py-2"
            placeholder="Buscar por nombre o código"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button className="rounded-md bg-slate-900 text-white px-3" onClick={() => cargarProductos(busqueda)}>
            Buscar
          </button>
        </div>

        <div className="mt-4 space-y-2 max-h-80 overflow-auto">
          {productos.map((producto) => (
            <article key={producto.id} className="border rounded-md p-3 bg-white">
              <p className="font-medium">{producto.nombre}</p>
              <p className="text-sm text-slate-700">Código: {producto.codigo}</p>
              <p className="text-sm text-slate-700">Categoría: {producto.categoria_tipo}</p>
              <p className="text-sm text-slate-700">Stock actual: {producto.stock_actual}</p>
            </article>
          ))}
        </div>
      </div>

      <form className="bg-white border rounded-lg p-4 space-y-3" onSubmit={crearProducto}>
        <h2 className="text-xl font-semibold">Alta rápida</h2>
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Nombre del producto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Código interno"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {rol === 'ADMIN' ? (
          <button className="rounded-md bg-slate-900 text-white px-3 py-2" type="submit">
            Crear producto
          </button>
        ) : (
          <p className="text-sm text-slate-600">Solo ADMIN puede crear o editar productos.</p>
        )}
      </form>
    </section>
  );
}
