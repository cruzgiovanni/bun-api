# Bun API - Complete Reference Guide

A modern, production-ready REST API built with **Bun**, **Elysia**, **Drizzle ORM**, and **Better Auth**. This guide will help you understand and replicate this architecture in your future projects.

---

## 📚 Table of Contents

1. [Tech Stack](#-tech-stack)
2. [Project Architecture](#-project-architecture)
3. [Prerequisites](#-prerequisites)
4. [Initial Setup](#-initial-setup)
5. [Step-by-Step Implementation](#-step-by-step-implementation)
6. [Database Configuration](#-database-configuration)
7. [Authentication System](#-authentication-system)
8. [API Documentation](#-api-documentation)
9. [Docker Deployment](#-docker-deployment)
10. [Development Workflow](#-development-workflow)

---

## 🛠 Tech Stack

| Technology      | Purpose                   | Why We Use It                                    |
| --------------- | ------------------------- | ------------------------------------------------ |
| **Bun**         | Runtime & Package Manager | Faster than Node.js, built-in TypeScript support |
| **Elysia**      | Web Framework             | Type-safe, fast, modern API framework for Bun    |
| **Drizzle ORM** | Database ORM              | Type-safe SQL queries with automatic migrations  |
| **Better Auth** | Authentication            | Full-featured auth with session management       |
| **Zod**         | Schema Validation         | Runtime type validation for request/response     |
| **PostgreSQL**  | Database                  | Robust relational database                       |
| **OpenAPI**     | API Documentation         | Auto-generated interactive API docs              |

---

## 📁 Project Architecture

```
bun-api/
├── src/
│   ├── index.ts              # Main application entry point
│   ├── db/
│   │   ├── index.ts          # Database connection
│   │   └── schema.ts         # Database tables & relations
│   ├── lib/
│   │   └── auth.ts           # Better Auth configuration
│   └── macros/
│       └── auth.ts           # Authentication macro for routes
├── drizzle/                  # Generated migrations (auto-created)
├── drizzle.config.ts         # Drizzle configuration
├── docker-compose.yml        # Docker services setup
├── Dockerfile                # Container definition
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript configuration
```

---

## ✅ Prerequisites

Before starting, make sure you have:

- **Bun** installed (v1.0+)
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
- **PostgreSQL** (via Docker or local installation)
- **Basic knowledge** of TypeScript and REST APIs

---

## 🚀 Initial Setup

### 1. Create Project

```bash
# Create a new Elysia project
bun create elysia app
cd app
```

### 2. Install Dependencies

```bash
# Core dependencies
bun add elysia drizzle-orm pg better-auth zod @elysiajs/openapi

# Dev dependencies
bun add -d @types/pg bun-types drizzle-kit tsx
```

### 3. Update package.json Scripts

```json
{
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "test": "bun test"
  }
}
```

---

## 📝 Step-by-Step Implementation

### Step 1: Database Configuration

#### 1.1 Generate Better Auth Schemas

First, generate the Better Auth database schemas automatically:

```bash
# Generate Better Auth schemas
npx @better-auth/cli generate
```

This command will generate the required tables for Better Auth (`users`, `sessions`, `accounts`, `verifications`).

#### 1.2 Create Database Schema

Create `src/db/schema.ts` and add the generated schemas plus your custom tables:

```typescript
import { relations } from "drizzle-orm";
import { pgTable, text, boolean, index, varchar, timestamp, uuid } from "drizzle-orm/pg-core";

// Example: Your custom tables
export const posts = pgTable("posts", {
  id: uuid().primaryKey().defaultRandom(),
  title: varchar({ length: 255 }).notNull(),
  content: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Better Auth generated tables (from npx @better-auth/cli generate)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_userId_idx").on(table.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("accounts_userId_idx").on(table.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  users: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  users: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
```

#### 1.3 Create Database Connection

Create `src/db/index.ts`:

```typescript
import { drizzle } from "drizzle-orm/bun-sql";
import * as schema from "./schema";

export const db = drizzle(Bun.env.DATABASE_URL!, {
  schema,
  casing: "snake_case", // Converts camelCase to snake_case automatically
});
```

#### 1.4 Configure Drizzle Kit

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: Bun.env.DATABASE_URL!,
  },
});
```

---

### Step 2: Authentication System

#### 2.1 Setup Better Auth

Create `src/lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { db } from "../db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true, // Uses plural table names (e.g., 'users')
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      // Use Bun's built-in password hashing (faster than bcrypt)
      hash: (password: string) => Bun.password.hash(password),
      verify: ({ password, hash }: { password: string; hash: string }) => Bun.password.verify(password, hash),
    },
  },
  advanced: {
    database: {
      generateId: false, // We use UUIDs from our schema
    },
  },
  plugins: [openAPI()], // Generates OpenAPI docs for auth routes
  basePath: "api/auth",
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache
    },
  },
});

// Helper to generate OpenAPI schema for Better Auth
let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());

