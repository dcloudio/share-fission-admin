<template>
  <view class="page-container">
    <!-- 页面头部 -->
    <page-header title="每日广告收益记录" sub-title="管理每日广告收益统计数据" />

    <!-- 工具栏区域 -->
    <view class="toolbar">
      <view class="toolbar-left"></view>
      <view class="toolbar-right">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 260px"
          @change="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </view>
    </view>

    <!-- 表格区域 -->
    <view class="table-container" ref="tableContainer">
      <div class="virtual-table-wrapper pc-only" v-loading="loading">
        <el-auto-resizer>
          <template #default="{ height, width }">
            <el-table-v2
              ref="tableRef"
              :columns="computedColumns"
              :data="tableData.list"
              :width="width"
              :height="tableHeight"
              :row-height="54"
              :header-height="48"
              row-key="_id"
              fixed
              :row-class="getRowClass"
            >
              <template #header-cell="{ column }">
                <template v-if="column.sortable">
                  <view class="sortable-header" @click="handleSort(column.key)">
                    <span>{{ column.title }}</span>
                    <view class="sort-icons">
                      <el-icon :class="{ active: sortState.field === column.key && sortState.order === 'asc' }"><CaretTop /></el-icon>
                      <el-icon :class="{ active: sortState.field === column.key && sortState.order === 'desc' }"><CaretBottom /></el-icon>
                    </view>
                  </view>
                </template>
                <template v-else>{{ column.title }}</template>
              </template>
              <template #cell="{ column, rowData, rowIndex }">
                <template v-if="column.key === 'index'">
                  {{ (pagination.currentPage - 1) * pagination.pageSize + rowIndex + 1 }}
                </template>
                <template v-else-if="column.key === 'total_cash'">
                  <span class="money-text">{{ formatNumber(rowData[column.key]) }}</span>
                </template>
                <template v-else-if="column.key === 'total_score' || column.key === 'total_people' || column.key === 'total_times'">
                  <span class="number-text">{{ formatNumber(rowData[column.key]) }}</span>
                </template>
                <template v-else-if="column.key === 'is_settled'">
                  <el-tag :type="rowData[column.key] ? 'success' : 'warning'" size="small" :disable-transitions="true">
                    {{ rowData[column.key] ? '已结算' : '未结算' }}
                  </el-tag>
                </template>
                <template v-else-if="column.key === 'actions'">
                  <view class="row-actions">
                    <el-button v-if="!rowData.is_settled" type="primary" size="small" link @click="handleFillRevenue(rowData)">填写广告收入</el-button>
                    <el-button type="primary" size="small" link @click="handleEditRemark(rowData)">备注</el-button>
                  </view>
                </template>
                <template v-else>{{ rowData[column.key] ?? '-' }}</template>
              </template>
            </el-table-v2>
          </template>
        </el-auto-resizer>
      </div>

      <!-- 移动端列表视图 -->
      <div class="mobile-list-container mobile-only" v-loading="loading">
        <template v-if="tableData.list.length > 0">
          <view class="mobile-card" v-for="(item, index) in tableData.list" :key="item._id">
            <view class="card-header">
              <view class="header-main">
                <text class="card-title">{{ item.statement_date }}</text>
                <el-tag :type="item.is_settled ? 'success' : 'warning'" size="small">
                  {{ item.is_settled ? '已结算' : '未结算' }}
                </el-tag>
              </view>
              <text class="card-index">#{{ (pagination.currentPage - 1) * pagination.pageSize + index + 1 }}</text>
            </view>

            <view class="card-body">
              <view class="info-row">
                <text class="label">总奖励</text>
                <text class="value money">{{ formatNumber(item.total_cash) }}</text>
              </view>
              <view class="info-row">
                <text class="label">总积分</text>
                <text class="value">{{ formatNumber(item.total_score) }}</text>
              </view>
              <view class="info-row">
                <text class="label">总人数</text>
                <text class="value">{{ formatNumber(item.total_people) }}</text>
              </view>
              <view class="info-row">
                <text class="label">总次数</text>
                <text class="value">{{ formatNumber(item.total_times) }}</text>
              </view>
              <view class="info-row" v-if="item.remark">
                <text class="label">备注</text>
                <text class="value">{{ item.remark }}</text>
              </view>
            </view>

            <view class="card-footer">
              <el-button v-if="!item.is_settled" type="primary" link size="small" @click="handleFillRevenue(item)">
                <el-icon><Money /></el-icon> 填写广告收入
              </el-button>
              <el-button type="primary" link size="small" @click="handleEditRemark(item)">
                <el-icon><Edit /></el-icon> 备注
              </el-button>
            </view>
          </view>
        </template>
        <el-empty v-else description="暂无数据" />
      </div>
    </view>

    <!-- 底部区域 -->
    <view class="table-footer">
      <view class="footer-left"></view>
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

    <!-- 填写广告收入弹窗 -->
    <el-dialog
      v-model="revenueDialogVisible"
      title="填写广告收入"
      width="500px"
      destroy-on-close
    >
      <el-form ref="revenueFormRef" :model="revenueFormData" :rules="revenueFormRules" label-width="100px">
        <el-form-item label="结算日期">
          <el-input v-model="revenueFormData.statement_date" disabled />
        </el-form-item>
        <el-form-item label="总奖励" prop="total_cash">
          <el-input-number 
            v-model="revenueFormData.total_cash" 
            :min="0" 
            :precision="0"
            :controls="false"
            style="width: 100%" 
            placeholder="请输入总奖励金额"
          />
        </el-form-item>
        <el-form-item label="总积分" prop="total_score">
          <el-input-number 
            v-model="revenueFormData.total_score" 
            :min="0" 
            :precision="0"
            :controls="false"
            style="width: 100%" 
            placeholder="请输入总积分"
          />
        </el-form-item>
        <el-form-item label="总人数" prop="total_people">
          <el-input-number 
            v-model="revenueFormData.total_people" 
            :min="0" 
            :precision="0"
            :controls="false"
            style="width: 100%" 
            placeholder="请输入总人数"
          />
        </el-form-item>
        <el-form-item label="总次数" prop="total_times">
          <el-input-number 
            v-model="revenueFormData.total_times" 
            :min="0" 
            :precision="0"
            :controls="false"
            style="width: 100%" 
            placeholder="请输入总次数"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="revenueFormData.remark" 
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="revenueDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleRevenueSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑备注弹窗 -->
    <el-dialog
      v-model="remarkDialogVisible"
      title="编辑备注"
      width="500px"
      destroy-on-close
    >
      <el-form ref="remarkFormRef" :model="remarkFormData" label-width="100px">
        <el-form-item label="结算日期">
          <el-input v-model="remarkFormData.statement_date" disabled />
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="remarkFormData.remark" 
            type="textarea"
            :rows="5"
            placeholder="请输入备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remarkDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleRemarkSubmit">确定</el-button>
      </template>
    </el-dialog>
  </view>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ElTableV2, ElAutoResizer, ElMessage } from 'element-plus'
