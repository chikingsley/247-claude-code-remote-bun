import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

// Better Auth will create these tables automatically:
// - user
// - session
// - account
// - verification

// Custom tables for 247 provisioning

/**
 * Fly.io tokens for BYOC (Bring Your Own Cloud)
 * Stores encrypted Fly.io Personal Access Tokens
 */
export const flyTokens = pgTable('fly_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  accessToken: text('access_token').notNull(), // Encrypted with AES-256-GCM
  orgId: text('org_id').notNull(),
  orgName: text('org_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Cloud agents deployed to user's Fly.io org
 */
export const agents = pgTable('agents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  flyAppName: text('fly_app_name').notNull(),
  flyMachineId: text('fly_machine_id'),
  flyVolumeId: text('fly_volume_id'),
  hostname: text('hostname').notNull(),
  region: text('region').default('sjc'),
  status: text('status').default('pending').notNull(), // pending, deploying, running, stopped, error
  errorMessage: text('error_message'),
  // Claude API key is stored in Fly.io secrets, not here
  claudeApiKeySet: boolean('claude_api_key_set').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports
export type FlyToken = typeof flyTokens.$inferSelect;
export type NewFlyToken = typeof flyTokens.$inferInsert;

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
