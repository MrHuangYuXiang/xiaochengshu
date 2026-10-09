cd /opt/xiaochengshu

# apt安装相关依赖
apt-get update -y
apt-get install -y ffmpeg=7:5.1.9-0+deb12u1
echo "apt相关依赖安装完成"

# 安装nodejs依赖
npm install
echo "nodejs依赖安装完成"

# 数据库自动迁移
npm run db:push
echo "数据库迁移完成"

# 编译ts
npx tsc
echo "ts编译完成"

# 运行并启动调试服务器
node --inspect=0.0.0.0:8081 /opt/xiaochengshu/dist/main.js
tail -f /dev/null