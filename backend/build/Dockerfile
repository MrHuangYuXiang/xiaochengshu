FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:24.14.1
COPY . /opt/xiaochengshu
WORKDIR /opt/xiaochengshu
EXPOSE 8080 8081
CMD [ "/bin/sh", "/opt/xiaochengshu/build/build.sh" ]