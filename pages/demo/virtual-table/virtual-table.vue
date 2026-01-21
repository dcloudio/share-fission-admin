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
					:total="filteredData.length"
          background
					layout="total, sizes, prev, pager, next, jumper"
					@size-change="handleSizeChange"
					@current-change="handlePageChange"
				/>
			</view>
		</view>
	</view>
</template>

<script>
  import { ElTableV2, ElAutoResizer, ElMessage, ElMessageBox } from 'element-plus'
  import { Plus, Download, Refresh, Search } from '@element-plus/icons-vue'
  import { generateMockData, columns } from './mockData.js'

  export default {
    name: 'GeneralTable',

    components: {
      ElTableV2,
      ElAutoResizer,
      Plus,
      Download,
      Refresh,
      Search
    },

    data() {
      return {
        // 加载状态
        loading: false,
        // 搜索关键词
        searchVal: '',
        // 表格高度
        tableHeight: 500,

        // 页面配置
        pageConfig: {
          title: '数据管理',
          subTitle: '通用表格展示页面，支持大数据量虚拟滚动',
          showAdd: true,
          showExport: true,
          showRefresh: true,
          searchPlaceholder: '搜索姓名、部门...',
          searchFields: ['name', 'department'] // 搜索字段
        },

        // 批量操作按钮配置
        batchActions: [
          { label: '批量删除', type: 'danger', action: 'batchDelete' },
        ],

        // 行操作按钮配置
        rowActions: [
          { label: '查看', type: 'primary', action: 'view' },
          { label: '编辑', type: 'warning', action: 'edit' },
          { label: '删除', type: 'danger', action: 'delete' }
        ],

        // 表格数据
        tableData: [],
        filteredData: [],
        tableColumns: [],

        // 选中的行
        selectedRows: [],

        // 分页配置
        pagination: {
          currentPage: 1,
          pageSize: 20
        }
      }
    },

    computed: {
      // 计算列配置（添加选择列和操作列）
      computedColumns() {
        const cols = [{
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
          ...this.tableColumns,
          {
            key: 'actions',
            title: '操作',
            width: 180,
            align: 'center',
            fixed: 'right'
          }
        ]
        return cols
      },

      // 分页后的数据
      pagedData() {
        const start = (this.pagination.currentPage - 1) * this.pagination.pageSize
        const end = start + this.pagination.pageSize
        return this.filteredData.slice(start, end)
      },

      // 是否全选当页
      isAllSelected() {
        if (this.pagedData.length === 0) return false
        return this.pagedData.every(row => this.isRowSelected(row))
      },

      // 是否部分选中
      isIndeterminate() {
        if (this.pagedData.length === 0) return false
        const selectedCount = this.pagedData.filter(row => this.isRowSelected(row)).length
        return selectedCount > 0 && selectedCount < this.pagedData.length
      }
    },

    created() {
      this.initColumns()
    },

    onLoad() {
      this.loadData()
      setTimeout(() => {
        this.calculateTableHeight()
      }, 300);
    },

    methods: {
      // 初始化列配置
      initColumns() {
        this.tableColumns = [...columns]
      },

      // 计算表格高度
      calculateTableHeight() {
        this.$nextTick(() => {
          const windowHeight = uni.getSystemInfoSync().windowHeight
          const tableContainer = this.$refs.tableContainer?.$el || this.$refs.tableContainer
          if (tableContainer) {
            const rect = tableContainer.getBoundingClientRect()
            this.tableHeight = windowHeight - rect.top - 100
          } else {
            // 备用方案
            this.tableHeight = windowHeight - 280
          }
        })
      },

      // 加载数据
      loadData() {
        this.loading = true
        setTimeout(() => {
          this.tableData = generateMockData(1000)
          this.filteredData = [...this.tableData]
          this.loading = false
        }, 300)
      },

      // 格式化数字
      formatNumber(num) {
        if (num === null || num === undefined) return '-'
        return num.toLocaleString()
      },

      // 获取状态标签类型
      getStatusType(status) {
        const typeMap = {
          '在职': 'success',
          '离职': 'danger',
          '休假': 'warning',
          '试用期': 'info'
        }
        return typeMap[status] || 'info'
      },

      // 获取行样式类
      getRowClass({ rowIndex }) {
        return rowIndex % 2 === 0 ? 'row-even' : 'row-odd'
      },

      // ========== 搜索相关 ==========
      handleSearch() {
        const keyword = this.searchVal.trim().toLowerCase()
        if (!keyword) {
          this.filteredData = [...this.tableData]
        } else {
          this.filteredData = this.tableData.filter(item => {
            return this.pageConfig.searchFields.some(field => {
              const value = item[field]
              return value && String(value).toLowerCase().includes(keyword)
            })
          })
        }
        // 搜索后重置到第一页
        this.pagination.currentPage = 1
        // 清空选中
        this.selectedRows = []
      },

      handleReset() {
        this.searchVal = ''
        this.filteredData = [...this.tableData]
        this.pagination.currentPage = 1
        this.selectedRows = []
      },

      // ========== 工具栏操作 ==========
      handleAdd() {
        ElMessage.success('点击了新增按钮')
        // TODO: 打开新增弹窗
      },

      handleRefresh() {
        this.searchVal = ''
        this.selectedRows = []
        this.pagination.currentPage = 1
        this.loadData()
        ElMessage.success('刷新成功')
      },

      // ========== 选择相关 ==========
      isRowSelected(row) {
        return this.selectedRows.some(r => r.id === row.id)
      },

      handleRowSelect(row, selected) {
        if (selected) {
          if (!this.isRowSelected(row)) {
            this.selectedRows.push(row)
          }
        } else {
          this.selectedRows = this.selectedRows.filter(r => r.id !== row.id)
        }
      },

      handleSelectAll(selected) {
        if (selected) {
          // 添加当页所有未选中的行
          this.pagedData.forEach(row => {
            if (!this.isRowSelected(row)) {
              this.selectedRows.push(row)
            }
          })
        } else {
          // 移除当页所有行
          const pageIds = this.pagedData.map(r => r.id)
          this.selectedRows = this.selectedRows.filter(r => !pageIds.includes(r.id))
        }
      },

      // ========== 分页相关 ==========
      handleSizeChange(size) {
        this.pagination.pageSize = size
        this.pagination.currentPage = 1
      },

      handlePageChange(page) {
        this.pagination.currentPage = page
      },

      // ========== 行操作 ==========
      handleRowAction(action, row) {
        switch (action) {
          case 'view':
            ElMessage.info(`查看：${row.name}`)
            // TODO: 打开详情弹窗
            break
          case 'edit':
            ElMessage.info(`编辑：${row.name}`)
            // TODO: 打开编辑弹窗
            break
          case 'delete':
            this.confirmDelete([row])
            break
          default:
            console.log('未知操作:', action, row)
        }
      },

      // ========== 批量操作 ==========
      handleBatchAction(action) {
        if (this.selectedRows.length === 0) {
          ElMessage.warning('请先选择数据')
          return
        }

        switch (action) {
          case 'batchDelete':
            this.confirmDelete(this.selectedRows)
            break
          case 'batchExport':
            ElMessage.success(`批量导出 ${this.selectedRows.length} 条数据`)
            // TODO: 实现批量导出
            break
          default:
            console.log('未知批量操作:', action)
        }
      },

      // 确认删除
      confirmDelete(rows) {
        const names = rows.map(r => r.name).join('、')
        const tip = rows.length > 3 ? `${rows.length} 条数据` : names

        ElMessageBox.confirm(
          `确定要删除 ${tip} 吗？`,
          '删除确认', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          // 执行删除
          const ids = rows.map(r => r.id)
          this.tableData = this.tableData.filter(r => !ids.includes(r.id))
          this.filteredData = this.filteredData.filter(r => !ids.includes(r.id))
          this.selectedRows = this.selectedRows.filter(r => !ids.includes(r.id))
          ElMessage.success('删除成功')
        }).catch(() => {
          // 取消删除
        })
      }
    }
  }
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
