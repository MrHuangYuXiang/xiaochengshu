import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: ['./app/db/schema.ts', './app/db/schema/chat.ts', './app/db/schema/work.ts', './app/db/schema/user.ts'],
    dialect: 'mysql',
    dbCredentials: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '666666',
        database: 'xiaochengshu',
    },
});