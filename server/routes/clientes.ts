import { Router } from 'express';
import { z } from 'zod';
import { requerirRol, requerirSesion } from '../middleware/autorizacion';
import { prisma } from '../utils/prisma';

const router = Router();

const schemaCliente = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  direccion: z.string().min(1, 'La dirección es obligatoria.'),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  telefonos: z.array(z.string().min(1)).min(1, 'Ingresá al menos un teléfono.'),
  notas: z.string().nullable().optional(),
  activo: z.boolean().default(true)
});

router.use(requerirSesion, requerirRol(['ADMIN', 'EMPLEADO']));

router.get('/', async (req, res) => {
  const busqueda = String(req.query.busqueda ?? '').trim();

  const where = busqueda
    ? {
        OR: [
          { nombre: { contains: busqueda, mode: 'insensitive' as const } },
          { direccion: { contains: busqueda, mode: 'insensitive' as const } },
          { telefonos: { hasSome: [busqueda] } }
        ]
      }
    : {};

  const data = await prisma.clientes.findMany({
    where,
    orderBy: { nombre: 'asc' }
  });

  res.json(data);
});

router.get('/:id/historial-compras', async (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ mensaje: 'ID de cliente inválido.' });
    return;
  }

  const compras = await prisma.compras.findMany({
    where: { cliente_id: id },
    orderBy: { fecha: 'desc' },
    take: 50
  });

  res.json(compras);
});

router.post('/', async (req, res) => {
  const parsed = schemaCliente.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ mensaje: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
    return;
  }

  const data = await prisma.clientes.create({
    data: {
      nombre: parsed.data.nombre,
      direccion: parsed.data.direccion,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
      telefonos: parsed.data.telefonos,
      notas: parsed.data.notas ?? null,
      activo: parsed.data.activo
    }
  });

  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ mensaje: 'ID de cliente inválido.' });
    return;
  }

  const parsed = schemaCliente.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ mensaje: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
    return;
  }

  const data = await prisma.clientes.update({
    where: { id },
    data: {
      nombre: parsed.data.nombre,
      direccion: parsed.data.direccion,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
      telefonos: parsed.data.telefonos,
      notas: parsed.data.notas ?? null,
      activo: parsed.data.activo
    }
  });

  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ mensaje: 'ID de cliente inválido.' });
    return;
  }

  await prisma.clientes.delete({ where: { id } });
  res.json({ mensaje: 'Cliente eliminado correctamente.' });
});

export { router as rutasClientes };
