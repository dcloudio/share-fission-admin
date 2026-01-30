/**
 * 定义表格列配置 - 每日广告收益记录
 */
export const columns = [
  { key: 'statement_date', dataKey: 'statement_date', title: '结算日期', width: 140, align: 'center' },
  { key: 'total_cash', dataKey: 'total_cash', title: '广告收入', width: 120, align: 'right', sortable: true },
  { key: 'total_score', dataKey: 'total_score', title: '发放积分', width: 120, align: 'right', sortable: true },
  { key: 'total_people', dataKey: 'total_people', title: '观看人数', width: 120, align: 'right', sortable: true },
  { key: 'total_times', dataKey: 'total_times', title: '观看次数', width: 120, align: 'right', sortable: true },
  { key: 'is_settled', dataKey: 'is_settled', title: '结算状态', width: 120, align: 'center' },
  { key: 'remark', dataKey: 'remark', title: '备注', width: 200 },
]

export default {
  columns
}
