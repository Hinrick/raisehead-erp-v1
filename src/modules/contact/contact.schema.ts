import { z } from 'zod';

export const contactEmailSchema = z.object({
  value: z.string().email(),
  label: z.string().default('work'),
  primary: z.boolean().default(false),
});

export const contactPhoneSchema = z.object({
  value: z.string().min(1),
  label: z.string().default('work'),
  primary: z.boolean().default(false),
});

export const contactAddressSchema = z.object({
  label: z.string().default('work'),
  primary: z.boolean().default(false),
  formattedValue: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
});

export const createContactSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  middleName: z.string().optional(),
  namePrefix: z.string().optional(),
  nameSuffix: z.string().optional(),
  nickname: z.string().optional(),
  birthday: z.string().datetime().optional().or(z.literal('')),
  gender: z.string().optional(),
  taxId: z.string().optional(),
  emails: z.array(contactEmailSchema).optional(),
  phones: z.array(contactPhoneSchema).optional(),
  addresses: z.array(contactAddressSchema).optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const contactIdSchema = z.object({
  id: z.string().uuid('Invalid contact ID'),
});

export const contactTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()).min(1, 'At least one tag ID is required'),
});

export const tagIdParamSchema = z.object({
  id: z.string().uuid('Invalid contact ID'),
  tagId: z.string().uuid('Invalid tag ID'),
});

export const contactSearchSchema = z.object({
  q: z.string().optional(),
  tagId: z.string().uuid().optional(),
});

export const contactCompanySchema = z.object({
  companyId: z.string().uuid('Invalid company ID'),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
});

export const contactCompanyParamSchema = z.object({
  id: z.string().uuid('Invalid contact ID'),
  companyId: z.string().uuid('Invalid company ID'),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
