import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Prisma 7 type requires 'engine' but it is optional at runtime
export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
});
