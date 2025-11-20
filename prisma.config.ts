import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // Client does not manage migrations - only Admin does
  // Client only needs schema.prisma to generate Prisma Client
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
