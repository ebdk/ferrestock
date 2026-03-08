type Props = {
  nombre: string;
};

export function RepartidorPage({ nombre }: Props) {
  return (
    <main className="min-h-screen p-6 bg-slate-50">
      <h1 className="text-2xl font-semibold">Ruta del día</h1>
      <p className="text-slate-700 mt-2">Repartidor: {nombre}</p>
      <p className="text-slate-600 mt-4">Vista simplificada en construcción.</p>
    </main>
  );
}
