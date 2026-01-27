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

  // Create default tags
  const defaultTags = [
    { name: 'client', color: '#6D28D9' },
    { name: 'supplier', color: '#059669' },
    { name: 'partner', color: '#D97706' },
    { name: 'prospect', color: '#2563EB' },
  ];

  for (const tag of defaultTags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }

  console.log('Created default tags:', defaultTags.map((t) => t.name).join(', '));

  // Create sample company contact
  const sampleCompany = await prisma.contact.upsert({
    where: { id: 'sample-company-1' },
    update: {},
    create: {
      id: 'sample-company-1',
      type: 'COMPANY',
      displayName: '範例科技股份有限公司',
      taxId: '12345678',
      email: 'contact@example.com',
      address: '台北市信義區信義路五段7號',
      phone: '02-1234-5678',
    },
  });

  console.log('Created sample company:', sampleCompany.displayName);

  // Create sample person contact linked to company
  const samplePerson = await prisma.contact.upsert({
    where: { id: 'sample-person-1' },
    update: {},
    create: {
      id: 'sample-person-1',
      type: 'PERSON',
      displayName: '王小明',
      firstName: '小明',
      lastName: '王',
      email: 'wang@example.com',
      phone: '0912-345-678',
      jobTitle: '專案經理',
      companyId: sampleCompany.id,
    },
  });

  console.log('Created sample person:', samplePerson.displayName);

  // Tag the company as 'client'
  const clientTag = await prisma.tag.findUnique({ where: { name: 'client' } });
  if (clientTag) {
    await prisma.contactTag.upsert({
      where: {
        contactId_tagId: {
          contactId: sampleCompany.id,
          tagId: clientTag.id,
        },
      },
      update: {},
      create: {
        contactId: sampleCompany.id,
        tagId: clientTag.id,
      },
    });
  }

  // Create empty integration configs
  const providers = ['GOOGLE', 'OUTLOOK', 'NOTION'] as const;
  for (const provider of providers) {
    await prisma.integrationConfig.upsert({
      where: { provider },
      update: {},
      create: {
        provider,
        enabled: false,
        config: {},
      },
    });
  }

  console.log('Created integration configs for:', providers.join(', '));

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
