# uniCloud 云对象模块层技能

## 触发条件
- 文件匹配: `uniCloud-*/cloudfunctions/*/module/*.js`
- 用户请求创建云对象模块/控制器

## 架构说明
模块层 (module) 是控制器层，负责：
- 参数校验
- 调用 service 层
- 返回统一格式

## 核心模式

### 1. 基础结构
```javascript
/**
 * XXX 模块 - 控制器层
 */
const xxxService = require('../service/xxx');

// 统一错误返回函数
const fail = (errMsg, errCode = 'PARAM_ERROR') => ({ errCode, errMsg });

class Xxx {
  async method(data = {}) {
    // 参数校验
    // 调用 service
    // 返回结果
  }
}

module.exports = new Xxx();
```

### 2. 参数校验
```javascript
async getById(data = {}) {
  const { _id } = data;
  if (!_id) return fail('缺少参数 _id');
  return await xxxService.getById(_id);
}

async add(data = {}) {
  const { name } = data;
  if (!name) return fail('姓名不能为空');
  return await xxxService.add(data);
}

async update(data = {}) {
  const { _id, ...updateData } = data;
  if (!_id) return fail('缺少参数 _id');
  return await xxxService.update(_id, updateData);
}

async remove(data = {}) {
  const { ids } = data;
  if (!ids || !ids.length) return fail('缺少参数 ids');
  return await xxxService.remove(ids);
}
```

### 3. 完整示例
```javascript
/**
 * Demo 员工表 - 模块控制器层
 */
const demoService = require('../service/demo');

const fail = (errMsg, errCode = 'PARAM_ERROR') => ({ errCode, errMsg });

class Demo {
  async getList(data = {}) {
    return await demoService.getList(data);
  }

  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail('缺少参数 _id');
    return await demoService.getById(_id);
  }

  async add(data = {}) {
    const { name } = data;
    if (!name) return fail('姓名不能为空');
    return await demoService.add(data);
  }

  async update(data = {}) {
    const { _id, ...updateData } = data;
    if (!_id) return fail('缺少参数 _id');
    return await demoService.update(_id, updateData);
  }

  async remove(data = {}) {
    const { ids } = data;
    if (!ids || !ids.length) return fail('缺少参数 ids');
    return await demoService.remove(ids);
  }
}

module.exports = new Demo();
```

## 注意事项
- 模块层只做参数校验，不做业务逻辑
- 使用 `fail()` 函数统一错误返回格式
- update 方法接收完整 data，内部分离 `_id` 和更新数据
- remove 方法接收 `ids` 数组，支持批量删除
