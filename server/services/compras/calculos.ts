type LineaFerreteria = {
  categoria_tipo: 'FERRETERIA';
  cantidad: number;
  precio_unitario: number;
};

type LineaCorralon = {
  categoria_tipo: 'CORRALON';
  cantidad: number;
  precio_por_metro: number;
  longitud_metros: number;
  longitud_estandar: number;
};

type LineaCompraInput = LineaFerreteria | LineaCorralon;

type LineaCompraOutput = {
  subtotal: number;
  es_corte: boolean;
  mensaje_corte?: string;
};

export function calcularLineaCompra(linea: LineaCompraInput): LineaCompraOutput {
  if (linea.categoria_tipo === 'FERRETERIA') {
    return {
      subtotal: linea.cantidad * linea.precio_unitario,
      es_corte: false
    };
  }

  const subtotal = linea.cantidad * linea.precio_por_metro * linea.longitud_metros;
  const esCorte = linea.longitud_metros < linea.longitud_estandar;

  return {
    subtotal,
    es_corte: esCorte,
    mensaje_corte: esCorte
      ? `Corte requerido: ${linea.cantidad} barras se cortarán de ${linea.longitud_estandar} m a ${linea.longitud_metros} m`
      : undefined
  };
}

export function calcularSaldoPendiente(input: { total: number; pagos: number[] }): number {
  const totalPagado = input.pagos.reduce((acc, pago) => acc + pago, 0);
  const saldo = input.total - totalPagado;

  return saldo > 0 ? saldo : 0;
}
