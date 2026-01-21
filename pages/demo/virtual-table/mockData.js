/**
 * 生成大量模拟数据，用于演示虚拟表格的性能优势
 * @param {number} count - 生成的数据条数
 * @returns {Array} 模拟数据数组
 */
export function generateMockData(count = 10000) {
  const data = []
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']
  const departments = ['技术部', '产品部', '设计部', '市场部', '运营部', '财务部', '人事部']
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州']
  const statuses = ['在职', '离职', '休假', '试用期']

  for (let i = 0; i < count; i++) {
    const randomName = names[Math.floor(Math.random() * names.length)]
    const randomDept = departments[Math.floor(Math.random() * departments.length)]
    const randomCity = cities[Math.floor(Math.random() * cities.length)]
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

    data.push({
      id: i + 1,
      name: `${randomName}${i + 1}`,
      age: Math.floor(Math.random() * 30) + 22,
      email: `user${i + 1}@example.com`,
      phone: `1${Math.floor(Math.random() * 9) + 3}${String(Math.random()).slice(2, 11)}`,
      department: randomDept,
      city: randomCity,
      address: `${randomCity}市某某区某某路${Math.floor(Math.random() * 1000) + 1}号`,
      salary: Math.floor(Math.random() * 30000) + 5000,
      joinDate: `202${Math.floor(Math.random() * 4)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      status: randomStatus
    })
  }

  return data
}

/**
 * 定义表格列配置
 */
export const columns = [
  { key: 'id', dataKey: 'id', title: 'ID', width: 80 },
  { key: 'name', dataKey: 'name', title: '姓名', width: 120 },
  { key: 'age', dataKey: 'age', title: '年龄', width: 80, align: 'center' },
  { key: 'department', dataKey: 'department', title: '部门', width: 120 },
  { key: 'city', dataKey: 'city', title: '城市', width: 100 },
  { key: 'email', dataKey: 'email', title: '邮箱', width: 200 },
  { key: 'phone', dataKey: 'phone', title: '电话', width: 140 },
  { key: 'address', dataKey: 'address', title: '地址', minWidth: 280, maxWidth: 350 },
  { key: 'salary', dataKey: 'salary', title: '薪资', width: 120, align: 'right' },
  { key: 'joinDate', dataKey: 'joinDate', title: '入职日期', width: 120 },
  { key: 'status', dataKey: 'status', title: '状态', width: 100, align: 'center' },
]

export default {
  generateMockData,
  columns
}
