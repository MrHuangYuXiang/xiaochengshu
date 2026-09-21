import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { getEnv } from './app/helper/env.js';

export default defineConfig({
    schema: [
        './app/db/schema/client-chat.ts',
        './app/db/schema/client-work.ts',
        './app/db/schema/client-user.ts',
        './app/db/schema/admin-user.ts',
        './app/db/schema/admin-report.ts',
    ],
    dialect: 'mysql',
    dbCredentials: {
        host: getEnv("DB_HOST"),
        port: Number(getEnv("DB_PORT")),
        user: getEnv("DB_USER"),
        password: getEnv("DB_PASSWORD"),
        database: getEnv("DB_DATABASE"),
    },
});