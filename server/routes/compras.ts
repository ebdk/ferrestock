import { Router } from 'express';
import { z } from 'zod';
import { requerirRol, requerirSesion } from '../middleware/autorizacion';
import { prisma } from '../utils/prisma';
import { calcularLineaCompra, calcularSaldoPendiente } from '../services/compras/calculos';

const router = Router();
const db = prisma as any;

const schemaCompra = z.object({
  cliente_id: z.number(),
  precio_modo: z.enum(['CON_IVA', 'SIN_IVA']),
  items: z.array(
    z.object({
      producto_id: z.number(),
      cantidad: z.number().min(1),
      longitud_metros: z.number().optional()
    })
  ),
  pagos: z.array(
    z.object({
      medio: z.string(),
      monto: z.number().min(0)
    })
  )
});

router.post('/', requerirSesion, requerirRol(['ADMIN', 'EMPLEADO']), async (req, res) => {
  const parsed = schemaCompra.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ mensaje: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
    return;
  }

  const sesion = (req as { sesion?: { usuario_id: number } }).sesion;

  if (!sesion) {
    res.status(401).json({ mensaje: 'Sesión inválida o vencida.' });
    return;
  }

  const horaInicio = new Date().toISOString();
  let totalConIva = 0;
  let totalSinIva = 0;
  const itemsPersistencia: Array<Record<string, unknown>> = [];

  for (const item of parsed.data.items) {
    const producto = await db.productos.findUnique({ where: { id: item.producto_id } });

    if (!producto) {
      res.status(404).json({ mensaje: `Producto ${item.producto_id} no encontrado.` });
      return;
    }

    const categoria = producto.categoria_tipo as 'FERRETERIA' | 'CORRALON';
    const precioSinIva = Number(producto.precio_sin_iva);
    const precioConIva = Number(producto.precio_con_iva);

    const calculo = categoria === 'FERRETERIA'
      ? calcularLineaCompra({
          categoria_tipo: 'FERRETERIA',
          cantidad: item.cantidad,
          precio_unitario: parsed.data.precio_modo === 'CON_IVA' ? precioConIva : precioSinIva
        })
      : calcularLineaCompra({
          categoria_tipo: 'CORRALON',
          cantidad: item.cantidad,
          precio_por_metro: Number(producto.precio_por_metro ?? 0),
          longitud_metros: item.longitud_metros ?? Number(producto.longitud_metros ?? 0),
          longitud_estandar: Number(producto.longitud_metros ?? 0)
        });

    if (parsed.data.precio_modo === 'CON_IVA') {
      totalConIva += calculo.subtotal;
      totalSinIva += calculo.subtotal / 1.21;
    } else {
      totalSinIva += calculo.subtotal;
      totalConIva += calculo.subtotal * 1.21;
    }

    itemsPersistencia.push({
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      longitud_metros: item.longitud_metros ?? null,
      es_corte: calculo.es_corte,
      precio_unitario: parsed.data.precio_modo === 'CON_IVA' ? precioConIva : precioSinIva,
      subtotal: calculo.subtotal
    });

    const nuevoStock = Number(producto.stock_actual) - item.cantidad;
    await db.productos.update({
      where: { id: item.producto_id },
      data: { stock_actual: nuevoStock }
    });
  }

  const saldoPendiente = calcularSaldoPendiente({
    total: totalConIva,
    pagos: parsed.data.pagos.map((p) => p.monto)
  });

  const compra = await db.compras.create({
    data: {
      cliente_id: parsed.data.cliente_id,
      fecha: new Date(),
      hora_inicio: horaInicio,
      atendido_por_id: sesion.usuario_id,
      total_sin_iva: totalSinIva,
      total_con_iva: totalConIva,
      saldo_pendiente: saldoPendiente,
      estado: saldoPendiente > 0 ? 'PARCIAL' : 'PAGADA',
      requiere_envio: false
    }
  });

  await db.compra_items.createMany({
    data: itemsPersistencia.map((item) => ({
      ...item,
      compra_id: compra.id
    }))
  });

  await db.pagos.createMany({
    data: parsed.data.pagos.map((pago) => ({
      compra_id: compra.id,
      medio: pago.medio,
      monto: pago.monto
    }))
  });

  res.status(201).json({
    id: compra.id,
    hora_inicio: horaInicio,
    total_con_iva: totalConIva,
    total_sin_iva: totalSinIva,
    saldo_pendiente: saldoPendiente
  });
});

export { router as rutasCompras };
