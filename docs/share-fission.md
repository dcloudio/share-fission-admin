# 分销裂变系统模板

## 介绍

### 什么是分销裂变系统模板？

分销裂变系统模板是一套基于 **uni-app** 和 **uniCloud** 构建的通用分销裂变模板，包含客户端（client）和管理后台（admin）两个端。

该模板实现了"看广告赚收益 + 二级分销（分享用户看广告，自己也有收益） + 积分商城"的完整业务闭环，帮助开发者快速搭建自己的分销裂变平台。

### 核心特性

**技术架构**
- 基于 **uni-app** 跨平台框架，一套代码多端运行（H5、小程序、App）
- 采用 **uniCloud** Serverless 架构，无需购买服务器，开箱即用
- 管理后台基于 **uni-admin** ，支持 PC 和 移动H5端自适应
- 使用 **MongoDB** 云数据库，灵活的文档型数据存储
- 基于 **uni-ad** 广告联盟，帮助开发者快速变现

**业务功能**
- **广告变现**：用户通过观看广告获得积分和收益
- **二级分销体系**：支持个人收益、一级上线分成、二级上线分成
- **积分商城**：积分可兑换虚拟商品（自动发卡）或提现
- **用户管理**：用户层级关系、团队成员查看
- **财务管理**：资金池管理、提现审核、收益结算
- **数据统计**：每日数据趋势、多维度分析报表

### 适用场景

理论上支持任何场景，以下是个别场景举例

- **内容平台**：通过广告分成激励用户分享传播
- **游戏推广**：游戏试玩、广告观看奖励系统
- **知识付费**：课程分销、会员推广
- **营销活动**：裂变拉新、用户增长活动

### 为什么选择这个模板？

- ✅ **开箱即用**：完整的前后端代码，快速部署上线
- ✅ **零服务器成本**：基于 uniCloud，按量计费，初期成本极低
- ✅ **跨平台支持**：一套代码适配 H5、微信小程序、支付宝小程序、App
- ✅ **AI 辅助开发**：配置了 Claude Code 技能，快速生成 CRUD 页面

## client 端


## admin 端

### 1. 系统介绍

#### 1.1 项目概述

share-fission-admin 是一个基于 uni-app 和 uniCloud 构建的分销裂变管理后台系统。提供分销用户管理、分销系统设置、财务管理、广告管理、积分商城管理和每日统计等功能。

#### 1.2 核心功能

- **用户管理**：用户层级关系、团队成员查看
- **商品管理**：商品上下架、分类管理、销量统计
- **订单管理**：订单查看、卡密查看、退款处理、卡密导入
- **财务管理**：资金池日志、积分记录、提现管理
- **广告管理**：广告观看记录
- **数据统计**：每日数据趋势、多维度分析报表

---

### 2. 快速开始

#### 2.1 获取项目

```bash
# 克隆项目（如果使用 Git）
git clone <repository-url>

# 或直接下载项目压缩包解压
```

#### 2.2 安装依赖

```bash
npm install --registry https://registry.npmmirror.com
```

#### 2.3 配置 uniCloud

1. **使用 HBuilderX**，打开项目
2. **右键点击 `uniCloud` 目录** → 选择"关联云服务空间或项目"
3. **创建或选择云服务空间**（支付宝云/阿里云/腾讯云）
4. **上传云函数**：
   - 右键 `uniCloud/cloudfunctions` 目录
   - 选择"上传所有云函数、公共模块及actions"
5. **初始化数据库**：
   - 右键 `uniCloud/database` 目录
   - 选择"初始化云数据库"

#### 2.4 运行项目

```bash
# 在 HBuilderX 中点击"运行" → "运行到浏览器" → "Chrome"
```
#### 2.5 登录系统

1. 访问 `http://localhost:5678/admin/`
2. 首次进入页面会有管理员注册按钮
---

### 3. 项目结构

