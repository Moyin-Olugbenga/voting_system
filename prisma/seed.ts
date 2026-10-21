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

  // 1. Seed Default Admin
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

  // 2. Seed Multiple Hardware Voting Terminals (At least 4 devices)
  const devicesToSeed = [
    {
      id: 'device-esp32-01',
      name: 'Main Hall Voting Terminal',
      deviceKey: 'secret-device-key-123',
    },
    {
      id: 'device-esp32-02',
      name: 'Engineering Lecture Theater Terminal',
      deviceKey: 'secret-device-key-456',
    },
    {
      id: 'device-esp32-03',
      name: 'Student Center Terminal',
      deviceKey: 'secret-device-key-789',
    },
    {
      id: 'device-esp32-04',
      name: 'Senate Building Terminal',
      deviceKey: 'secret-device-key-999',
    },
  ];

  for (const deviceData of devicesToSeed) {
    const device = await prisma.device.upsert({
      where: { id: deviceData.id },
      update: {
        name: deviceData.name,
        deviceKey: deviceData.deviceKey,
      },
      create: {
        id: deviceData.id,
        name: deviceData.name,
        deviceKey: deviceData.deviceKey,
        isActive: true,
      },
    });
    console.log(`Seeded Terminal: [${device.id}] ${device.name} (Key: ${device.deviceKey})`);
  }

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