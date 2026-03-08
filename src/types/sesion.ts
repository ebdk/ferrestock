export type RolUsuario = 'ADMIN' | 'EMPLEADO' | 'REPARTIDOR';

export type UsuarioSesion = {
  id: number;
  nombre: string;
  rol: RolUsuario;
  requiere_cambio_clave: boolean;
};
