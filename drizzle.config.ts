import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: `postgresql://postgres.ibmfsihdkdqxtjlavstp:password123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  },
});