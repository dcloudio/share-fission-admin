/**
 * 每日统计表 - 服务实现层
 * @module service/dailyStatistics
 * @description 每日统计数据管理模块，提供按日期维度的统计数据查询功能。
 * 统计数据以日期（YYYY-MM-DD格式）作为文档ID存储
 */
const db = uniCloud.database();
const _ = db.command;

const { Tables } = require('../constants');
const collection = db.collection(Tables.dailyStatistics);

/**
 * @typedef {Object} DailyStatistics
 * @property {string} _id - 日期，格式为 YYYY-MM-DD（如：2024-01-15）
 * @property {number} [new_users] - 新增用户数
 * @property {number} [active_users] - 活跃用户数
 * @property {number} [ad_watch_count] - 广告观看次数
 * @property {number} [ad_income] - 广告收入（元）
 * @property {number} [order_count] - 订单数量
 * @property {number} [order_amount] - 订单金额（积分）
 * @property {number} [withdrawal_count] - 提现申请数
 * @property {number} [withdrawal_amount] - 提现金额（元）
 * @property {number} [total_score_issued] - 发放积分总数
 * @property {number} [total_score_consumed] - 消耗积分总数
 * @property {number} [create_time] - 创建时间戳（毫秒）
 * @property {number} [update_time] - 更新时间戳（毫秒）
 */

/**
 * @typedef {Object} DailyStatisticsQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [startDate=''] - 开始日期，格式 YYYY-MM-DD
 * @property {string} [endDate=''] - 结束日期，格式 YYYY-MM-DD
 * @property {string} [sortField=''] - 排序字段
 * @property {string} [sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} DailyStatisticsListResult
 * @property {DailyStatistics[]} list - 统计数据列表
 * @property {number} total - 总记录数
 */

module.exports = {
  /**
   * 分页查询每日统计数据列表
   * @async
   * @function getList
   * @description 支持日期范围筛选、自定义排序和分页。
   * 由于 _id 就是日期，所以日期范围筛选直接对 _id 进行比较。
   * 默认按日期倒序排列（最新的在前）
   * @param {DailyStatisticsQueryParams} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.startDate=''] - 开始日期，格式 YYYY-MM-DD，筛选 >= startDate
   * @param {string} [data.endDate=''] - 结束日期，格式 YYYY-MM-DD，筛选 <= endDate
   * @param {string} [data.sortField=''] - 排序字段，为空时默认按 _id（日期）倒序
   * @param {string} [data.sortOrder='desc'] - 排序方向
   * @returns {Promise<DailyStatisticsListResult>} 返回统计数据列表和总数
   * @example
   * // 查询某日期范围内的统计数据
   * const result = await dailyStatisticsService.getList({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31',
   *   pageSize: 31
   * });
   *
   * // 查询最近7天的数据
   * const result = await dailyStatisticsService.getList({
   *   pageSize: 7,
   *   sortOrder: 'desc'
   * });
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