import { Edit, Money, CaretTop, CaretBottom } from '@element-plus/icons-vue'
import { columns } from './options.js'

// 云对象
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true })

// ========== 状态 ==========
const loading = ref(false)
const tableHeight = ref(500)
const tableContainer = ref(null)
const tableRef = ref(null)
const revenueFormRef = ref(null)
const remarkFormRef = ref(null)

const dateRange = ref([])
const tableData = reactive({ list: [], total: 0 })
const pagination = reactive({ currentPage: 1, pageSize: 20 })

// 排序相关
const sortState = reactive({ field: '', order: '' })

// 填写广告收入弹窗
const revenueDialogVisible = ref(false)
const submitLoading = ref(false)
const revenueFormData = ref({
  _id: '',
  statement_date: '',
  total_cash: 0,
  total_score: 0,
  total_people: 0,
  total_times: 0,
  remark: ''
})

const revenueFormRules = {
  total_cash: [{ required: true, message: '请输入总奖励', trigger: 'blur' }],
  total_score: [{ required: true, message: '请输入总积分', trigger: 'blur' }],
  total_people: [{ required: true, message: '请输入总人数', trigger: 'blur' }],
  total_times: [{ required: true, message: '请输入总次数', trigger: 'blur' }]
}

// 编辑备注弹窗
const remarkDialogVisible = ref(false)
const remarkFormData = ref({
  _id: '',
  statement_date: '',
  remark: ''
})

// ========== 计算属性 ==========
const tableColumns = ref([...columns])

const computedColumns = computed(() => [
  { key: 'index', title: '序号', width: 70, align: 'center' },
  ...tableColumns.value,
  { key: 'actions', title: '操作', width: 200, align: 'center', fixed: 'right' }
])

// ========== 方法 ==========
const calculateTableHeight = () => {
  nextTick(() => {
    const windowHeight = uni.getSystemInfoSync().windowHeight
    const container = tableContainer.value?.$el || tableContainer.value
    tableHeight.value = container
      ? windowHeight - container.getBoundingClientRect().top - 100
      : windowHeight - 280
  })
}

