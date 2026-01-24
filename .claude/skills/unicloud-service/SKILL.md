# uniCloud 云对象服务层技能

## 触发条件
- 用户请求创建云对象服务/数据库操作

## 参考文件
创建云对象服务时，请先读取以下文件作为参考模板：

| 类型 | 文件路径 |
|------|----------|
| 服务示例 | `uniCloud-alipay/cloudfunctions/share-fission-co/service/demo.js` |
| 统一导出 | `uniCloud-alipay/cloudfunctions/share-fission-co/service/index.js` |

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
- 每个函数的每个请求参数都要写注释说明
