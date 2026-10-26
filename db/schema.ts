import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const members = sqliteTable('members', {
    ownerId: text('owner_id').primaryKey(), id: text('id').notNull().unique(), nickname: text('nickname').notNull(), profileId: text('profile_id').notNull(), familyId: text('family_id').notNull(), contactsJson: text('contacts_json').notNull(), consentVersion: text('consent_version').notNull(), adultConfirmed: integer('adult_confirmed').notNull(), mode: integer('mode').notNull(), createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(), expiresAt: integer('expires_at').notNull()
});
export const accessLimits = sqliteTable('access_limits', { key: text('key').primaryKey(), hits: integer('hits').notNull(), windowEnd: integer('window_end').notNull() });