export const OpenAPI = {
  getPaths: () =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null);

      for (const path of Object.keys(paths)) {
        const key = "api/auth" + path;
        reference[key] = paths[path];

        for (const method of Object.keys(paths[path])) {
          const operation = (reference[key] as any)[method];
          operation.tags = ["Better Auth"];
        }
      }

      return reference;
    }) as Promise<any>,
  components: getSchema().then(({ components }) => components) as Promise<any>,
} as const;
```

#### 2.2 Create Authentication Macro

Create `src/macros/auth.ts`:

```typescript
import { Elysia } from "elysia";
import { auth } from "../lib/auth";

export const betterAuthMacro = new Elysia({ name: "better-auth" }).mount(auth.handler).macro({
  needsAuth: {
    async resolve({ status, request: { headers } }) {
      // Verify session from request headers
      const session = await auth.api.getSession({
        headers,
      });

      // Return 401 if no valid session
      if (!session) return status(401);

      // Inject user and session into route context
      return {
        user: session.user,
        session: session.session,
      };
    },
  },
});
```

**What the macro does:**

- Adds `needsAuth: true` option to routes
- Automatically checks for valid sessions
- Injects `user` and `session` into route handlers
- Returns 401 Unauthorized if no valid session

---

### Step 3: Main Application

Create `src/index.ts`:

```typescript
import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { z } from "zod";
import { posts } from "./db/schema";
import { db } from "./db";
import { auth, OpenAPI } from "./lib/auth";
import { betterAuthMacro } from "./macros/auth";

const app = new Elysia()
  // Mount Better Auth routes (e.g., /api/auth/sign-in)
  .mount(auth.handler)

  // Use authentication macro
  .use(betterAuthMacro)

  // Setup OpenAPI documentation
  .use(
    openapi({
      mapJsonSchema: {
        zod: z.toJSONSchema, // Convert Zod schemas to JSON Schema
      },
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )

  // Public route
  .get("/", () => "Hello Elysia")

  // Protected route example
  .post(
    "/posts",
    async ({ body, user, session }) => {
      // Insert post into database
      const [result] = await db
        .insert(posts)
        .values({
          title: body.title,
          content: body.content,
        })
        .returning();

      return {
        id: result.id,
        title: result.title,
        content: result.content,
        createdAt: result.createdAt.toISOString(),
      };
    },
    {
      needsAuth: true, // Require authentication
      body: z.object({
        title: z.string().trim().min(1),
        content: z.string().trim().min(1),
      }),
      response: {
        200: z.object({
          id: z.uuid(),
          title: z.string(),
          content: z.string(),
          createdAt: z.iso.date(),
        }),
      },
    },
  )
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
```

---

## 🗄️ Database Configuration

### Setup PostgreSQL with Docker

Create `docker-compose.yml`:

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.docker
    depends_on:
      - db

  db:
    image: postgres:alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: bun_api
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Environment Variables

Create `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/bun_api
```

Create `.env.docker` (for Docker):

```env
DATABASE_URL=postgresql://postgres:password@db:5432/bun_api
```

### Apply Database Schema

```bash
# Start PostgreSQL
docker compose up db -d

# Push schema directly to database
bunx --bun drizzle-kit push

# (Optional) Open Drizzle Studio to view database
bunx drizzle-kit studio
```

**About `drizzle-kit push`:**

- Directly applies your schema to the database without creating migration files
- Perfect for development and prototyping
- Automatically detects changes in your `schema.ts` and updates the database
- For production, consider using `drizzle-kit generate` + `migrate` to create migration files for version control

---

## 🔐 Authentication System

### How It Works

1. **User Registration**

   ```bash
   POST /api/auth/sign-up/email
   Body: { "email": "user@example.com", "password": "password123", "name": "John" }
   ```

2. **User Login**

   ```bash
   POST /api/auth/sign-in/email
   Body: { "email": "user@example.com", "password": "password123" }
   ```

3. **Session Management**
   - Sessions are stored in the database
   - Session tokens are sent via cookies
   - Automatic session validation on protected routes

4. **Protecting Routes**

   ```typescript
   .post('/protected', handler, {
     needsAuth: true, // This makes the route protected
   })
   ```

5. **Accessing User Data**
   ```typescript
   .post('/posts', async ({ user, session }) => {
     // user and session are automatically injected
     console.log(user.id, user.email)
   }, { needsAuth: true })
   ```

---

## 📖 API Documentation

### Auto-Generated OpenAPI Docs

Once the server is running, access the OpenAPI documentation at:

```
http://localhost:3000/openapi
```

This documentation is automatically generated from your route definitions, including:

- All endpoints with their methods (GET, POST, etc.)
- Request/response schemas from Zod validation
- Better Auth authentication routes
- Type-safe documentation that stays in sync with your code

### Custom Route Documentation

```typescript
.get('/users/:id', handler, {
  detail: {
    summary: 'Get user by ID',
    description: 'Retrieves a user by their unique identifier',
    tags: ['Users']
  },
  params: z.object({
    id: z.string().uuid()
  }),
  response: {
    200: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email()
    })
  }
})
```

---

## 🐳 Docker Deployment

### Create Dockerfile

Create `Dockerfile`:

```dockerfile
FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
```

### Build and Run

```bash
# Build and start all services
docker compose up --build

