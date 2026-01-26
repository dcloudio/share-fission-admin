# uniCloud 数据库操作

## 触发条件
- 需要操作数据库时

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

- 正则查询时，不允许对满足objectid格式的字符串进行正则查询，故需要先判断如果满足objectid格式，则改为相等匹配

示例

```js
const libs = require('../libs'); 

let where = {};
// 关键词搜索
if (libs.common.isObjectId(keyword)) {
  where = _.or([
    { name: keyword },
    { department: keyword }
  ]);
} else {
  where = _.or([
    { name: new RegExp(keyword, 'i') },
    { department: new RegExp(keyword, 'i') }
  ]);
}
```


