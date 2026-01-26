/**
 * 商品管理表格列配置
 */
export const columns = [
  { key: 'image', dataKey: 'image', title: '图片', width: 80, align: 'center' },
  { key: 'name', dataKey: 'name', title: '商品名称', width: 180 },
  { key: 'category_name', dataKey: 'category_name', title: '分类', width: 100 },
  { key: 'score_cost', dataKey: 'score_cost', title: '所需积分', width: 100, align: 'right', sortable: true },
  { key: 'stock', dataKey: 'stock', title: '库存', width: 80, align: 'right', sortable: true },
  { key: 'sort_order', dataKey: 'sort_order', title: '排序', width: 80, align: 'center', sortable: true },
  { key: 'status', dataKey: 'status', title: '状态', width: 80, align: 'center' },
  { key: 'create_time', dataKey: 'create_time', title: '创建时间', width: 170, sortable: true },
]

export default {
  columns
}