# Run in background
docker compose up -d

# View logs
docker compose logs -f api

# Stop services
docker compose down
```

---

## 🔄 Development Workflow

### 1. Start Development Server

```bash
bun run dev
```

The server will auto-reload on file changes.

### 2. Adding New Routes

```typescript
// Example: GET route
.get('/items', async () => {
  const items = await db.select().from(itemsTable)
  return items
})

// Example: POST route with validation
.post('/items', async ({ body }) => {
  const [item] = await db.insert(itemsTable)
    .values(body)
    .returning()
  return item
}, {
  body: z.object({
    name: z.string(),
    price: z.number().positive()
  })
})
```

### 3. Adding New Database Tables

1. Add table to `src/db/schema.ts`
2. Push changes to database

   ```bash
   bunx --bun drizzle-kit push
   ```

   This will automatically detect your schema changes and apply them to the database.

### 4. Testing Authentication

```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Access protected route
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"My Post","content":"Post content"}'
```

---

## 🎯 Key Concepts to Remember

### 1. **Type Safety**

- Zod validates runtime data
- Drizzle provides compile-time type checking
- TypeScript ensures type safety everywhere

### 2. **Database Casing**

- Use `camelCase` in TypeScript
- Drizzle auto-converts to `snake_case` in PostgreSQL
- No manual conversion needed

### 3. **Macros in Elysia**

- Macros add custom functionality to routes
- `needsAuth` macro handles authentication automatically
- Can create custom macros for logging, rate limiting, etc.

### 4. **Better Auth Features**

- Built-in session management
- Email/password authentication
- Can add OAuth providers (Google, GitHub, etc.)
- OpenAPI documentation included

### 5. **Drizzle ORM Advantages**

- Type-safe SQL queries
- Automatic migrations
- Relations support
- Built-in query builder

---

## 🚀 Next Steps

### Extending This API

1. **Add More Auth Providers**

   ```typescript
   import { github, google } from "better-auth/providers";

   export const auth = betterAuth({
     // ... existing config
     socialProviders: {
       github: {
         clientId: Bun.env.GITHUB_CLIENT_ID!,
         clientSecret: Bun.env.GITHUB_CLIENT_SECRET!,
       },
     },
   });
   ```

2. **Add Rate Limiting**

   ```bash
   bun add @elysiajs/rate-limit
   ```

3. **Add CORS Support**

   ```bash
   bun add @elysiajs/cors
   ```

4. **Add Redis for Sessions**
   - Uncomment `secondaryStorage` in `auth.ts`
   - Install Redis client
   - Configure Redis connection

5. **Add File Uploads**
   ```bash
   bun add @elysiajs/static
   ```

---

## 📚 Additional Resources

- [Bun Documentation](https://bun.sh/docs)
- [Elysia Documentation](https://elysiajs.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Better Auth Documentation](https://better-auth.com)

---

## ✨ Summary

This stack provides:

- ⚡ **Fast**: Bun runtime is significantly faster than Node.js
- 🔒 **Secure**: Built-in authentication and session management
- 📝 **Type-Safe**: End-to-end TypeScript with runtime validation
- 🗄️ **Database**: Type-safe ORM with automatic migrations
- 📖 **Documented**: Auto-generated OpenAPI/Swagger docs
- 🐳 **Production-Ready**: Docker setup included

Use this guide as a reference for building modern, scalable APIs with Bun!

---

**Made with ❤️ using Bun, Elysia, and TypeScript**
