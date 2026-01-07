import { Elysia } from 'elysia'
import { openapi } from '@elysiajs/openapi'
import { z } from 'zod'

const app = new Elysia()
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
    ({ body }) => {
      return {
        id: crypto.randomUUID(),
        title: body.title,
        content: body.content,
        createdAt: new Date(),
      }
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
