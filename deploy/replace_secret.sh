#!/bin/bash

# 该脚本用来替换模板文件为cicd平台存储的密钥变量
# cicd平台必须注入密钥环境变量然后调用该脚本

# 替换后端环境变量模板
sed -i "s/{{ENV}}/${BACKEND_ENV}/g" ./deploy/backend/temp.env
sed -i "s/{{DB_HOST}}/${BACKEND_DB_HOST}/g" ./deploy/backend/temp.env
sed -i "s/{{DB_PORT}}/${BACKEND_DB_PORT}/g" ./deploy/backend/temp.env
sed -i "s/{{DB_USER}}/${BACKEND_DB_USER}/g" ./deploy/backend/temp.env
sed -i "s/{{DB_PASSWORD}}/${BACKEND_DB_PASSWORD}/g" ./deploy/backend/temp.env
sed -i "s/{{DB_DATABASE}}/${BACKEND_DB_DATABASE}/g" ./deploy/backend/temp.env
sed -i "s/{{UPLOAD_DIR}}/${BACKEND_UPLOAD_DIR}/g" ./deploy/backend/temp.env
sed -i "s/{{PERSISTENT_HEARTBEAT_INTERVAL}}/${BACKEND_PERSISTENT_HEARTBEAT_INTERVAL}/g" ./deploy/backend/temp.env
sed -i "s/{{JWT_SECRET}}/${BACKEND_JWT_SECRET}/g" ./deploy/backend/temp.env
mv ./deploy/backend/temp.env ./deploy/backend/.env

# 替换数据库环境变量模板
sed -i "s/{{MYSQL_ROOT_PASSWORD}}/${MYSQL_ROOT_PASSWORD}/g" ./deploy/mysql/temp.env
mv ./deploy/mysql/temp.env ./deploy/mysql/.env

# 替换nginx配置文件
sed -i "s/localhost/${SERVER_HOST}/g" ./deploy/frontend/nginx.conf

# 替换前端环境变量
sed -i "s/localhost/${SERVER_HOST}/g" ./frontend/.env
