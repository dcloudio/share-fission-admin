/**
 * 资金池流水 - 服务实现层
 */
const db = uniCloud.database();
const _ = db.command;

const { Tables } = require('../constants');
const logsCollection = db.collection(Tables.fundPoolLogs);
const poolCollection = db.collection(Tables.fundPool);

module.exports = {
  /**
   * 获取资金池信息
   * @returns {Promise<Object>} 资金池信息
   */
  async getPool() {
    const { data: [pool] } = await poolCollection.doc('main').get();
    return pool || {
      total_cash: 0,
      total_score: 0,
      exchange_rate: 0.01,
      update_time: null
    };
  },

  /**
   * 分页查询流水列表
   * @param {Object} data
   * @param {number} data.pageIndex - 页码
   * @param {number} data.pageSize - 每页条数
   * @param {string} data.type - 类型筛选
   * @param {number} data.startTime - 开始时间戳
   * @param {number} data.endTime - 结束时间戳
   * @param {string} data.sortField - 排序字段
   * @param {string} data.sortOrder - 排序方向 'asc' | 'desc'
   */
  async getList(data = {}) {
    let { pageIndex = 1, pageSize = 20, type, startTime, endTime, sortField = 'create_time', sortOrder = 'desc' } = data;

    let where = {};
    // 类型筛选
    if (type) {
      where.type = type;
    }
    // 时间范围筛选
    if (startTime && endTime) {
      where.create_time = _.gte(startTime).and(_.lte(endTime));
    } else if (startTime) {
      where.create_time = _.gte(startTime);
    } else if (endTime) {
      where.create_time = _.lte(endTime);
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建查询
    let query = logsCollection.where(where);

    // 处理排序
    if (sortField && sortOrder) {
      query = query.orderBy(sortField, sortOrder);
    } else {
      query = query.orderBy('create_time', 'desc');
    }

    if (sortField !== "_id") {
      query = query.orderBy("_id", sortOrder);
    }

    let { data: list } = await query.skip(skip).limit(pageSize).get();
    let { total } = await logsCollection.where(where).count();

    return { list, total };
  }
};
