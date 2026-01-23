# Share Fission Admin

基于 uni-admin 的后台管理系统，使用 uni-app + uniCloud 技术栈。

## 技术栈

- **前端框架**: uni-app (Vue3)
- **UI 组件库**: Element Plus
- **云服务**: uniCloud (阿里云/支付宝云)
- **数据库**: MongoDB (uniCloud Database)

## 目录结构

```
├── pages/                      # 页面目录
│   ├── demo/                   # 示例页面
│   │   └── table/              # 表格 CRUD 示例
│   ├── system/                 # 系统管理
│   │   ├── user/               # 用户管理
│   │   ├── role/               # 角色管理
│   │   ├── menu/               # 菜单管理
│   │   └── permission/         # 权限管理
│   └── uni-stat/               # 统计分析
│
├── uniCloud-alipay/            # 云端代码
│   ├── cloudfunctions/         # 云函数/云对象
│   │   └── sf-admin-co/        # 主云对象
│   │       ├── module/         # 模块层 (控制器)
│   │       ├── service/        # 服务层 (数据库操作)
│   │       ├── middleware/     # 中间件
│   │       └── libs/           # 工具库
│   └── database/               # 数据库 Schema
│
├── components/                 # 公共组件
├── static/                     # 静态资源
└── .claude/                    # Claude Code 配置
    └── skills/                 # 技能文档
```

## 开发规范

### Vue 页面
- 使用 Vue3 Composition API + `<script setup>` 语法
- 表格使用 Element Plus 虚拟表格 (el-table-v2)
- 参考: `.claude/skills/crud-table/README.md`

### 云对象调用
```javascript
const adminCo = uniCloud.importObject('sf-admin-co', { customUI: true })
const res = await adminCo.action({ name: 'module.method', data: {} })
```

### 云对象结构 (sf-admin-co)
- **module/**: 控制器层，负责参数校验，调用 service
- **service/**: 服务层，负责数据库操作
- 参考: `.claude/skills/unicloud-module/README.md`, `.claude/skills/unicloud-service/README.md`

### 数据库
- 文档 ID 使用 `_id` (MongoDB 标准)
- Schema 定义在 `uniCloud-alipay/database/*.schema.json`
- 时间戳字段: `create_time`, `update_time` (毫秒级)

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 页面文件 | 小写 + 连字符 | `user-list.vue` |
| 组件文件 | PascalCase | `UserCard.vue` |
| 云对象模块 | 小写 | `demo.js` |
| 数据库表 | 小写 + 连字符 | `sf-demo-employee` |
| 变量/函数 | camelCase | `pageIndex`, `loadData` |

## 常用命令

```bash
# 本地开发 (HBuilderX 运行)
# 云函数上传 (HBuilderX 右键上传)
```

## 技能文档

- [新增页面](.claude/skills/uniapp-pages-add/README.md) - 页面创建、路由注册、Vue3模板
- [CRUD 表格页面](.claude/skills/crud-table/README.md) - 表格CRUD、虚拟表格、弹窗表单
- [云对象模块层](.claude/skills/unicloud-module/README.md) - 控制器、参数校验
- [云对象服务层](.claude/skills/unicloud-service/README.md) - 数据库操作、分页查询
