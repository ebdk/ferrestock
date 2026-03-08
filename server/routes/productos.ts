import { Router } from 'express';
import { z } from 'zod';
import { requerirRol, requerirSesion } from '../middleware/autorizacion';
import { prisma } from '../utils/prisma';

const router = Router();
const db = prisma as any;

const schemaProducto = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  codigo: z.string().min(1, 'El código es obligatorio.'),
  categoria_tipo: z.enum(['FERRETERIA', 'CORRALON']),
  unidad_venta: z.string().min(1, 'La unidad de venta es obligatoria.'),
  precio_sin_iva: z.number(),
  precio_con_iva: z.number(),
  stock_actual: z.number(),
  stock_minimo: z.number(),
  densidad_pulgadas: z.string().nullable().optional(),
  longitud_metros: z.number().nullable().optional(),
  precio_por_metro: z.number().nullable().optional(),
  activo: z.boolean().default(true)
});

router.get('/', requerirSesion, requerirRol(['ADMIN', 'EMPLEADO']), async (req, res) => {
  const busqueda = String(req.query.busqueda ?? '').trim();
  const categoria = String(req.query.categoria ?? '').trim();

  const where: Record<string, unknown> = {};

  if (busqueda) {
    where.OR = [
      { nombre: { contains: busqueda, mode: 'insensitive' } },
      { codigo: { contains: busqueda, mode: 'insensitive' } }
    ];
  }

  if (categoria === 'FERRETERIA' || categoria === 'CORRALON') {
    where.categoria_tipo = categoria;
  }

  const data = await db.productos.findMany({ where, orderBy: { nombre: 'asc' } });
  res.json(data);
});

router.post('/', requerirSesion, requerirRol(['ADMIN']), async (req, res) => {
  const parsed = schemaProducto.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ mensaje: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
    return;
  }

  const data = await db.productos.create({ data: parsed.data });
  res.status(201).json(data);
});

router.put('/:id', requerirSesion, requerirRol(['ADMIN']), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ mensaje: 'ID de producto inválido.' });
    return;
  }

  const parsed = schemaProducto.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ mensaje: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
    return;
  }

  const data = await db.productos.update({ where: { id }, data: parsed.data });
  res.json(data);
});

router.delete('/:id', requerirSesion, requerirRol(['ADMIN']), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ mensaje: 'ID de producto inválido.' });
    return;
  }

  await db.productos.delete({ where: { id } });
  res.json({ mensaje: 'Producto eliminado correctamente.' });
});

export { router as rutasProductos };
