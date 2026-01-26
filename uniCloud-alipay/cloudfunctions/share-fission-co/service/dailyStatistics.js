/**
 * 每日统计表 - 服务实现层
 */
const db = uniCloud.database();
const _ = db.command;

const { Tables } = require('../constants');
const collection = db.collection(Tables.dailyStatistics);

module.exports = {
  /**
   * 分页查询列表
   * @param {Object} data
   * @param {number} data.pageIndex - 页码
   * @param {number} data.pageSize - 每页条数
   * @param {string} data.startDate - 开始日期 (YYYY-MM-DD)
   * @param {string} data.endDate - 结束日期 (YYYY-MM-DD)
   * @param {string} data.sortField - 排序字段
   * @param {string} data.sortOrder - 排序方向 'asc' | 'desc'
   */
  async getList(data = {}) {
    let { pageIndex = 1, pageSize = 20, startDate = '', endDate = '', sortField = '', sortOrder = 'desc' } = data;

    let where = {};
    // 日期范围筛选（_id 就是日期）
    if (startDate && endDate) {
      where._id = _.gte(startDate).and(_.lte(endDate));
    } else if (startDate) {
      where._id = _.gte(startDate);
    } else if (endDate) {
      where._id = _.lte(endDate);
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建查询
    let query = collection.where(where);

    // 处理排序
    if (sortField && sortOrder) {
      query = query.orderBy(sortField, sortOrder);
    } else {
      // 默认按日期倒序（最新的在前）
      query = query.orderBy('_id', 'desc');
    }

    let { data: list } = await query.skip(skip).limit(pageSize).get();
    let { total } = await collection.where(where).count();

    return { list, total };
  }
};
