import { pgTable, text, timestamp, boolean, jsonb, uuid, numeric, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const profiles = pgTable('profiles', {
  userId: uuid('user_id').primaryKey().notNull(),
  displayName: text('display_name').notNull(),
  timezone: text('timezone').default('Asia/Jakarta').notNull(),
  preferences: jsonb('preferences').default({}).notNull(),
  boundaries: jsonb('boundaries').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const siduriConfig = pgTable('siduri_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  name: text('name').default('Siduri').notNull(),
  identity: text('identity').notNull(),
  personality: jsonb('personality').default({}).notNull(),
  speakingRules: jsonb('speaking_rules').default({}).notNull(),
  humorRules: jsonb('humor_rules').default({}).notNull(),
  boundaries: jsonb('boundaries').default({}).notNull(),
  voiceConfig: jsonb('voice_config').default({}).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  summary: text('summary'),
  status: text('status').default('active').notNull(),
  projectData: jsonb('project_data').default({}).notNull(),
  currentPriorities: jsonb('current_priorities').default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    projectsUserIdx: index('projects_user_idx').on(table.userId),
    uniqueUserProj: uniqueIndex('projects_user_name_idx').on(table.userId, table.name)
  }
});

export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  gameData: jsonb('game_data').default({}).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    gamesUserIdx: index('games_user_idx').on(table.userId),
    uniqueUserGame: uniqueIndex('games_user_name_idx').on(table.userId, table.name)
  }
});

export const gameAccounts = pgTable('game_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  label: text('label').default('Main').notNull(),
  externalUid: text('external_uid'),
  server: text('server'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    gameAccountsUserIdx: index('game_accounts_user_idx').on(table.userId),
    uniqueGameLabel: uniqueIndex('game_accounts_game_label_idx').on(table.gameId, table.label)
  }
});

export const accountStates = pgTable('account_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  gameAccountId: uuid('game_account_id').notNull().references(() => gameAccounts.id, { onDelete: 'cascade' }),
  state: jsonb('state').default({}).notNull(),
  source: text('source').default('manual').notNull(),
  isCurrent: boolean('is_current').default(true).notNull(),
  capturedAt: timestamp('captured_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    accountStatesAccountIdx: index('account_states_account_idx').on(table.gameAccountId, table.capturedAt),
    accountStatesOneCurrentIdx: uniqueIndex('account_states_one_current_idx').on(table.gameAccountId).where(sql`${table.isCurrent} = true`)
  }
});

export const memories = pgTable('memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  category: text('category').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  confidence: numeric('confidence', { precision: 4, scale: 3 }).default('1').notNull(),
  status: text('status').default('confirmed').notNull(),
  source: text('source').default('user').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    memoriesUserStatusIdx: index('memories_user_status_idx').on(table.userId, table.status, table.createdAt)
  }
});

export const streamSessions = pgTable('stream_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  gameAccountId: uuid('game_account_id').references(() => gameAccounts.id, { onDelete: 'set null' }),
  platform: text('platform').notNull(),
  title: text('title'),
  status: text('status').default('planned').notNull(),
  liveState: jsonb('live_state').default({}).notNull(),
  sessionRules: jsonb('session_rules').default({}).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  summary: text('summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    streamSessionsUserStatusIdx: index('stream_sessions_user_status_idx').on(table.userId, table.status, table.createdAt)
  }
});

export const streamInteractions = pgTable('stream_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  streamSessionId: uuid('stream_session_id').notNull().references(() => streamSessions.id, { onDelete: 'cascade' }),
  interactionType: text('interaction_type').notNull(),
  senderName: text('sender_name'),
  senderPlatformId: text('sender_platform_id'),
  message: text('message'),
  amount: numeric('amount', { precision: 14, scale: 2 }),
  currency: text('currency'),
  eventData: jsonb('event_data').default({}).notNull(),
  siduriResponse: text('siduri_response'),
  responseMode: text('response_mode'),
  handled: boolean('handled').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    streamInteractionsPendingIdx: index('stream_interactions_pending_idx').on(table.streamSessionId, table.handled, table.createdAt)
  }
});
