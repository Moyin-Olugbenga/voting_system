// prisma/seed.ts
import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('admin-password', 10);
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: { passwordHash: hashedPassword },
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`Default admin seeded: ${admin.username} / admin-password`);

  const device = await prisma.device.upsert({
    where: { id: 'device-esp32-01' },
    update: {},
    create: {
      id: 'device-esp32-01',
      name: 'Wokwi Simulator Terminal',
      deviceKey: 'secret-device-key-123',
      isActive: true,
    },
  });
  console.log(`Test device seeded: ${device.id} (${device.name})`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });