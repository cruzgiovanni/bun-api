import { drizzle } from 'drizzle-orm/bun-sql'
import * as schema from './schema'

export const db = drizzle(Bun.env.DATABASE_URL!, {
  schema,
  casing: 'snake_case', // automatically convert camelCase to snake_case in DB columns
})
