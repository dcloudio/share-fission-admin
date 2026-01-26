/**
 * 资金池流水 - 服务实现层
 * @module service/fundPoolLogs
 * @description 资金池管理模块，提供资金池信息查询和资金流水记录查询功能
 */
const db = uniCloud.database();
const _ = db.command;

const { Tables } = require('../constants');
const logsCollection = db.collection(Tables.fundPoolLogs);
const poolCollection = db.collection(Tables.fundPool);

/**
 * @typedef {Object} FundPool
 * @property {string} [_id] - 资金池ID（固定为 'main'）
 * @property {number} total_cash - 资金池总现金（元）
 * @property {number} total_score - 资金池总积分
 * @property {number} exchange_rate - 积分兑换比例（1积分 = exchange_rate 元）
 * @property {number} [update_time] - 最后更新时间戳（毫秒）
 */

/**
 * @typedef {Object} FundPoolLog
 * @property {string} [_id] - 记录ID
 * @property {string} type - 流水类型（如：recharge, withdraw, ad_income 等）
 * @property {number} [cash_change] - 现金变动金额（元）
 * @property {number} [score_change] - 积分变动数量
 * @property {number} [cash_balance] - 变动后现金余额
 * @property {number} [score_balance] - 变动后积分余额
 * @property {string} [related_id] - 关联业务ID
 * @property {string} [comment] - 备注说明
 * @property {number} [create_time] - 创建时间戳（毫秒）
 */

/**
 * @typedef {Object} FundPoolLogQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [type] - 类型筛选
 * @property {number} [startTime] - 开始时间戳（毫秒）
 * @property {number} [endTime] - 结束时间戳（毫秒）
 * @property {string} [sortField='create_time'] - 排序字段
 * @property {string} [sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} FundPoolLogListResult
 * @property {FundPoolLog[]} list - 流水记录列表
 * @property {number} total - 总记录数
 */

/**
 * 资金池流水类型枚举
 * @readonly
 * @enum {string}
 */
const FundPoolLogType = {
  /** 充值 */
  RECHARGE: 'recharge',
  /** 提现支出 */
  WITHDRAW: 'withdraw',
  /** 广告收入 */
  AD_INCOME: 'ad_income',
  /** 订单收入 */
  ORDER_INCOME: 'order_income',
  /** 退款支出 */
  REFUND: 'refund',
  /** 系统调整 */
  SYSTEM_ADJUST: 'system_adjust'
};

module.exports = {
  /**
   * 获取资金池信息
   * @async
   * @function getPool
   * @description 获取资金池当前状态，包括总现金、总积分和兑换比例。
   * 如果资金池记录不存在，返回默认值
   * @returns {Promise<FundPool>} 资金池信息对象
   * @example
   * const pool = await fundPoolLogsService.getPool();
   * console.log(`总现金: ${pool.total_cash}, 总积分: ${pool.total_score}`);
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
   * 分页查询资金池流水列表
   * @async
   * @function getList
   * @description 支持类型筛选、时间范围筛选、自定义排序和分页。默认按创建时间倒序排列
   * @param {FundPoolLogQueryParams} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.type] - 类型筛选
   * @param {number} [data.startTime] - 开始时间戳（毫秒），筛选 create_time >= startTime
   * @param {number} [data.endTime] - 结束时间戳（毫秒），筛选 create_time <= endTime
   * @param {string} [data.sortField='create_time'] - 排序字段
   * @param {string} [data.sortOrder='desc'] - 排序方向
   * @returns {Promise<FundPoolLogListResult>} 返回流水记录列表和总数
   * @example
   * // 查询某时间段内的充值记录
   * const result = await fundPoolLogsService.getList({
   *   type: 'recharge',
   *   startTime: 1704067200000,
   *   endTime: 1704153600000
   * });
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
