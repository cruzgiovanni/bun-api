import { Elysia } from 'elysia'
import { openapi } from '@elysiajs/openapi'
import { z } from 'zod'
import { posts } from './db/schema'
import { db } from './db'
import { auth } from './lib/auth'

const app = new Elysia()
  .mount(auth.handler)
  .use(
    openapi({
      mapJsonSchema: {
        zod: z.toJSONSchema,
      },
    })
  )
  .get('/', () => 'Hello Elysia')
  .post(
    '/posts',
    async ({ body }) => {
      const [result] = await db
        .insert(posts)
        .values({
          title: body.title,
          content: body.content,
        })
        .returning()

      return result
    },
    {
      body: z.object({
        title: z.string().trim().min(1),
        content: z.string().trim().min(1),
      }),
      response: {
        200: z.object({
          id: z.uuid(),
          title: z.string(),
          content: z.string(),
          createdAt: z.date(),
        }),
      },
    }
  )
  .listen(3000)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)

// Tabela (Drizzle schema)
//         ↓
// Drizzle gera tipos TS
//         ↓
// db.insert(postsTable)
//         ↓
// .returning() → Promise<linha[]>
//         ↓
// [result] → linha
//         ↓
// return → resposta HTTP
