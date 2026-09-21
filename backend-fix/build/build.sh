cd /opt/xiaochengshu
npm install

# 数据库自动迁移
npm run db:push
npx tsc
node --inspect=0.0.0.0:8081 /opt/xiaochengshu/dist/main.js
tail -f /dev/null