import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { getEnv } from './app/helper/env.js';

export default defineConfig({
    schema: [
        './app/domain/model/db-schema/chat.ts',
        './app/domain/model/db-schema/work.ts',
        './app/domain/model/db-schema/user.ts',
        './app/domain/model/db-schema/admin-user.ts',
        './app/domain/model/db-schema/admin-report.ts',
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