<template>
	<view class="page-container">
		<!-- 页面头部：标题和副标题 -->
		<view class="page-header">
			<view class="header-title-area">
				<view class="page-title">{{ pageConfig.title }}</view>
				<view class="page-subtitle" v-if="pageConfig.subTitle">{{ pageConfig.subTitle }}</view>
			</view>
		</view>

		<!-- 工具栏区域 -->
		<view class="toolbar">
			<!-- 左侧操作按钮 -->
			<view class="toolbar-left">
				<el-button type="primary" @click="handleAdd" v-if="pageConfig.showAdd">
					<el-icon><Plus /></el-icon>
					新增
				</el-button>
			</view>
			<!-- 右侧搜索区域 -->
			<view class="toolbar-right">
				<el-input
					v-model="searchVal"
					:placeholder="pageConfig.searchPlaceholder"
					clearable
					style="width: 220px"
					@keyup.enter="handleSearch"
				>
					<template #prefix>
						<el-icon><Search /></el-icon>
					</template>
				</el-input>
				<el-button type="primary" @click="handleSearch">搜索</el-button>
				<el-button @click="handleReset">重置</el-button>
			</view>
		</view>

		<!-- 表格区域 -->
		<view class="table-container" ref="tableContainer">
			<div class="virtual-table-wrapper" v-loading="loading">
				<el-auto-resizer>
					<template #default="{ height, width, minWidth }">
						<el-table-v2
							ref="tableRef"
							:columns="computedColumns"
							:data="pagedData"
							:width="width"
							:height="tableHeight"
							:row-height="54"
							:header-height="48"
							:fixed="false"
							row-key="id"
							:row-class="getRowClass"
						>
							<template #header-cell="{ column }">
								<!-- 选择列表头：全选复选框 -->
								<template v-if="column.key === 'selection'">
									<el-checkbox
										:model-value="isAllSelected"
										:indeterminate="isIndeterminate"
										@change="handleSelectAll"
									/>
								</template>
								<!-- 其他列表头 -->
								<template v-else>
									{{ column.title }}
								</template>
							</template>
							<template #cell="{ column, rowData, rowIndex }">
								<!-- 选择列 -->
								<template v-if="column.key === 'selection'">
									<el-checkbox
										:model-value="isRowSelected(rowData)"
										@change="(val) => handleRowSelect(rowData, val)"
									/>
								</template>
								<!-- 序号列 -->
								<template v-else-if="column.key === 'index'">
									{{ (pagination.currentPage - 1) * pagination.pageSize + rowIndex + 1 }}
								</template>
								<!-- 状态列 -->
								<template v-else-if="column.key === 'status'">
									<el-tag :type="getStatusType(rowData[column.key])" size="small">
										{{ rowData[column.key] }}
									</el-tag>
								</template>
								<!-- 薪资列 -->
								<template v-else-if="column.key === 'salary'">
									<span class="salary-text">¥ {{ formatNumber(rowData[column.key]) }}</span>
								</template>
								<!-- 操作列 -->
								<template v-else-if="column.key === 'actions'">
									<view class="row-actions">
										<el-button
											v-for="action in rowActions"
											:key="action.action"
											:type="action.type"
											size="small"
											link
											@click="handleRowAction(action.action, rowData)"
										>
											{{ action.label }}
										</el-button>
									</view>
								</template>
								<!-- 默认显示 -->
								<template v-else>
									{{ rowData[column.key] ?? '-' }}
								</template>
							</template>
						</el-table-v2>
					</template>
				</el-auto-resizer>
			</div>
		</view>

		<!-- 底部区域：批量操作 + 分页 -->
		<view class="table-footer">
			<!-- 左侧批量操作 -->
			<view class="footer-left">
				<template v-if="selectedRows.length > 0">
					<el-button
						v-for="action in batchActions"
						:key="action.action"
						:type="action.type"
						size="small"
						@click="handleBatchAction(action.action)"
					>
						{{ action.label }}
					</el-button>
					<span class="selected-info">已选择 {{ selectedRows.length }} 项</span>
				</template>
			</view>
			<!-- 右侧分页 -->
			<view class="footer-right">
				<el-pagination
					v-model:current-page="pagination.currentPage"
					v-model:page-size="pagination.pageSize"
					:page-sizes="[10, 20, 50, 100]"
					:total="tableData.total"
          background
					layout="total, sizes, prev, pager, next, jumper"
					@size-change="handleSizeChange"
					@current-change="handlePageChange"
				/>
			</view>
		</view>
	</view>
</template>

