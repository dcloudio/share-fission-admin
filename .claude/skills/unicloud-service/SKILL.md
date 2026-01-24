# uniCloud 云对象服务层技能

## 触发条件
- 文件匹配: `uniCloud-*/cloudfunctions/*/service/*.js`
- 用户请求创建云对象服务/数据库操作

## 架构说明
服务层 (service) 负责：
- 数据库操作
- 业务逻辑处理
- 数据格式化

## 目录结构
```
service/
├── index.js        # 统一导出入口
├── demo.js         # demo 服务
└── config.js       # config 服务
```

模块层通过 `require('../../service')` 统一导入所有服务。

## 核心模式

### 1. 基础结构
```javascript
/**
 * XXX 表 - 服务实现层
 */
const db = uniCloud.database();
const _ = db.command;

const libs = require('../libs');
const collection = db.collection('xxx-table');

module.exports = {
  // 方法定义
};
```

### 2. 统一导出入口 (service/index.js)
```javascript
const config = require('./config');
const demo = require('./demo');

module.exports = {
  config,
  demo
};
```

### 3. 分页查询
```javascript
async getList(data = {}) {
  let { pageIndex = 1, pageSize = 20, keyword = '' } = data;

  let where = {};
  // 关键词搜索 (多字段模糊匹配)
  if (keyword) {
    where = _.or([
      { name: new RegExp(keyword, 'i') },
      { department: new RegExp(keyword, 'i') }
    ]);
  }

  const skip = (pageIndex - 1) * pageSize;
  let { data: list } = await collection
    .where(where)
    .orderBy('create_time', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get();
  let { total } = await collection.where(where).count();

  return { list, total };
}
```

### 4. 单条查询
```javascript
async getById(_id) {
  const { data: [info] } = await collection.doc(_id).get();
  return info;
}
```

### 5. 新增记录 (字段过滤)
```javascript
async add(data = {}) {
  // 解构排除不应写入的字段
  const { _id, create_time, update_time, ...record } = data;
  record.create_time = Date.now();
  const { id } = await collection.add(record);
  return { id };
}
```

### 6. 更新记录 (字段过滤)
```javascript
async update(_id, data = {}) {
  // 解构排除敏感字段
  const { _id: __, create_time, ...rest } = data;
  const updateData = {
    ...rest,
    update_time: Date.now()
  };
  const { updated } = await collection.doc(_id).update(updateData);
  return { updated };
}
```

### 7. 批量删除
```javascript
async remove(ids) {
  if (!Array.isArray(ids)) ids = [ids];
  const { deleted } = await collection.where({ _id: _.in(ids) }).remove();
  return { deleted };
}
```

### 8. 完整示例
```javascript
/**
 * Demo 示例表 - 服务实现层
 */
const db = uniCloud.database();
const _ = db.command;

const libs = require('../libs');
const collection = db.collection('sf-demo-employee');

module.exports = {
  async getList(data = {}) {
    let { pageIndex = 1, pageSize = 20, keyword = '' } = data;

    let where = {};
    if (keyword) {
      where = _.or([
        { name: new RegExp(keyword, 'i') },
        { department: new RegExp(keyword, 'i') }
      ]);
    }

    const skip = (pageIndex - 1) * pageSize;
    let { data: list } = await collection.where(where).orderBy('create_time', 'desc').skip(skip).limit(pageSize).get();
    let { total } = await collection.where(where).count();

    return { list, total };
  },

  async getById(_id) {
    const { data: [info] } = await collection.doc(_id).get();
    return info;
  },

  async add(data = {}) {
    const { _id, create_time, update_time, ...record } = data;
    record.create_time = Date.now();
    const { id } = await collection.add(record);
    return { id };
  },

  async update(_id, data = {}) {
    const { _id: __, create_time, ...rest } = data;
    const updateData = {
      ...rest,
      update_time: Date.now()
    };
    const { updated } = await collection.doc(_id).update(updateData);
    return { updated };
  },

  async remove(ids) {
    if (!Array.isArray(ids)) ids = [ids];
    const { deleted } = await collection.where({ _id: _.in(ids) }).remove();
    return { deleted };
  }
};
```

## 常用命令操作符
```javascript
const _ = db.command;

// 比较
_.eq(value)    // 等于
_.neq(value)   // 不等于
_.gt(value)    // 大于
_.gte(value)   // 大于等于
_.lt(value)    // 小于
_.lte(value)   // 小于等于

// 逻辑
_.and([...])   // 与
_.or([...])    // 或
_.not(...)     // 非

// 数组
_.in([...])    // 在数组中
_.nin([...])   // 不在数组中

// 字段
_.exists(true) // 字段存在
_.set(value)   // 设置字段值
_.remove()     // 删除字段
_.inc(n)       // 自增
```

## 注意事项
- 新增时过滤 `_id`, `create_time`, `update_time` 等系统字段
- 更新时过滤 `_id`, `create_time` 等不可变字段
- 使用 `Date.now()` 记录时间戳
- 批量删除使用 `_.in(ids)` 而非循环删除
- 分页公式: `skip = (pageIndex - 1) * pageSize`
- 每个新增的 service 文件需要在 `service/index.js` 中导出
