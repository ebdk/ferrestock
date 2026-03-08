import { crearApp } from './app';

const puerto = Number(process.env.SERVER_PORT ?? 4000);
const app = crearApp();

app.listen(puerto, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor interno escuchando en puerto ${puerto}`);
});