```
share-fission-admin/
├── pages/                      # 页面文件
│   ├── index/                  # 首页每日统计/仪表盘
│   ├── sf-admin/               # 分销业务模块
│   │   ├── user/               # 用户管理
│   │   ├── goods/              # 商品管理
│   │   ├── goods-categories/   # 商品分类
│   │   ├── orders/             # 订单管理
│   │   ├── card-keys/          # 卡密管理
│   │   ├── config/             # 系统配置
│   │   ├── withdrawal-logs/    # 提现日志
│   │   ├── ad-watch-logs/      # 广告观看日志
│   │   ├── scores/             # 积分记录
│   │   └── fund-pool-logs/     # 资金池日志
│   ├── system/                 # 系统管理模块
│   │   ├── menu/               # 菜单管理
│   │   ├── permission/         # 权限管理
│   │   ├── role/               # 角色管理
│   │   ├── user/               # 用户管理
│   │   ├── app/                # 应用管理
│   │   └── tag/                # 标签管理
│   └── uni-stat/               # uni统计模块
├── components/                 # 组件目录
│   ├── uni-nav-menu/           # 导航菜单
│   ├── uni-stat-table/         # 统计表格
│   ├── uni-stat-panel/         # 统计面板
│   └── ...                     # 其他组件
├── store/                      # Vuex 状态管理
├── js_sdk/                     # JavaScript SDK
├── uni_modules/                # uni-app 模块
├── uniCloud/                   # 云服务
│   ├── cloudfunctions/         # 云函数
│   └── database/               # 数据库初始化
├── static/                     # 静态资源
├── admin.config.js             # 管理后台配置
├── App.vue                     # App.vue文件
├── main.js                     # 入口文件
├── manifest.json               # 应用清单配置
├── pages.json                  # 页面路由配置
└── package.json                # 项目依赖配置
```

#### 3.1 核心目录说明

**pages/** - 页面文件目录（前端页面）
- 所有页面按功能模块组织
- 每个页面包含 `.vue` 文件

**uniCloud/** - 云服务相关（后端API）
- 云函数、云对象、数据库初始化脚本

---

### 4. 部署指南

#### 4.1 部署到线上环境


**一键部署**

在 HBuilderX 中选择"发行" → "上传网站到服务器" → "选择对应的服务空间"，如下图所示

![](https://web-ext-storage.dcloud.net.cn/doc/share-fission/14a885aa-df30-461b-b2de-3eb8ae12c327.png)

---

### 5. 开发指南

#### 5.1 添加新页面

**步骤 1：创建页面文件**

在 `pages/sf-admin/` 下创建新目录和文件：
```
pages/sf-admin/my-feature/
└── list.vue
```

**步骤 2：编写页面代码**

```vue
<template>
  <view class="uni-container">
    <uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
    <view class="uni-header">
      <uni-stat-tabs :current="0" :tabs="tabs" />
    </view>
    <!-- 页面内容 -->
  </view>
</template>

<script>
export default {
  data() {
    return {
      // 数据
    }
  },
  methods: {
    // 方法
  }
}
</script>
```

**步骤 3：配置路由**

在 `pages.json` 中添加页面配置：
```json
{
  "path": "sf-admin/my-feature/list",
  "style": {
    "navigationBarTitleText": "我的功能"
  }
}
```

**步骤 4：添加菜单**

在系统管理 → 菜单管理中添加菜单项。

#### 5.2 扩展后端接口

本项目使用 **云对象** 架构，所有业务接口都通过 `share-fission-co` 云对象统一管理。

**步骤 1：创建业务模块**

在 `uniCloud-alipay/cloudfunctions/share-fission-co/module/` 下创建新模块文件：

```
uniCloud-alipay/cloudfunctions/share-fission-co/module/
├── admin/              # 管理端模块
│   ├── demo.js         # 示例模块
│   ├── user.js         # 用户管理
│   └── goods.js        # 商品管理
├── client/             # 客户端模块
└── notify/             # 通知模块
```

**步骤 2：编写模块代码**

在 `module/admin/` 下创建 `myModule.js`：

```javascript
/**
 * 我的模块 - 控制器层
 */
