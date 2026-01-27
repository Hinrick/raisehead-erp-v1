import type { Contact, ExternalContactLink } from '@prisma/client';

export interface ConflictResolutionResult {
  action: 'PUSH_LOCAL' | 'PULL_EXTERNAL' | 'NO_ACTION';
  reason: string;
}

/**
 * Last-write-wins conflict resolution.
 * Compares local updatedAt, external lastModified, and link lastSyncedAt
 * to determine which direction data should flow.
 */
export function resolveConflict(
  localContact: Contact,
  externalLastModified: Date | null,
  link: ExternalContactLink,
): ConflictResolutionResult {
  const localUpdatedAt = localContact.updatedAt;
  const lastSynced = link.lastSyncedAt;

  const localChanged = !lastSynced || localUpdatedAt > lastSynced;
  const externalChanged = !lastSynced || (externalLastModified && externalLastModified > lastSynced);

  if (localChanged && !externalChanged) {
    return { action: 'PUSH_LOCAL', reason: 'Only local changed since last sync' };
  }

  if (!localChanged && externalChanged) {
    return { action: 'PULL_EXTERNAL', reason: 'Only external changed since last sync' };
  }

  if (localChanged && externalChanged) {
    // Both changed — last-write-wins
    if (externalLastModified && externalLastModified > localUpdatedAt) {
      return { action: 'PULL_EXTERNAL', reason: 'Both changed, external is newer (last-write-wins)' };
    }
    return { action: 'PUSH_LOCAL', reason: 'Both changed, local is newer (last-write-wins)' };
  }

  return { action: 'NO_ACTION', reason: 'No changes since last sync' };
}
