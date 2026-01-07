// What this macro does:
// - Adds an `auth` property to the context
// - The `auth` property has a `resolve` method that checks for a valid session
// - The `resolve` method takes the request headers to verify the session
// - If the session is valid, it returns the user and session data
// - If the session is invalid, it returns a 401 Unauthorized status

import { Elysia } from 'elysia'
import { auth } from '../lib/auth'

export const betterAuthMacro = new Elysia({ name: 'better-auth' })
  .mount(auth.handler)

  .macro({
    needsAuth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        })

        if (!session) return status(401)

        return {
          user: session.user,
          session: session.session,
        }
      },
    },
  })