const service = require('../../service');
const { fail } = require('../../libs/response');

module.exports = {
  // 函数执行前钩子
  async _before() {
    // 登录验证中间件
    await this.middleware.auth();
  },

  // 函数执行后钩子
  _after(error, result) {
    if (error) {
      throw error
    }
    if (typeof result === "object" && !result.errCode) result.errCode = 0;
    return result
  },

  // 查询列表
  async getList(data = {}) {
    // 业务逻辑
    return {
      data: [],
      total: 0
    }
  },

  // 查询详情
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });
    // 业务逻辑
    return { data: {} }
  }
}
```

**步骤 3：前端调用接口**

在页面中通过 `uniCloud.importObject` 调用云对象方法：

```javascript
const shareFissionCo = uniCloud.importObject('share-fission-co');

// 调用接口
const res = await shareFissionCo.action({
  name: 'admin/myModule/getList',  // 格式：group/moduleName/method
  data: {
    pageSize: 10,
    pageNum: 1
  }
});
```

**步骤 4：上传云对象**

右键 `share-fission-co` 目录 → 上传部署

#### 5.3 使用 Claude Code 的 skills 快速开发

本项目配置了多个 Claude 技能（位于 `.claude/skills/` 目录），可以通过 Claude Code CLI 快速完成常见开发任务。

**可用技能列表**

| 技能命令 | 功能说明 | 使用场景 |
|---------|---------|---------|
| `/crud-table` | 快速创建 CRUD 表格页面 | 创建带增删改查功能的管理页面 |
| `/uniapp-pages-add` | 新增 uni-app 页面 | 创建新页面并自动配置路由 |
| `/unicloud-database` | 数据库表操作 | 创建数据库表结构、索引和初始数据 |

**使用示例**

1. **快速创建 CRUD 表格页面**
   ```bash
   # 在 Claude Code CLI 中输入
   /crud-table 表名
   ```
   技能会自动完成：
   - 创建页面文件（table.vue + options.js）
   - 创建云对象模块（module/admin/xxx.js）
   - 创建云对象服务（service/xxx.js）
   - 创建数据库表结构（schema + index + init_data）
   - 注册页面路由（pages.json）
   - 添加菜单配置（admin.config.js，你最终需要把这个菜单配置手动添加到数据库）

2. **创建新页面**
   ```bash
   /uniapp-pages-add
   ```
   自动完成页面创建和路由注册。

3. **创建数据库表**
   ```bash
   /unicloud-database
   ```
   自动生成表结构文件（schema.json、index.json、init_data.json）。

**技能优势**

- **标准化**：自动遵循项目架构规范和代码风格
- **高效**：一键生成完整的功能模块，无需手动创建多个文件
- **准确**：基于项目模板文件生成，避免遗漏关键配置
- **智能**：会根据需求询问功能范围（全量 CRUD 或部分功能）

**注意事项**

- 使用技能前，Claude 会询问具体需求（如表名、字段、功能范围等）
- 生成的代码会参考项目中的 demo 示例文件
- 新增的页面会自动添加到 `admin.config.js` 的静态菜单中
- 所有技能生成的代码都遵循 Vue3 Composition API + `<script setup>` 语法

---

## 附录

### 相关链接

- [uni-app 文档](https://uniapp.dcloud.net.cn/)
- [uni-admin 文档](https://doc.dcloud.net.cn/uniCloud/admin.html)
- [uni-ad 文档](https://uniad.dcloud.net.cn/login)
- [uniCloud 文档](https://doc.dcloud.net.cn/uniCloud/)
- [uniCloud 发行](https://doc.dcloud.net.cn/uniCloud/publish.html)

---