import bcrypt from 'bcryptjs';
import { PrismaClient, rol_usuario } from '@prisma/client';

const prisma = new PrismaClient();

async function seed(): Promise<void> {
  const emailAdmin = 'admin';
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.usuarios.upsert({
    where: { email: emailAdmin },
    update: {
      nombre: 'Administrador',
      password_hash: passwordHash,
      rol: rol_usuario.ADMIN,
      activo: true,
      requiere_cambio_clave: true
    },
    create: {
      nombre: 'Administrador',
      email: emailAdmin,
      password_hash: passwordHash,
      rol: rol_usuario.ADMIN,
      activo: true,
      requiere_cambio_clave: true
    }
  });
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
