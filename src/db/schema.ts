import { pgTable, varchar, jsonb, timestamp, serial, text, integer } from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appState = pgTable("app_state", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: integer('user_id').references(() => users.id),
  state: jsonb("state").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  states: many(appState),
}));

export const appStateRelations = relations(appState, ({ one }) => ({
  user: one(users, {
    fields: [appState.userId],
    references: [users.id],
  }),
}));
