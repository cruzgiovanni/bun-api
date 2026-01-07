import { Elysia } from 'elysia'
import { openapi } from '@elysiajs/openapi'
import { z } from 'zod'
import { posts } from './db/schema'
import { db } from './db'
import { auth, OpenAPI } from './lib/auth'
import { betterAuthMacro } from './macros/auth'

const app = new Elysia()
  .mount(auth.handler)
  .use(betterAuthMacro) // Use the betterAuthMacro to enhance the context with auth capabilities
  .use(
    openapi({
      mapJsonSchema: {
        zod: z.toJSONSchema,
      },
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    })
  ) // Integrate OpenAPI for automatic API documentation
  .get('/', () => 'Hello Elysia')
  .post(
    '/posts',
    async ({ body, user, session }) => {
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
      needsAuth: true, // Require authentication for this route
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
