import express from 'express';
import { rutasAutenticacion } from './routes/autenticacion';
import { rutasClientes } from './routes/clientes';
import { rutasProductos } from './routes/productos';
import { rutasStock } from './routes/stock';
import { rutasCompras } from './routes/compras';

export function crearApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/autenticacion', rutasAutenticacion);
  app.use('/api/clientes', rutasClientes);
  app.use('/api/productos', rutasProductos);
  app.use('/api/stock', rutasStock);
  app.use('/api/compras', rutasCompras);

  return app;
}
