import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getJson, postJson } from '../../utils/api';

type Props = {
  token: string;
};

type Producto = {
  id: number;
  nombre: string;
  categoria_tipo: 'FERRETERIA' | 'CORRALON';
  precio_con_iva?: string;
  precio_por_metro?: string;
  stock_actual: string;
  longitud_metros: string | null;
};

function moneda(valor: number): string {
  return valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ComprasPage({ token }: Props) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [longitud, setLongitud] = useState('');
  const [pago1, setPago1] = useState('0');
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    getJson<Producto[]>('/api/productos', token).then(setProductos).catch(() => setProductos([]));
  }, []);

  const productoSeleccionado = useMemo(
    () => productos.find((p) => p.id === Number(productoId)) ?? null,
    [productoId, productos]
  );

  const subtotal = useMemo(() => {
    if (!productoSeleccionado) {
      return 0;
    }

    const cant = Number(cantidad || 0);

    if (productoSeleccionado.categoria_tipo === 'FERRETERIA') {
      return cant * Number(productoSeleccionado.precio_con_iva ?? 0);
    }

    const largo = Number(longitud || 0);
    return cant * Number(productoSeleccionado.precio_por_metro ?? 0) * largo;
  }, [productoSeleccionado, cantidad, longitud]);

  const saldoPendiente = useMemo(() => {
    const pago = Number(pago1 || 0);
    const saldo = subtotal - pago;
    return saldo > 0 ? saldo : 0;
  }, [subtotal, pago1]);

  const mensajeCorte = useMemo(() => {
    if (!productoSeleccionado || productoSeleccionado.categoria_tipo !== 'CORRALON') {
      return null;
    }

    const estandar = Number(productoSeleccionado.longitud_metros ?? 0);
    const largo = Number(longitud || 0);

    if (largo > 0 && estandar > 0 && largo < estandar) {
      return `Corte requerido: ${cantidad} barras se cortarán de ${estandar} m a ${largo} m`;
    }

    return null;
  }, [productoSeleccionado, longitud, cantidad]);

  async function confirmarCompra(event: FormEvent) {
    event.preventDefault();

    if (!productoSeleccionado) {
      return;
    }

    const payload = {
      cliente_id: 1,
      precio_modo: 'CON_IVA',
      items: [
        {
          producto_id: productoSeleccionado.id,
          cantidad: Number(cantidad),
          ...(productoSeleccionado.categoria_tipo === 'CORRALON' ? { longitud_metros: Number(longitud) } : {})
        }
      ],
      pagos: [
        {
          medio: 'EFECTIVO',
          monto: Number(pago1)
        }
      ]
    };

    const resp = await postJson<{ id: number; saldo_pendiente: number }>('/api/compras', payload, token);
    setMensaje(`Compra #${resp.id} registrada.`);
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-2">
      <form className="bg-white border rounded-lg p-4 space-y-3" onSubmit={confirmarCompra}>
        <h2 className="text-xl font-semibold">Nueva compra</h2>

        <label className="block text-sm text-slate-700">
          Producto
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={productoId}
            onChange={(e) => {
              setProductoId(e.target.value);
              setLongitud('');
            }}
          >
            <option value="">Seleccionar producto</option>
            {productos.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.nombre}
              </option>
            ))}
          </select>
        </label>

        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Cantidad"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />

        {productoSeleccionado?.categoria_tipo === 'CORRALON' ? (
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Longitud por barra (m)"
            value={longitud}
            onChange={(e) => setLongitud(e.target.value)}
          />
        ) : null}

        {mensajeCorte ? <p className="text-sm text-amber-700">{mensajeCorte}</p> : null}

        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Pago 1"
          value={pago1}
          onChange={(e) => setPago1(e.target.value)}
        />

        <p className="text-sm text-slate-700">Total con IVA: ${moneda(subtotal)}</p>
        <p className="text-sm text-slate-700">Saldo pendiente: ${moneda(saldoPendiente)}</p>

        {mensaje ? <p className="text-sm text-emerald-700">{mensaje}</p> : null}

        <button type="submit" className="rounded-md bg-slate-900 text-white px-3 py-2">
          Confirmar compra
        </button>
      </form>
    </section>
  );
}
