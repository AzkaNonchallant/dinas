import app from './app';
import { env } from './config/.env';
import { prisma } from './config/database';

const server = app.listen(env.PORT, () => {
  console.log(`Server berjalan di http://localhost:${env.PORT} [${env.NODE_ENV}]`);
});

prisma.$connect().catch((err) => {
  console.error('Gagal terhubung ke database:', err);
  process.exit(1);
});

function shutdown(signal: string) {
  console.log(`\n${signal} diterima, menutup server...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
