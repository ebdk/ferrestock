import { Router } from 'express';
import { z } from 'zod';
import { requerirRol, requerirSesion } from '../middleware/autorizacion';
import { prisma } from '../utils/prisma';

const router = Router();
const db = prisma as any;

const schemaAjuste = z.object({
  producto_id: z.number(),
  cantidad: z.number(),
  motivo: z.string().min(1, 'El motivo es obligatorio.')
});

router.get('/inventario', requerirSesion, requerirRol(['ADMIN', 'EMPLEADO']), async (_req, res) => {
  const data = await db.productos.findMany({ orderBy: { nombre: 'asc' } });
  res.json(data);
});

router.post('/ajuste', requerirSesion, requerirRol(['ADMIN', 'EMPLEADO']), async (req, res) => {
  const parsed = schemaAjuste.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ mensaje: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
    return;
  }

  const producto = await db.productos.findUnique({ where: { id: parsed.data.producto_id } });

  if (!producto) {
    res.status(404).json({ mensaje: 'Producto no encontrado.' });
    return;
  }

  const stockActual = Number(producto.stock_actual);
  const nuevoStock = stockActual + parsed.data.cantidad;

  await db.productos.update({
    where: { id: parsed.data.producto_id },
    data: { stock_actual: nuevoStock }
  });

  await db.stock_movimientos.create({
    data: {
      producto_id: parsed.data.producto_id,
      tipo: 'AJUSTE',
      cantidad: parsed.data.cantidad,
      motivo: parsed.data.motivo,
      created_by: 0
    }
  });

  res.json({ mensaje: 'Ajuste de stock registrado correctamente.' });
});

router.get('/exportar.csv', requerirSesion, requerirRol(['ADMIN', 'EMPLEADO']), async (_req, res) => {
  const productos = await db.productos.findMany({ orderBy: { nombre: 'asc' } });
  const encabezado = 'nombre,codigo,stock_actual,stock_minimo';
  const lineas = productos.map((p: any) => `${p.nombre},${p.codigo},${p.stock_actual},${p.stock_minimo}`);
  const csv = [encabezado, ...lineas].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="stock.csv"');
  res.send(csv);
});

export { router as rutasStock };
