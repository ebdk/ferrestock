import type { NextFunction, Request, Response } from 'express';
import { verificarToken } from '../utils/jwt';

type RequestConSesion = Request & {
  sesion?: {
    usuario_id: number;
    rol: 'ADMIN' | 'EMPLEADO' | 'REPARTIDOR';
    nombre: string;
  };
};

export function requerirSesion(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;

  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ mensaje: 'Sesión inválida o vencida.' });
    return;
  }

  try {
    const token = auth.slice('Bearer '.length);
    const payload = verificarToken(token);
    (req as RequestConSesion).sesion = payload;
    next();
  } catch {
    res.status(401).json({ mensaje: 'Sesión inválida o vencida.' });
  }
}

export function requerirRol(roles: Array<'ADMIN' | 'EMPLEADO' | 'REPARTIDOR'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const sesion = (req as RequestConSesion).sesion;

    if (!sesion || !roles.includes(sesion.rol)) {
      res.status(403).json({ mensaje: 'No tenés permisos para realizar esta acción.' });
      return;
    }

    next();
  };
}
