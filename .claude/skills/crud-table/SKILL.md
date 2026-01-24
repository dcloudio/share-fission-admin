# CRUD 表格页面技能

## 触发条件
- 文件匹配: `pages/**/table.vue`, `pages/**/list.vue`
- 用户请求创建 CRUD 表格页面

## 技术栈
- Vue3 Composition API + `<script setup>`
- Element Plus (el-table-v2 虚拟表格)
- uniCloud 云对象

## 核心模式

### 1. 云对象调用
```javascript
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true })

// 调用方式: group/module/method 三段式路由
const res = await sfCo.action({
  name: 'admin/demo/getList',  // 格式: {group}/{module}/{method}
  data: { /* 参数 */ }
})
```

### 2. 数据加载 (try/catch/finally)
```javascript
const loading = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const res = await sfCo.action({
      name: 'admin/demo/getList',
      data: { pageIndex: pagination.currentPage, pageSize: pagination.pageSize, keyword: searchVal.value.trim() }
    })
    tableData.list = res.list || []
    tableData.total = res.total || 0
  } catch (e) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false  // 始终在 finally 中重置 loading
  }
}
```

### 3. 编辑时深拷贝
```javascript
const handleEdit = (row) => {
  dialogType.value = 'edit'
  // 深拷贝防止修改原数据
  Object.assign(formData, JSON.parse(JSON.stringify(row)))
  dialogVisible.value = true
}
```

### 4. 表单提交 (成功才关闭)
```javascript
const submitLoading = ref(false)

const handleSubmit = async () => {
  // 表单验证
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitLoading.value = true
  try {
    const action = dialogType.value === 'add' ? 'admin/demo/add' : 'admin/demo/update'
    const submitData = { ...formData }
    if (dialogType.value === 'add') delete submitData._id  // 新增时去除 _id

    await sfCo.action({ name: action, data: submitData })
    ElMessage.success(dialogType.value === 'add' ? '新增成功' : '编辑成功')
    dialogVisible.value = false  // 成功才关闭
    loadData()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')  // 失败只提示，不关闭
  } finally {
    submitLoading.value = false
  }
}
```

### 5. 删除确认 (beforeClose 实现 loading)
```javascript
const handleDelete = (rows) => {
  const tip = rows.length > 3 ? `${rows.length} 条数据` : rows.map(r => r.name).join('、')

  ElMessageBox.confirm(`确定要删除 ${tip} 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    beforeClose: async (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true
        try {
          await sfCo.action({ name: 'admin/demo/remove', data: { ids: rows.map(r => r._id) } })
          ElMessage.success('删除成功')
          selectedRows.value = selectedRows.value.filter(r => !rows.some(d => d._id === r._id))
          loadData()
          done()  // 成功才关闭
        } catch (e) {
          ElMessage.error(e.message || '删除失败')
          instance.confirmButtonLoading = false  // 失败取消 loading
        }
      } else {
        done()
      }
    }
  }).catch(() => {})  // 处理取消的 Promise rejection
}
```

### 6. 虚拟表格结构
```vue
<template>
  <el-auto-resizer>
    <template #default="{ height, width }">
      <el-table-v2
        :columns="columns"
        :data="tableData.list"
        :width="width"
        :height="height"
        :row-key="_id"
        v-loading="loading"
      />
    </template>
  </el-auto-resizer>
</template>
```

### 7. 列配置 (options.js)
```javascript
export const columns = [
  { key: '_id', dataKey: '_id', title: 'ID', width: 220 },
  { key: 'name', dataKey: 'name', title: '姓名', width: 120 },
  { key: 'status', dataKey: 'status', title: '状态', width: 100, align: 'center' },
]
```

### 8. 移动端适配
使用 `@media` 查询和 CSS 类来区分 PC 端表格和移动端卡片列表。

```css
/* 响应式样式 */
.mobile-only { display: none; }

@media screen and (max-width: 768px) {
  .pc-only { display: none !important; }
  .mobile-only { display: block; }

  /* 分页简化：只显示 total, prev, next */
  :deep(.el-pagination) {
    .el-pagination__sizes,
    .el-pager,
    .el-pagination__jump {
      display: none !important;
    }
  }
}
```

**结构示例：**
```vue
<!-- PC 表格 -->
<div class="virtual-table-wrapper pc-only">
  <el-table-v2 ... />
</div>

<!-- 移动端列表 -->
<div class="mobile-list-container mobile-only">
  <view class="mobile-card" v-for="item in list" ...>
    <!-- 卡片内容 -->
  </view>
</div>
```

## 注意事项
- 使用 `_id` 而非 `id` (MongoDB 文档ID)
- 编辑前必须深拷贝，防止修改影响表格显示
- 所有异步操作使用 `try/catch/finally` 管理 loading
- 弹窗只在操作成功时关闭，失败时保持打开状态
- 移动端适配不应影响 PC 端样式，使用 `.pc-only` 和 `.mobile-only` 控制
