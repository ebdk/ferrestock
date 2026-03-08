type Props = {
  nombre: string;
  rol: 'ADMIN' | 'EMPLEADO';
};

export function PanelGeneralPage({ nombre, rol }: Props) {
  return (
    <main className="min-h-screen p-6 bg-white">
      <h1 className="text-2xl font-semibold">Panel principal</h1>
      <p className="text-slate-700 mt-2">Usuario: {nombre}</p>
      <p className="text-slate-700">Rol: {rol}</p>
      <p className="text-slate-600 mt-4">Módulos en construcción.</p>
    </main>
  );
}
