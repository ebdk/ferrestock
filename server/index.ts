import express from 'express';
import { rutasAutenticacion } from './routes/autenticacion';
import { rutasClientes } from './routes/clientes';

const app = express();
const puerto = Number(process.env.SERVER_PORT ?? 4000);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/autenticacion', rutasAutenticacion);
app.use('/api/clientes', rutasClientes);

app.listen(puerto, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor interno escuchando en puerto ${puerto}`);
});
