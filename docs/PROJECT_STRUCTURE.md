# PostgreSQL 预约管理系统 - 项目结构

## 🏗️ 项目概述

这是一个完整的中医理疗预约管理系统，包含前端管理界面、后端API服务和完整的部署方案。

## 📁 目录结构

```
PostgreSQL/
├── frontend/                 # Next.js 前端应用
│   ├── app/                 # App Router页面
│   ├── components/          # React组件
│   ├── lib/                 # 工具库和API配置
│   └── types/               # TypeScript类型定义
├── src/                     # 后端源代码
│   ├── routes/              # API路由
│   ├── middleware/          # 中间件
│   └── config/              # 配置文件
├── tests/                   # 测试文件
│   ├── test-production-api.py   # Python API测试
│   └── *.sh                 # Shell测试脚本
├── deployment/              # 部署脚本和配置
│   ├── fix-*.sh            # 修复脚本
│   └── deploy-*.sh         # 部署脚本
├── docs/                    # 文档
├── config/                  # 数据库配置
├── migrations/              # 数据库迁移
└── scripts/                 # 工具脚本
```

## 🚀 快速开始

### 本地开发
1. 安装依赖：`npm install`
2. 启动后端：`npm start`
3. 启动前端：`cd frontend && npm run dev`

### 生产部署
1. 运行部署脚本：`./deployment/deploy.sh`
2. 访问：http://emagen.323424.xyz

## 🔧 主要功能

- 门店管理
- 技师管理
- 预约管理（增删改查）
- 用户管理
- 仪表板统计
- 完整的API接口

## 🌐 在线访问

- **网站**: http://emagen.323424.xyz
- **API**: http://emagen.323424.xyz/api
- **服务器**: 43.167.226.222

## 📝 技术栈

- **前端**: Next.js 14, React 18, TypeScript, TailwindCSS
- **后端**: Node.js, Express
- **数据库**: PostgreSQL / Mock数据
- **部署**: Nginx, PM2, Ubuntu 24.04