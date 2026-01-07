import { pgTable, varchar, timestamp, uuid } from 'drizzle-orm/pg-core'

export const postsTable = pgTable('posts', {
  id: uuid().primaryKey().defaultRandom(),
  title: varchar({ length: 255 }).notNull(),
  content: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
})
