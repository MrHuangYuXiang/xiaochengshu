import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { getEnv } from './app/helper/env.js';

export default defineConfig({
    schema: [
        './app/db/schema.ts',
        './app/db/schema/chat.ts',
        './app/db/schema/work.ts',
        './app/db/schema/user.ts'
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