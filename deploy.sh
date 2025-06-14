#!/bin/bash

# PostgreSQL API 部署脚本
# 服务器: 43.167.226.222
# 内网IP: 10.7.4.15
# 端口: 4999

set -e

echo "开始部署 PostgreSQL API 到腾讯云 Lighthouse 服务器..."

# 服务器配置
SERVER_IP="43.167.226.222"
SERVER_USER="root"  # 根据实际情况修改
DEPLOY_PATH="/opt/cloud-postgres-api"
SERVICE_NAME="postgres-api"

echo "1. 准备本地文件..."
# 创建临时部署目录
TEMP_DIR="/tmp/postgres-api-deploy"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# 复制项目文件（排除不需要的文件）
rsync -av --exclude 'node_modules' --exclude '.git' --exclude 'api.log' ./ $TEMP_DIR/

echo "2. 连接服务器并部署..."
# 这里需要手动执行，因为需要SSH密钥认证
echo "请手动执行以下命令："
echo ""
echo "# 1. 上传文件到服务器"
echo "scp -r $TEMP_DIR/* $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/"
echo ""
echo "# 2. 在服务器上执行部署命令"
echo "ssh $SERVER_USER@$SERVER_IP"
echo ""
echo "部署脚本已准备完成！"