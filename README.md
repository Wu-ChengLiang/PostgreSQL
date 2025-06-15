# PostgreSQL 中医理疗预约管理系统

一个完整的中医理疗预约管理系统，包含前端管理界面和后端API服务。

## 🌟 功能特性

- 📍 **门店管理** - 管理多个门店信息
- 👨‍⚕️ **技师管理** - 技师信息、专长、排班管理
- 📅 **预约管理** - 完整的预约增删改查功能
- 👥 **用户管理** - 用户信息管理
- 📊 **数据统计** - 预约趋势、技师利用率等
- 🔍 **智能查询** - 支持按技师名、门店、服务类型查询

## 🚀 在线访问

- **网站地址**: http://emagen.323424.xyz
- **API接口**: http://emagen.323424.xyz/api
- **服务器**: 43.167.226.222

## 🛠️ 技术栈

### 前端
- **Next.js 14** + React 18 + TypeScript
- **TailwindCSS** 样式框架
- **React Query** 数据管理
- **Zustand** 状态管理

### 后端
- **Node.js** + Express
- **PostgreSQL** / Mock数据库
- **PM2** 进程管理
- **Nginx** 反向代理

## 📦 快速开始

### 本地开发

1. **安装依赖**:
   ```bash
   npm install
   cd frontend && npm install
   ```

2. **启动后端服务**:
   ```bash
   npm start
   ```

3. **启动前端开发服务器**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **访问应用**:
   - 前端: http://localhost:3001
   - 后端API: http://localhost:3000

### 生产部署

详见 [deployment/](deployment/) 目录中的部署脚本。

## 📚 文档

- [API文档](API_DOCUMENTATION.md)
- [部署说明](DEPLOYMENT.md)
- [项目结构](docs/PROJECT_STRUCTURE.md)
- [测试说明](tests/README.md)

## 🧪 测试

运行完整的API测试：

```bash
python3 tests/test-production-api.py
```

## 📁 项目结构

```
├── frontend/          # Next.js 前端应用
├── src/              # 后端API源代码
├── tests/            # 测试文件
├── deployment/       # 部署脚本
├── docs/            # 项目文档
└── config/          # 配置文件
```

## 🔧 主要API端点

- `/api/stores` - 门店管理
- `/api/therapists` - 技师管理
- `/api/appointments` - 预约管理
- `/api/users` - 用户管理
- `/api/dashboard` - 统计数据

## 📈 系统状态

✅ 所有功能正常运行
✅ 前端界面完整
✅ API接口稳定
✅ 部署成功

## 🔧 原有API端点（保留）

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 数据项
- `GET /api/items` - 获取所有项目
- `GET /api/items/:id` - 获取单个项目
- `POST /api/items` - 创建新项目
- `PUT /api/items/:id` - 更新项目
- `DELETE /api/items/:id` - 删除项目

### 健康检查
- `GET /api/health` - API健康状态