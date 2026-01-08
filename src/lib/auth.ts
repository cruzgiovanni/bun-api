import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db'
import { openAPI } from 'better-auth/plugins'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true, // table names will be pluralized (e.g., 'users' instead of 'user')
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: (password: string) => Bun.password.hash(password),
      verify: ({ password, hash }: { password: string; hash: string }) =>
        Bun.password.verify(password, hash),
    },
  },
  advanced: {
    database: {
      generateId: false, // we already have UUIDs in our schema, so no need to generate new IDs
    },
  },
  plugins: [openAPI()],
  basePath: 'api/auth',
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // When we want to use Redis for session storage?
  // when there are multiple instances of the app running (e.g., in a load-balanced environment)
  // or when we want to persist sessions across server restarts.
  // By default, sessions are stored in the database.
  // the session data will be stored in Redis instead of the database.
  // this will provide better performance and scalability for session management.
  // Uncomment and implement the following section to enable Redis storage.

  // secondaryStorage: {
  //   get: async (key: string) => {
  //     // get from redis using key
  //   },
  //   set: () => {
  //     // set from redis using key
  //   },
  //   delete: () => {
  //     // delete from redis using key
  //   },
  // },
})

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema())

export const OpenAPI = {
  getPaths: () =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null)

      for (const path of Object.keys(paths)) {
        const key = 'api/auth' + path
        reference[key] = paths[path]

        for (const method of Object.keys(paths[path])) {
          const operation = (reference[key] as any)[method]

          operation.tags = ['Better Auth']
        }
      }

      return reference
    }) as Promise<any>,
  components: getSchema().then(({ components }) => components) as Promise<any>,
} as const
