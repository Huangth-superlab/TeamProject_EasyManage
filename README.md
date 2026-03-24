# 人工说明

除本条外，项目全部内容均为基于Coze平台的Agent生成，仅经过功能基线测试，请勿用于关键信息的处理和保存。

# 项目管理系统

## 🚀 快速开始

### 1. 访问系统
系统已部署在：**http://localhost:5000**

### 2. 登录账号

**管理员账号：**
- 用户名：`admin`
- 密码：`admin123`

### 3. 调试工具

如果遇到登录问题，可以访问调试页面：**http://localhost:5000/test-login**

调试页面可以：
- 测试登录API
- 查看响应状态
- 检查Cookies设置
- 测试会话验证

## 📝 功能说明

### 人员管理
- **路径**: `/personnel`
- **功能**: 新增、编辑、删除、查询人员信息
- **特色**: 
  - 根据人员类型动态显示/隐藏字段
  - 删除前检查关联关系
  - 支持按姓名和类型搜索

### 项目管理
- **路径**: `/projects`
- **功能**: 项目全生命周期管理
- **特色**:
  - 多维度搜索筛选
  - 项目详情展示进展和待办
  - 时间轴统一排序展示

### 用户管理（仅管理员）
- **路径**: `/users`
- **功能**: 管理系统用户
- **特色**:
  - 创建新用户
  - 关联人员信息
  - 角色权限分配

### 操作日志（仅管理员）
- **路径**: `/operation-logs`
- **功能**: 查看系统操作记录
- **特色**:
  - 按用户、模块、时间筛选
  - 记录操作详情

## 🔧 技术架构

### 前端
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui

### 后端
- Next.js API Routes
- Supabase (PostgreSQL)

### 开发工具
- pnpm (包管理器)
- TypeScript (类型检查)

## 🐛 已知问题与解决方案

### 1. 登录失败 / 跨域问题

**原因**: Cookie设置和CORS配置

**解决方案**:
1. ✅ 所有API调用添加 `credentials: 'include'`
2. ✅ Cookie设置 `secure: false` (开发环境)
3. ✅ Cookie设置 `path: '/'` 和 `sameSite: 'lax'`

**测试步骤**:
```bash
# 1. 测试登录API
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt

# 2. 检查Cookie
cat cookies.txt

# 3. 测试会话验证
curl http://localhost:5000/api/auth/me \
  -b cookies.txt
```

### 2. 页面加载慢

**原因**: 首次访问需要编译

**解决方案**: 等待编译完成，后续访问会快很多

### 3. 类型错误

**检查命令**:
```bash
npx tsc --noEmit
```

### 4. Hydration Warning（已修复）

**原因**: 浏览器扩展（如uplog）向body标签注入额外属性

**影响**: 不影响系统功能，仅显示警告

**解决方案**:
- ✅ 已在layout.tsx添加 `suppressHydrationWarning` 属性
- ✅ 警告已被抑制

**详细说明**: 参见 `docs/HYDRATION_WARNING.md`

## 📊 数据库表结构

### personnel (人员表)
- id: 主键
- name: 姓名
- personnel_type: 人员类型
- project_id: 所属项目ID
- unit_name: 单位名称
- position: 职务
- phone: 电话号码

### projects (项目表)
- id: 主键
- name: 项目名称
- content: 项目内容
- source: 项目来源
- responsible_person_id: 责任人ID
- owner_unit_name: 业主单位名称
- owner_unit_type: 业主单位属性
- stage: 项目阶段

### project_progress (项目进展表)
- id: 主键
- project_id: 项目ID
- event_date: 事件时间
- content: 进展内容
- responsible_person_ids: 责任人ID列表

### todo_items (待办事项表)
- id: 主键
- project_id: 项目ID
- event_date: 事件时间
- deadline: 截止时间
- content: 待办内容
- responsible_person_ids: 责任人ID列表
- status: 状态

### users (用户表)
- id: 主键
- username: 用户名
- password: 密码(加密)
- personnel_id: 关联人员ID
- role: 角色
- is_active: 是否激活

### operation_logs (操作日志表)
- id: 主键
- user_id: 用户ID
- user_name: 用户名
- operation_time: 操作时间
- ip_address: IP地址
- module: 操作模块
- operation_type: 操作类型
- target_name: 操作对象
- detail: 操作详情

## 🔐 安全说明

1. **密码加密**: 使用Base64编码（生产环境应使用bcrypt）
2. **会话管理**: 基于HTTP-Only Cookie
3. **权限控制**: 角色-based访问控制
4. **操作审计**: 所有关键操作记录日志

## 📝 开发规范

### API 调用
所有API调用必须包含 `credentials: 'include'`:

```typescript
fetch('/api/xxx', {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})
```

### Cookie 设置
```typescript
cookieStore.set('session', sessionData, {
  httpOnly: true,
  secure: false, // 开发环境
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
})
```

### 错误处理
```typescript
try {
  const response = await fetch(url, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || '请求失败');
  }

  if (result.success) {
    // 处理成功
  } else {
    // 处理业务错误
    alert(result.error);
  }
} catch (error) {
  console.error('API Error:', error);
  alert('网络错误，请稍后重试');
}
```

## 🚀 部署说明

### 开发环境
```bash
# 服务已自动启动在 http://localhost:5000
# 代码修改会自动热更新
```

### 生产环境
```bash
pnpm run build
pnpm run start
```

## 📞 技术支持

如有问题，请检查：
1. 浏览器控制台错误
2. 服务器日志: `/app/work/logs/bypass/`
3. 调试页面: `/test-login`
