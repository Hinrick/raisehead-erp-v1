/**
 * One-time data migration script.
 * For each existing Contact with email/phone/address scalar values,
 * creates corresponding ContactEmail/ContactPhone/ContactAddress
 * with primary: true, label: "work".
 *
 * Run after `prisma db push`:
 *   npx tsx prisma/migrate-contact-fields.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const contacts = await prisma.contact.findMany({
    select: { id: true, email: true, phone: true, address: true },
  });

  let emailCount = 0;
  let phoneCount = 0;
  let addressCount = 0;

  for (const contact of contacts) {
    if (contact.email) {
      const exists = await prisma.contactEmail.findFirst({
        where: { contactId: contact.id, value: contact.email },
      });
      if (!exists) {
        await prisma.contactEmail.create({
          data: {
            contactId: contact.id,
            value: contact.email,
            label: 'work',
            primary: true,
          },
        });
        emailCount++;
      }
    }

    if (contact.phone) {
      const exists = await prisma.contactPhone.findFirst({
        where: { contactId: contact.id, value: contact.phone },
      });
      if (!exists) {
        await prisma.contactPhone.create({
          data: {
            contactId: contact.id,
            value: contact.phone,
            label: 'work',
            primary: true,
          },
        });
        phoneCount++;
      }
    }

    if (contact.address) {
      const exists = await prisma.contactAddress.findFirst({
        where: { contactId: contact.id, formattedValue: contact.address },
      });
      if (!exists) {
        await prisma.contactAddress.create({
          data: {
            contactId: contact.id,
            label: 'work',
            primary: true,
            formattedValue: contact.address,
          },
        });
        addressCount++;
      }
    }
  }

  console.log(`Migration complete.`);
  console.log(`  Contacts processed: ${contacts.length}`);
  console.log(`  Emails created: ${emailCount}`);
  console.log(`  Phones created: ${phoneCount}`);
  console.log(`  Addresses created: ${addressCount}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
