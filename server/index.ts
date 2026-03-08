import express from 'express';

const app = express();
const puerto = Number(process.env.SERVER_PORT ?? 4000);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(puerto, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor interno escuchando en puerto ${puerto}`);
});
