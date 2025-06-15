# 技术实现文档

## 系统架构

### 整体架构
```
用户浏览器 <-> Nginx(域名) <-> Next.js前端(:3001) <-> Express API(:3000) <-> PostgreSQL(:5432)
```

### 技术栈
- **前端框架**: Next.js 14 (App Router)
- **UI库**: Tailwind CSS
- **数据可视化**: Recharts
- **状态管理**: Zustand
- **数据请求**: React Query + Axios
- **类型系统**: TypeScript
- **反向代理**: Nginx

## 模块划分

### 1. 前端模块结构
```
frontend/
├── app/                    # Next.js页面路由
│   ├── page.tsx           # 仪表板首页
│   ├── appointments/      # 预约管理
│   ├── therapists/        # 治疗师管理
│   ├── stores/           # 门店管理
│   └── users/            # 用户管理
├── components/            # 可复用组件
│   ├── dashboard/        # 仪表板组件
│   ├── tables/          # 表格组件
│   ├── ui/              # 基础UI组件
│   └── layout/          # 布局组件
├── lib/                  # 工具库
│   └── api.ts           # API客户端
├── hooks/               # 自定义Hooks
└── types/               # TypeScript类型定义
```

### 2. API集成方案

#### API端点映射
- `/api/appointments/*` - 预约相关操作
- `/api/therapists/*` - 治疗师管理
- `/api/stores/*` - 门店管理
- `/api/users/*` - 用户管理
- `/api/dashboard/*` - 仪表板数据

#### 数据通信协议
- 使用RESTful API
- JSON数据格式
- JWT认证（继承现有系统）
- 响应格式：
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

## 运行端口分配
- 后端API: 3000（保持不变）
- 前端应用: 3001（新增）
- PostgreSQL: 5432（保持不变）
- Nginx: 80/443（域名访问）

## 部署架构

### Nginx配置
```nginx
server {
    server_name emagen.323424.xyz;
    
    # 前端路由
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API路由（保持现有）
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

## 数据流程

### 1. 读取数据流程
```
用户操作 -> React组件 -> React Query Hook -> Axios请求 -> 后端API -> PostgreSQL -> 返回数据 -> 更新UI
```

### 2. 写入数据流程
```
表单提交 -> 数据验证 -> API请求 -> 后端处理 -> 数据库更新 -> 返回结果 -> UI反馈
```

## 关键技术实现

### 1. 实时数据更新
- 使用React Query的轮询机制
- 关键数据5秒自动刷新
- 操作后立即重新获取数据

### 2. 状态管理
- 全局状态使用Zustand
- 服务端状态使用React Query
- 表单状态使用React Hook Form

### 3. 性能优化
- 图片懒加载
- 路由预加载
- API响应缓存
- 分页加载大数据集

## 安全措施
1. API请求使用HTTPS
2. 敏感操作需要确认
3. 输入验证和清理
4. CORS配置限制

## 监控和日志
- 前端错误使用console.error
- API错误统一处理
- 用户操作日志记录