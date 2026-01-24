# uniCloud 云对象模块层技能

## 触发条件
- 文件匹配: `uniCloud-*/cloudfunctions/*/module/**/*.js`
- 用户请求创建云对象模块/控制器

## 架构说明
模块层 (module) 是控制器层，负责：
- 鉴权 (通过 `_before` 钩子)
- 参数校验
- 调用 service 层
- 返回统一格式

## 目录结构
```
module/
├── admin/           # admin 分组
│   ├── demo.js      # demo 模块
│   └── config.js    # config 模块
└── api/             # api 分组 (可选)
    └── ...
```

前端调用路由格式: `{group}/{module}/{method}`
- 示例: `admin/demo/getList` → `module/admin/demo.js` 的 `getList` 方法

## 核心模式

### 1. 基础结构 (对象字面量)
```javascript
/**
 * XXX 模块 - 控制器层
 */
const service = require('../../service');
const libs = require('../../libs');
const fail = libs.response.fail;

module.exports = {
  // 函数执行前钩子 (鉴权)
  async _before() {
    await this.middleware.auth();
  },

  // 方法定义
  async method(data = {}) {
    // 参数校验
    // 调用 service
    // 返回结果
  }
}
```

### 2. 钩子函数
```javascript
module.exports = {
  // 前置钩子: 鉴权、日志等
  async _before() {
    await this.middleware.auth();  // 调用鉴权中间件
  },

  // 后置钩子 (可选): 结果处理、日志等
  async _after(result, error) {
    if (error) {
      // 错误处理
    }
    return result;
  },

  // 业务方法...
}
```

### 3. 参数校验
```javascript
async getById(data = {}) {
  const { _id } = data;
  if (!_id) return fail('缺少参数 _id');
  return await service.demo.getById(_id);
}

async add(data = {}) {
  const { name } = data;
  if (!name) return fail('姓名不能为空');
  return await service.demo.add(data);
}

async update(data = {}) {
  const { _id, ...updateData } = data;
  if (!_id) return fail('缺少参数 _id');
  return await service.demo.update(_id, updateData);
}

async remove(data = {}) {
  const { ids } = data;
  if (!ids || !ids.length) return fail('缺少参数 ids');
  return await service.demo.remove(ids);
}
```

### 4. 完整示例
```javascript
/**
 * Demo 示例 - 模块控制器层
 */
const service = require('../../service');
const libs = require('../../libs');
const fail = libs.response.fail;

module.exports = {
  // 函数执行前钩子
  async _before() {
    await this.middleware.auth();
  },

  // 查列表
  async getList(data = {}) {
    return await service.demo.getList(data);
  },

  // 查详情
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail('缺少参数 _id');
    return await service.demo.getById(_id);
  },

  // 添加
  async add(data = {}) {
    const { name } = data;
    if (!name) return fail('姓名不能为空');
    return await service.demo.add(data);
  },

  // 修改
  async update(data = {}) {
    const { _id, ...updateData } = data;
    if (!_id) return fail('缺少参数 _id');
    return await service.demo.update(_id, updateData);
  },

  // 删除
  async remove(data = {}) {
    const { ids } = data;
    if (!ids || !ids.length) return fail('缺少参数 ids');
    return await service.demo.remove(ids);
  }
}
```

## 注意事项
- 模块层只做参数校验，不做业务逻辑
- 使用 `libs.response.fail()` 函数统一错误返回格式
- 通过 `require('../../service')` 统一导入 service
- update 方法接收完整 data，内部分离 `_id` 和更新数据
- remove 方法接收 `ids` 数组，支持批量删除
- `_before` 钩子用于统一鉴权，调用 `this.middleware.auth()`
