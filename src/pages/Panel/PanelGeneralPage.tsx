import { useState } from 'react';
import { ClientesPage } from '../Clientes/ClientesPage';
import { ProductosPage } from '../Productos/ProductosPage';
import { StockPage } from '../Stock/StockPage';
import { ComprasPage } from '../Compras/ComprasPage';

type Props = {
  nombre: string;
  rol: 'ADMIN' | 'EMPLEADO';
  token: string;
};

export function PanelGeneralPage({ nombre, rol, token }: Props) {
  const [moduloActivo, setModuloActivo] = useState<'clientes' | 'productos' | 'stock' | 'compras'>('clientes');

  return (
    <main className="min-h-screen p-6 bg-white">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Panel principal</h1>
          <p className="text-slate-700 mt-2">Usuario: {nombre}</p>
          <p className="text-slate-700">Rol: {rol}</p>
        </div>
      </header>

      <nav className="mt-6 flex gap-2">
        <button onClick={() => setModuloActivo('clientes')} className={`px-3 py-2 rounded-md ${moduloActivo === 'clientes' ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>Clientes</button>
        <button onClick={() => setModuloActivo('productos')} className={`px-3 py-2 rounded-md ${moduloActivo === 'productos' ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>Productos</button>
        <button onClick={() => setModuloActivo('stock')} className={`px-3 py-2 rounded-md ${moduloActivo === 'stock' ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>Stock</button>
        <button onClick={() => setModuloActivo('compras')} className={`px-3 py-2 rounded-md ${moduloActivo === 'compras' ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>Compras</button>
      </nav>

      {moduloActivo === 'clientes' ? <ClientesPage token={token} /> : null}
      {moduloActivo === 'productos' ? <ProductosPage token={token} rol={rol} /> : null}
      {moduloActivo === 'stock' ? <StockPage token={token} /> : null}
      {moduloActivo === 'compras' ? <ComprasPage token={token} /> : null}
    </main>
  );
}
