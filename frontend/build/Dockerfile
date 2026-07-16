# 采用多阶段构建,cicd平台直接运行该构建文件

FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:24.14.1 AS builder
COPY . /tmp/xiaochengshu
WORKDIR /tmp/xiaochengshu
RUN npm run build

FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/nginx:1.29.3
COPY --from=builder /tmp/xiaochengshu/dist /usr/share/nginx/html
EXPOSE 80 443