import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { requerirSesion } from '../middleware/autorizacion';
import { firmarToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';

const router = Router();

const schemaLogin = z.object({
  usuario: z.string().min(1, 'El usuario es obligatorio.'),
  password: z.string().min(1, 'La contraseña es obligatoria.')
});

const schemaCambioClave = z.object({
  nueva_clave: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.')
});

router.post('/iniciar-sesion', async (req, res) => {
  const parsed = schemaLogin.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ mensaje: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
    return;
  }

  try {
    const usuario = await prisma.usuarios.findUnique({ where: { email: parsed.data.usuario } });

    if (!usuario || !usuario.activo) {
      res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' });
      return;
    }

    const ok = await bcrypt.compare(parsed.data.password, usuario.password_hash);

    if (!ok) {
      res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' });
      return;
    }

    const token = firmarToken({
      usuario_id: usuario.id,
      rol: usuario.rol,
      nombre: usuario.nombre
    });

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        requiere_cambio_clave: usuario.requiere_cambio_clave
      }
    });
  } catch {
    res.status(503).json({ mensaje: 'No se pudo conectar con la base de datos.' });
  }
});

router.post('/cambiar-clave', requerirSesion, async (req, res) => {
  const parsed = schemaCambioClave.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ mensaje: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
    return;
  }

  const sesion = (req as { sesion?: { usuario_id: number } }).sesion;

  if (!sesion) {
    res.status(401).json({ mensaje: 'Sesión inválida o vencida.' });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.nueva_clave, 10);

  await prisma.usuarios.update({
    where: { id: sesion.usuario_id },
    data: {
      password_hash: passwordHash,
      requiere_cambio_clave: false
    }
  });

  res.json({ mensaje: 'Contraseña actualizada correctamente.' });
});

export { router as rutasAutenticacion };
