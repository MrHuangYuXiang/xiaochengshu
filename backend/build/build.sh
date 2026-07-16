cd /opt/xiaochengshu
npm install
npx tsc
node --inspect=0.0.0.0:8081 /opt/xiaochengshu/dist/main.js
tail -f /dev/null