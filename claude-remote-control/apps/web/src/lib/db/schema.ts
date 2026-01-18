import { pgTable, text, timestamp, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

// Custom table for agent connections (in public schema)
// Auth tables (user, session, account) are managed by Neon Auth in neon_auth schema
export const agentConnection = pgTable(
  'agent_connection',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(), // References neon_auth.user.id
    url: text('url').notNull(),
    name: text('name').notNull(),
    method: text('method').notNull().default('tailscale'),
    isCloud: boolean('is_cloud').default(false),
    cloudAgentId: text('cloud_agent_id'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index('idx_agent_connection_user').on(table.userId)]
);

export type AgentConnection = typeof agentConnection.$inferSelect;
export type NewAgentConnection = typeof agentConnection.$inferInsert;

// User settings table for storing encrypted API keys and preferences
// Used for voice input (Groq API key) and other user-specific settings
export const userSettings = pgTable(
  'user_settings',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(), // References neon_auth.user.id
    key: text('key').notNull(), // Setting key (e.g., 'groq-api-key', 'voice-preferences')
    value: text('value').notNull(), // Encrypted value for sensitive data
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_user_settings_user').on(table.userId),
    uniqueIndex('idx_user_settings_user_key').on(table.userId, table.key),
  ]
);

export type UserSetting = typeof userSettings.$inferSelect;
export type NewUserSetting = typeof userSettings.$inferInsert;