const loadData = async () => {
  loading.value = true
  try {
    const data = {
      pageIndex: pagination.currentPage,
      pageSize: pagination.pageSize
    }
    
    // 日期范围搜索
    if (dateRange.value && dateRange.value.length === 2) {
      data.startDate = dateRange.value[0]
      data.endDate = dateRange.value[1]
    }
    
    // 添加排序参数
    if (sortState.field && sortState.order) {
      data.sortField = sortState.field
      data.sortOrder = sortState.order
    }
    
    const res = await sfCo.action({
      name: 'admin/adDailyRevenueRecord/getList',
      data
    })
    tableData.list = res.list || []
    tableData.total = res.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

const formatNumber = (num) => (num == null ? '-' : num.toLocaleString())

const getRowClass = ({ rowIndex }) => (rowIndex % 2 === 0 ? 'row-even' : 'row-odd')

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

const handleReset = () => {
  dateRange.value = []
  sortState.field = ''
  sortState.order = ''
  handleSearch()
}

// 分页
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadData()
}

const handlePageChange = (page) => {
  pagination.currentPage = page
  loadData()
}

// 排序
const handleSort = (field) => {
  if (sortState.field === field) {
    if (sortState.order === 'asc') {
      sortState.order = 'desc'
    } else if (sortState.order === 'desc') {
      sortState.field = ''
      sortState.order = ''
    } else {
      sortState.order = 'asc'
    }
  } else {
    sortState.field = field
    sortState.order = 'asc'
  }
  pagination.currentPage = 1
  loadData()
}

// 填写广告收入
const handleFillRevenue = (row) => {
  revenueFormData.value = {
    _id: row._id,
    statement_date: row.statement_date,
    total_cash: row.total_cash || 0,
    total_score: row.total_score || 0,
    total_people: row.total_people || 0,
    total_times: row.total_times || 0,
    remark: row.remark || ''
  }
  revenueDialogVisible.value = true
}

const handleRevenueSubmit = async () => {
  try {
    await revenueFormRef.value.validate()
  } catch {
    return
  }

  submitLoading.value = true
  try {
    await sfCo.action({
      name: 'admin/adDailyRevenueRecord/fillRevenue',
      data: revenueFormData.value
    })
    ElMessage.success('填写成功')
    revenueDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 编辑备注
const handleEditRemark = (row) => {
  remarkFormData.value = {
    _id: row._id,
    statement_date: row.statement_date,
    remark: row.remark || ''
  }
  remarkDialogVisible.value = true
}

const handleRemarkSubmit = async () => {
  submitLoading.value = true
  try {
    await sfCo.action({
      name: 'admin/adDailyRevenueRecord/updateRemark',
      data: {
        _id: remarkFormData.value._id,
        remark: remarkFormData.value.remark
      }
    })
    ElMessage.success('备注更新成功')
    remarkDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// ========== 生命周期 ==========
onLoad(() => {
  loadData()
  setTimeout(calculateTableHeight, 300)
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
    .el-button + .el-button {
      margin-left: 0;
    }
  }
}

.table-container {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;

  .virtual-table-wrapper {
    height: 100%;

    :deep(.el-table-v2) {
      .el-table-v2__header-cell,
      .el-table-v2__header {
        background-color: #fafafa;
        font-weight: 600;
        color: #606266;
      }

      .el-table-v2__row:hover .row-actions {
        opacity: 1;
      }
    }
  }
}

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

.sortable-header {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  gap: 4px;

  &:hover {
    color: #409eff;
  }

  .sort-icons {
    display: flex;
    flex-direction: column;
    line-height: 1;

    .el-icon {
      font-size: 12px;
      color: #c0c4cc;
      height: 8px;
      overflow: hidden;

      &.active {
        color: #409eff;
      }
    }
  }
}

.money-text {
  color: #f56c6c;
  font-weight: 500;
}

.number-text {
  color: #606266;
}

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
  }

  .footer-right {
    display: flex;
    align-items: center;
  }
}

/* Responsive visibility */
.mobile-only {
  display: none;
}

@media screen and (max-width: 768px) {
  .pc-only {
    display: none !important;
  }

  .mobile-only {
    display: block;
  }

  .page-container {
    padding: 12px;
    height: 100vh;
    overflow: hidden;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
    gap: 12px;

    .toolbar-left,
    .toolbar-right {
      width: 100%;
      justify-content: space-between;
    }

    :deep(.el-date-picker) {
      width: 100% !important;
    }
  }

  .table-container {
    background: transparent;
    border-radius: 0;

    .mobile-list-container {
      height: 100%;
      overflow-y: auto;
      padding-bottom: 20px;
    }

    .mobile-card {
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f0f2f5;

        .header-main {
          display: flex;
          align-items: center;
          gap: 8px;

          .card-title {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
          }
        }

        .card-index {
          font-size: 12px;
          color: #909399;
        }
      }

      .card-body {
        margin-bottom: 12px;

        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin-bottom: 8px;

          .label {
            color: #909399;
          }
          .value {
            color: #606266;
            &.money {
              color: #f56c6c;
              font-weight: 500;
            }
          }
        }
      }

      .card-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        border-top: 1px solid #f0f2f5;
        padding-top: 12px;
      }
    }
  }

  .table-footer {
    padding: 12px;

    .footer-left {
      display: none;
    }

    .footer-right {
      width: 100%;
      justify-content: center;

      :deep(.el-pagination) {
        flex-wrap: wrap;
        justify-content: center;

        .el-pagination__sizes,
        .el-pager,
        .el-pagination__jump {
          display: none !important;
        }
      }
    }
  }
}
</style>