<script setup>
  import { ref, reactive, computed, onMounted, nextTick } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { ElTableV2, ElAutoResizer, ElMessage, ElMessageBox } from 'element-plus'
  import { Plus, Download, Refresh, Search } from '@element-plus/icons-vue'
  import { columns } from './options.js'

  // 云对象
  const testCo = uniCloud.importObject('sf-admin-co', {
    customUI: true
  });

  // ========== 模板引用 ==========
  const tableContainer = ref(null)
  const tableRef = ref(null)

  // ========== 响应式状态 ==========
  const loading = ref(false)
  const searchVal = ref('')
  const tableHeight = ref(500)

  const tableData = reactive({
    list: [],
    total: 0
  });

  // 页面配置
  const pageConfig = reactive({
    title: '数据管理',
    subTitle: '通用表格展示页面，支持大数据量虚拟滚动',
    showAdd: true,
    showExport: true,
    showRefresh: true,
    searchPlaceholder: '搜索姓名、部门...',
    searchFields: ['name', 'department']
  })

  // 批量操作按钮配置
  const batchActions = [
    { label: '批量删除', type: 'danger', action: 'batchDelete' }
  ]

  // 行操作按钮配置
  const rowActions = [
    { label: '查看', type: 'primary', action: 'view' },
    { label: '编辑', type: 'warning', action: 'edit' },
    { label: '删除', type: 'danger', action: 'delete' }
  ]

  // 表格数据
  const filteredData = ref([])
  const tableColumns = ref([...columns])

  // 选中的行
  const selectedRows = ref([])

  // 分页配置
  const pagination = reactive({
    currentPage: 1,
    pageSize: 20
  })

  // ========== 计算属性 ==========
  // 计算列配置（添加选择列和操作列）
  const computedColumns = computed(() => {
    return [
      {
        key: 'selection',
        title: '',
        width: 50,
        align: 'center'
      },
      {
        key: 'index',
        title: '序号',
        width: 70,
        align: 'center'
      },
      ...tableColumns.value,
      {
        key: 'actions',
        title: '操作',
        width: 180,
        align: 'center',
        fixed: 'right'
      }
    ]
  })

  // 分页后的数据
  const pagedData = computed(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return filteredData.value.slice(start, end)
  })

  // 是否全选当页
  const isAllSelected = computed(() => {
    if (pagedData.value.length === 0) return false
    return pagedData.value.every(row => isRowSelected(row))
  })

  // 是否部分选中
  const isIndeterminate = computed(() => {
    if (pagedData.value.length === 0) return false
    const selectedCount = pagedData.value.filter(row => isRowSelected(row)).length
    return selectedCount > 0 && selectedCount < pagedData.value.length
  })

  // ========== 方法 ==========
  // 计算表格高度
  const calculateTableHeight = () => {
    nextTick(() => {
      const windowHeight = uni.getSystemInfoSync().windowHeight
      const container = tableContainer.value?.$el || tableContainer.value
      if (container) {
        const rect = container.getBoundingClientRect()
        tableHeight.value = windowHeight - rect.top - 100
      } else {
        tableHeight.value = windowHeight - 280
      }
    })
  }

  // 加载数据
  const loadData = async () => {
    loading.value = true
    const { list, total } = await testCo.action({
      name: 'test.getList',
      data: {
        pageIndex: pagination.currentPage,
        pageSize: pagination.pageSize
      }
    })
    tableData.list = list
    tableData.total = total
    filteredData.value = [...list]
    loading.value = false
  }

  // 格式化数字
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '-'
    return num.toLocaleString()
  }

  // 获取状态标签类型
  const getStatusType = (status) => {
    const typeMap = {
      '在职': 'success',
      '离职': 'danger',
      '休假': 'warning',
      '试用期': 'info'
    }
    return typeMap[status] || 'info'
  }

  // 获取行样式类
  const getRowClass = ({ rowIndex }) => {
    return rowIndex % 2 === 0 ? 'row-even' : 'row-odd'
  }

  // ========== 搜索相关 ==========
  const handleSearch = () => {
    const keyword = searchVal.value.trim().toLowerCase()
    if (!keyword) {
      filteredData.value = [...tableData.list]
    } else {
      filteredData.value = tableData.list.filter(item => {
        return pageConfig.searchFields.some(field => {
          const value = item[field]
          return value && String(value).toLowerCase().includes(keyword)
        })
      })
    }
    pagination.currentPage = 1
    selectedRows.value = []
  }

  const handleReset = () => {
    searchVal.value = ''
    filteredData.value = [...tableData.list]
    pagination.currentPage = 1
    selectedRows.value = []
  }

  // ========== 工具栏操作 ==========
  const handleAdd = () => {
    ElMessage.success('点击了新增按钮')
  }

  const handleRefresh = () => {
    searchVal.value = ''
    selectedRows.value = []
    pagination.currentPage = 1
    loadData()
    ElMessage.success('刷新成功')
  }

  // ========== 选择相关 ==========
  const isRowSelected = (row) => {
    return selectedRows.value.some(r => r.id === row.id)
  }

  const handleRowSelect = (row, selected) => {
    if (selected) {
      if (!isRowSelected(row)) {
        selectedRows.value.push(row)
      }
    } else {
      selectedRows.value = selectedRows.value.filter(r => r.id !== row.id)
    }
  }

  const handleSelectAll = (selected) => {
    if (selected) {
      pagedData.value.forEach(row => {
        if (!isRowSelected(row)) {
          selectedRows.value.push(row)
        }
      })
    } else {
      const pageIds = pagedData.value.map(r => r.id)
      selectedRows.value = selectedRows.value.filter(r => !pageIds.includes(r.id))
    }
  }

  // ========== 分页相关 ==========
  const handleSizeChange = (size) => {
    pagination.pageSize = size
    pagination.currentPage = 1
  }

  const handlePageChange = (page) => {
    pagination.currentPage = page
  }

  // ========== 行操作 ==========
  const handleRowAction = (action, row) => {
    switch (action) {
      case 'view':
        ElMessage.info(`查看：${row.name}`)
        break
      case 'edit':
        ElMessage.info(`编辑：${row.name}`)
        break
      case 'delete':
        confirmDelete([row])
        break
      default:
        console.log('未知操作:', action, row)
    }
  }

  // ========== 批量操作 ==========
  const handleBatchAction = (action) => {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先选择数据')
      return
    }

    switch (action) {
      case 'batchDelete':
        confirmDelete(selectedRows.value)
        break
      case 'batchExport':
        ElMessage.success(`批量导出 ${selectedRows.value.length} 条数据`)
        break
      default:
        console.log('未知批量操作:', action)
    }
  }

  // 确认删除
  const confirmDelete = (rows) => {
    const names = rows.map(r => r.name).join('、')
    const tip = rows.length > 3 ? `${rows.length} 条数据` : names

    ElMessageBox.confirm(
      `确定要删除 ${tip} 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      const ids = rows.map(r => r.id)
      tableData.list = tableData.list.filter(r => !ids.includes(r.id))
      filteredData.value = filteredData.value.filter(r => !ids.includes(r.id))
      selectedRows.value = selectedRows.value.filter(r => !ids.includes(r.id))
      ElMessage.success('删除成功')
    }).catch(() => {
      // 取消删除
    })
  }

  // ========== 生命周期 ==========
  onLoad(() => {
    loadData()
    setTimeout(() => {
      calculateTableHeight()
    }, 300)
  })
</script>

<style lang="scss" scoped>
  page {
    background-color: #f5f7fa;
  }

  .page-container {
    display: flex;
    flex-direction: column;

    padding: 10px;
    box-sizing: border-box;
  }

  // 页面头部
  .page-header {
    background-color: #fff;
    padding: 20px 24px;
    border-radius: 8px;
    margin-bottom: 16px;

    .header-title-area {
      display: flex;
      align-items: baseline;
      gap: 12px;

      .page-title {
        font-size: 20px;
        font-weight: 600;
        color: #303133;
        line-height: 1.4;
      }

      .page-subtitle {
        font-size: 13px;
        color: #909399;
        line-height: 1.4;
      }
    }
  }

  // 工具栏
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    padding: 16px 24px;
    border-radius: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    :deep(.toolbar-right) {
      .el-button+.el-button {
        margin-left: 0px;
      }
    }
  }

  // 表格容器
  .table-container {
    flex: 1;
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden;
    min-height: 0;

    .virtual-table-wrapper {
      height: 100%;
      padding: 0;

      :deep(.el-table-v2) {

        .el-table-v2__header-cell,
        .el-table-v2__header-row-cell--placeholder {
          background-color: #fafafa;
          font-weight: 600;
          color: #606266;
        }

        .el-table-v2__row {
          &:hover {
            .row-actions {
              opacity: 1;
            }
          }
        }
      }

    }
  }

  // 行操作按钮
  .row-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    opacity: 0.7;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }

  // 薪资文本
  .salary-text {
    color: #f56c6c;
    font-weight: 500;
  }

  // 底部区域
  .table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    padding: 12px 24px;
    border-radius: 8px;
    margin-top: 16px;
    flex-wrap: wrap;
    gap: 12px;

    .footer-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .selected-info {
        color: #409eff;
        font-size: 14px;
        margin-left: 8px;
      }
    }

    .footer-right {
      display: flex;
      align-items: center;
    }
  }

  // 响应式适配
  @media screen and (max-width: 768px) {
    .page-container {
      padding: 12px;
    }

    .toolbar {
      flex-direction: column;
      align-items: flex-start;

      .toolbar-left,
      .toolbar-right {
        width: 100%;
      }
    }

    .table-footer {
      flex-direction: column;
      align-items: flex-start;

      .footer-left,
      .footer-right {
        width: 100%;
        justify-content: flex-start;
      }
    }
  }
</style>
