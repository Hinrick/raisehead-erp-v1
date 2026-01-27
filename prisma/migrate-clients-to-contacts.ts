/**
 * Data Migration Script: Client → Contact
 *
 * This script migrates data from the old Client model to the new Contact model.
 * Run this AFTER applying the schema migration that adds Contact model
 * but BEFORE removing the Client model.
 *
 * Usage: npx tsx prisma/migrate-clients-to-contacts.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Client → Contact migration...\n');

  // Step 1: Create "client" tag if it doesn't exist
  const clientTag = await prisma.tag.upsert({
    where: { name: 'client' },
    update: {},
    create: { name: 'client', color: '#6D28D9' },
  });
  console.log(`Tag "client" ready (id: ${clientTag.id})`);

  // Step 2: Read all existing quotations to get clientId → contactId mapping
  // Since Client model is removed, we'll work with raw queries if needed.
  // However, if this runs BEFORE removing Client, we can use Prisma.

  // For safety, use raw SQL to read from old client table
  const clients = await prisma.$queryRaw<Array<{
    id: string;
    companyName: string;
    taxId: string | null;
    contactName: string;
    email: string | null;
    address: string | null;
    phone: string | null;
  }>>`SELECT id, "companyName", "taxId", "contactName", email, address, phone FROM "Client"`;

  console.log(`Found ${clients.length} clients to migrate\n`);

  for (const client of clients) {
    console.log(`Migrating: ${client.companyName}`);

    // Step 3: Create COMPANY contact from each Client
    const companyContact = await prisma.contact.upsert({
      where: { id: client.id }, // Reuse the same ID for compatibility
      update: {},
      create: {
        id: client.id,
        type: 'COMPANY',
        displayName: client.companyName,
        taxId: client.taxId,
        email: client.email,
        address: client.address,
        phone: client.phone,
      },
    });

    // Step 4: Create PERSON contact from contactName (linked to company)
    if (client.contactName && client.contactName.trim()) {
      await prisma.contact.create({
        data: {
          type: 'PERSON',
          displayName: client.contactName,
          email: client.email, // Copy email to person too
          phone: client.phone, // Copy phone to person too
          companyId: companyContact.id,
        },
      });
      console.log(`  → Created person: ${client.contactName}`);
    }

    // Step 5: Tag the company contact as "client"
    await prisma.contactTag.upsert({
      where: {
        contactId_tagId: {
          contactId: companyContact.id,
          tagId: clientTag.id,
        },
      },
      update: {},
      create: {
        contactId: companyContact.id,
        tagId: clientTag.id,
      },
    });

    console.log(`  → Tagged as "client"`);
  }

  // Step 6: Migrate Quotation.clientId → Quotation.contactId
  // Since we reused the same IDs, we can do a direct SQL UPDATE
  const quotationResult = await prisma.$executeRaw`
    UPDATE "Quotation" SET "contactId" = "clientId" WHERE "contactId" IS NULL AND "clientId" IS NOT NULL
  `;
  console.log(`\nMigrated ${quotationResult} quotation(s) from clientId to contactId`);

  console.log('\nMigration completed successfully!');
  console.log('Next steps:');
  console.log('  1. Make contactId non-nullable in schema');
  console.log('  2. Remove clientId column and Client model');
  console.log('  3. Run prisma migrate deploy');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
