import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.url().startsWith('postgresql://'),
  RESEND_API_KEY: z.string(),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.url(),
})

export const env = envSchema.parse(Bun.env)
