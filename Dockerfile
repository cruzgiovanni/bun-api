# Build
FROM oven/bun AS build
WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock
RUN bun install

COPY ./src ./src
COPY ./build.ts ./build.ts
COPY tsconfig.json tsconfig.json

RUN bun build.ts

# Runtime
FROM gcr.io/distroless/base
WORKDIR /app
COPY --from=build /app/build/server server

ENV NODE_ENV=production
EXPOSE 3000
CMD ["./server"]
