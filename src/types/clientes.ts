export type Cliente = {
  id: number;
  nombre: string;
  direccion: string;
  lat: string | null;
  lng: string | null;
  telefonos: string[];
  notas: string | null;
  activo: boolean;
  created_at: string;
};

export type CompraHistorial = {
  id: number;
  fecha: string;
  total_con_iva: string;
};
