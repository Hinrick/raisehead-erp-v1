import type { Contact } from '@prisma/client';

export interface ExternalContactData {
  displayName?: string;
  email?: string;
  phone?: string;
  address?: string;
  firstName?: string;
  lastName?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface FieldMapping {
  local: keyof Contact;
  external: string;
  transform?: (value: unknown) => unknown;
  reverseTransform?: (value: unknown) => unknown;
}

const DEFAULT_MAPPINGS: FieldMapping[] = [
  { local: 'displayName', external: 'displayName' },
  { local: 'email', external: 'email' },
  { local: 'phone', external: 'phone' },
  { local: 'address', external: 'address' },
  { local: 'firstName', external: 'firstName' },
  { local: 'lastName', external: 'lastName' },
  { local: 'notes', external: 'notes' },
];

export function mapContactToExternal(
  contact: Contact,
  customMappings?: FieldMapping[],
): ExternalContactData {
  const mappings = customMappings || DEFAULT_MAPPINGS;
  const result: ExternalContactData = {};

  for (const mapping of mappings) {
    const value = contact[mapping.local];
    if (value !== null && value !== undefined) {
      result[mapping.external] = mapping.transform
        ? mapping.transform(value)
        : value;
    }
  }

  return result;
}

export function mapExternalToContact(
  externalData: ExternalContactData,
  customMappings?: FieldMapping[],
): Partial<Contact> {
  const mappings = customMappings || DEFAULT_MAPPINGS;
  const result: Record<string, unknown> = {};

  for (const mapping of mappings) {
    const value = externalData[mapping.external];
    if (value !== null && value !== undefined) {
      result[mapping.local] = mapping.reverseTransform
        ? mapping.reverseTransform(value)
        : value;
    }
  }

  return result as Partial<Contact>;
}
