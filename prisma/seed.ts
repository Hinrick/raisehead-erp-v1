import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@raisehead.studio' },
    update: {},
    create: {
      email: 'admin@raisehead.studio',
      password: hashedPassword,
      name: '系統管理員',
      role: 'ADMIN',
    },
  });

  console.log('Created admin user:', adminUser.email);

  // Create sample client
  const sampleClient = await prisma.client.upsert({
    where: { id: 'sample-client-1' },
    update: {},
    create: {
      id: 'sample-client-1',
      companyName: '範例科技股份有限公司',
      taxId: '12345678',
      contactName: '王小明',
      email: 'contact@example.com',
      address: '台北市信義區信義路五段7號',
      phone: '02-1234-5678',
    },
  });

  console.log('Created sample client:', sampleClient.companyName);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
