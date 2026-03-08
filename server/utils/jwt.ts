import jwt from 'jsonwebtoken';

export type PayloadSesion = {
  usuario_id: number;
  rol: 'ADMIN' | 'EMPLEADO' | 'REPARTIDOR';
  nombre: string;
};

const secreto = process.env.JWT_SECRETO ?? 'ferrestock_jwt_local';

export function firmarToken(payload: PayloadSesion): string {
  return jwt.sign(payload, secreto, { expiresIn: '12h' });
}

export function verificarToken(token: string): PayloadSesion {
  return jwt.verify(token, secreto) as PayloadSesion;
}
