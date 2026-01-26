/**
 * 每日统计 - 表格列配置
 */
export const columns = [
  { key: '_id', dataKey: '_id', title: '日期', width: 120, sortable: true },
  { key: 'ad_revenue', dataKey: 'ad_revenue', title: '广告收益(元)', width: 120, align: 'right' },
  { key: 'score_added', dataKey: 'score_added', title: '新增积分', width: 100, align: 'right' },
  { key: 'score_consumed', dataKey: 'score_consumed', title: '消耗积分', width: 100, align: 'right' },
  { key: 'score_withdrawn', dataKey: 'score_withdrawn', title: '提现积分', width: 100, align: 'right' },
  { key: 'new_users', dataKey: 'new_users', title: '新增用户', width: 90, align: 'center' },
  { key: 'active_users', dataKey: 'active_users', title: '活跃用户', width: 90, align: 'center' },
  { key: 'total_cash', dataKey: 'total_cash', title: '资金池(元)', width: 120, align: 'right' },
  { key: 'total_score', dataKey: 'total_score', title: '资金池积分', width: 110, align: 'right' },
  { key: 'exchange_rate', dataKey: 'exchange_rate', title: '汇率', width: 80, align: 'center' },
]

export default {
  columns
}
