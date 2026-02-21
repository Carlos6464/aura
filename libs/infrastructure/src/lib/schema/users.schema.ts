import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  googleId:     text('google_id').unique(),
  whatsapp:     text('whatsapp').unique(),
  avatarUrl:    text('avatar_url'),
  role:         text('role').notNull().default('USER'),
  planId:       text('plan_id').notNull().default('FREE'),
  monitoredApps: text('monitored_apps').array().notNull().default([]),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
  updatedAt:    timestamp('updated_at').notNull().defaultNow(),
})