import { FormEvent, useEffect, useState } from 'react';
import { deleteJson, getJson, postJson, putJson } from '../../utils/api';

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
  stock_minimo?: string;
};

export function ProductosPage({ token, rol }: Props) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<'TODOS' | 'FERRETERIA' | 'CORRALON'>('TODOS');
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [precioSinIva, setPrecioSinIva] = useState('');
  const [precioConIva, setPrecioConIva] = useState('');
  const [categoria, setCategoria] = useState<'FERRETERIA' | 'CORRALON'>('FERRETERIA');
  const [densidadPulgadas, setDensidadPulgadas] = useState('');
  const [longitudMetros, setLongitudMetros] = useState('');
  const [precioPorMetro, setPrecioPorMetro] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function parseNumero(valor: string): number {
    const normalizado = valor.replace(/\./g, '').replace(',', '.');
    return Number(normalizado || '0');
  }

  function formatearNumero(valor: number): string {
    return valor.toFixed(2).replace('.', ',');
  }

  async function cargarProductos(texto = '') {
    const params = new URLSearchParams();
    if (texto) {
      params.set('busqueda', texto);
    }
    if (filtroCategoria !== 'TODOS') {
      params.set('categoria', filtroCategoria);
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await getJson<Producto[]>(`/api/productos${query}`, token);
    setProductos(data);
  }

  useEffect(() => {
    cargarProductos().catch((e) => setError(e instanceof Error ? e.message : 'No se pudieron cargar los productos.'));
  }, []);

  async function guardarProducto(event: FormEvent) {
    event.preventDefault();

    if (rol !== 'ADMIN') {
      return;
    }

    try {
      const payload = {
        nombre,
        codigo,
        categoria_tipo: categoria,
        unidad_venta: 'unidad',
        precio_sin_iva: parseNumero(precioSinIva),
        precio_con_iva: parseNumero(precioConIva),
        stock_actual: 0,
        stock_minimo: 0,
        densidad_pulgadas: categoria === 'CORRALON' ? densidadPulgadas : null,
        longitud_metros: categoria === 'CORRALON' && longitudMetros ? Number(longitudMetros) : null,
        precio_por_metro: categoria === 'CORRALON' && precioPorMetro ? Number(precioPorMetro) : null,
        activo: true
      };

      if (editandoId) {
        await putJson(`/api/productos/${editandoId}`, payload, token);
      } else {
        await postJson('/api/productos', payload, token);
      }

      setNombre('');
      setCodigo('');
      setPrecioSinIva('');
      setPrecioConIva('');
      setCategoria('FERRETERIA');
      setDensidadPulgadas('');
      setLongitudMetros('');
      setPrecioPorMetro('');
      setEditandoId(null);
      await cargarProductos(busqueda);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el producto.');
    }
  }

  async function eliminarProducto(id: number) {
    try {
      await deleteJson(`/api/productos/${id}`, token);
      await cargarProductos(busqueda);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar el producto.');
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
          <label className="text-sm text-slate-700">
            Filtrar categoría
            <select
              className="ml-2 rounded-md border px-2 py-2"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value as 'TODOS' | 'FERRETERIA' | 'CORRALON')}
            >
              <option value="TODOS">Todos</option>
              <option value="FERRETERIA">Ferretería</option>
              <option value="CORRALON">Corralón</option>
            </select>
          </label>
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
              {Number(producto.stock_actual) <= Number(producto.stock_minimo ?? 0) ? (
                <p className="text-sm text-red-600 font-medium">Stock mínimo alcanzado</p>
              ) : null}
              {rol === 'ADMIN' ? (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="text-sm px-2 py-1 bg-slate-200 rounded"
                    onClick={() => {
                      setEditandoId(producto.id);
                      setNombre(producto.nombre);
                      setCodigo(producto.codigo);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded"
                    onClick={() => eliminarProducto(producto.id)}
                  >
                    Eliminar
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <form className="bg-white border rounded-lg p-4 space-y-3" onSubmit={guardarProducto}>
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
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Precio sin IVA"
          value={precioSinIva}
          onChange={(e) => {
            const valor = e.target.value;
            setPrecioSinIva(valor);
            const numero = parseNumero(valor);
            setPrecioConIva(formatearNumero(numero * 1.21));
          }}
        />
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Precio con IVA"
          value={precioConIva}
          onChange={(e) => {
            const valor = e.target.value;
            setPrecioConIva(valor);
            const numero = parseNumero(valor);
            setPrecioSinIva(formatearNumero(numero / 1.21));
          }}
        />
        <label className="block text-sm text-slate-700">
          Categoría
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as 'FERRETERIA' | 'CORRALON')}
          >
            <option value="FERRETERIA">Ferretería</option>
            <option value="CORRALON">Corralón</option>
          </select>
        </label>
        {categoria === 'CORRALON' ? (
          <>
            <input
              className="w-full rounded-md border px-3 py-2"
              placeholder='Densidad en pulgadas (ej: 1/2")'
              value={densidadPulgadas}
              onChange={(e) => setDensidadPulgadas(e.target.value)}
            />
            <input
              className="w-full rounded-md border px-3 py-2"
              placeholder="Longitud estándar en metros"
              value={longitudMetros}
              onChange={(e) => setLongitudMetros(e.target.value)}
            />
            <input
              className="w-full rounded-md border px-3 py-2"
              placeholder="Precio por metro"
              value={precioPorMetro}
              onChange={(e) => setPrecioPorMetro(e.target.value)}
            />
          </>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {rol === 'ADMIN' ? (
          <button className="rounded-md bg-slate-900 text-white px-3 py-2" type="submit">
            {editandoId ? 'Guardar cambios' : 'Crear producto'}
          </button>
        ) : (
          <p className="text-sm text-slate-600">Solo ADMIN puede crear o editar productos.</p>
        )}
      </form>
    </section>
  );
}
