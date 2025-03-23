import '@/lib/config/env';
import type { Config } from 'drizzle-kit';

// Add this line to debug
console.log('DATABASE_URL:', process.env.DATABASE_URL);

export default {
    schema: ['./src/lib/db/schema.ts', './src/db/schema/*'],
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL!
    },
    verbose: true,
    strict: true
} satisfies Config;