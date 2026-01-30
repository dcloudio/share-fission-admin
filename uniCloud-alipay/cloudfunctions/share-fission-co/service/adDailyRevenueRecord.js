/**
 * 每日广告收益记录 - 服务实现层
 * @module service/adDailyRevenueRecord
 * @description 提供每日广告收益记录的查询和更新功能
 */
const { Tables } = require('../constants');
const libs = require('../libs');
const BaseService = require('./base');

/**
 * @typedef {Object} AdDailyRevenueRecord
 * @property {string} [_id] - 记录ID
 * @property {string} statement_date - 结算日期
 * @property {number} total_cash - 总奖励
 * @property {number} total_score - 总积分
 * @property {number} total_people - 总人数
 * @property {number} total_times - 总次数
 * @property {boolean} is_settled - 是否已结算
 * @property {string} [remark] - 备注
 * @property {number} [create_time] - 创建时间戳（毫秒）
 * @property {number} [update_time] - 更新时间戳（毫秒）
 */

/**
 * @typedef {Object} ListQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [startDate] - 开始日期 (YYYY-MM-DD)
 * @property {string} [endDate] - 结束日期 (YYYY-MM-DD)
 * @property {string} [sortField='statement_date'] - 排序字段
 * @property {string} [sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} ListResult
 * @property {AdDailyRevenueRecord[]} list - 记录列表
 * @property {number} total - 总记录数
 */

class AdDailyRevenueRecordService extends BaseService {
  constructor() {
    super();
    this.tableName = Tables.adDailyRevenueRecord;
  }

  /**
   * 分页查询每日广告收益记录列表
   * @async
   * @function getList
   * @description 支持日期范围搜索、自定义排序和分页。默认按结算日期倒序排列
   * @param {ListQueryParams} [data={}] - 查询参数对象
   * @returns {Promise<ListResult>} 返回列表数据和总数
   * @example
   * const result = await adDailyRevenueRecordService.getList({
   *   pageIndex: 1,
   *   pageSize: 10,
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31'
   * });
   */
  async getList(data = {}) {
    let {
      pageIndex = 1,
        pageSize = 20,
        startDate = '',
        endDate = '',
        sortField = 'statement_date',
        sortOrder = 'desc'
    } = data;

    // 构建查询条件数组
    let conditions = [];

    // 日期范围搜索
    if (startDate && endDate) {
      conditions.push({
        statement_date: this._.and([
          this._.gte(startDate),
          this._.lte(endDate)
        ])
      });
    } else if (startDate) {
      conditions.push({ statement_date: this._.gte(startDate) });
    } else if (endDate) {
      conditions.push({ statement_date: this._.lte(endDate) });
    }

    // 组合最终的 where 条件
    let where = {};
    if (conditions.length > 0) {
      where = this._.and(conditions);
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建查询
    let query = this.collection.where(where);

    // 处理排序
    if (sortField && sortOrder) {
      query = query.orderBy(sortField, sortOrder);
    } else {
      // 默认按结算日期倒序
      query = query.orderBy('statement_date', 'desc');
    }

    // 辅助排序，保证分页顺序稳定性
    if (sortField !== "_id") {
      query = query.orderBy("_id", sortOrder);
    }

    // 并行执行查询列表和查询总数
    const [listResult, totalResult] = await Promise.all([
      query.skip(skip).limit(pageSize).get(),
      this.collection.where(where).count()
    ]);

    return {
      list: listResult.data,
      total: totalResult.total
    };
  }

  /**
   * 根据ID查询记录详情
   * @async
   * @function getById
   * @param {string} id - 记录ID
   * @returns {Promise<AdDailyRevenueRecord>} 返回记录详情
   */
  async getById(id) {
    const res = await this.collection.doc(id).get();
    if (!res.data || res.data.length === 0) {
      throw new Error('记录不存在');
    }
    return res.data[0];
  }

  /**
   * 更新备注
   * @async
   * @function updateRemark
   * @description 更新记录的备注信息
   * @param {string} id - 记录ID
   * @param {string} remark - 备注内容
   * @returns {Promise<Object>} 返回更新结果
   */
  async updateRemark(id, remark) {
    if (!id) {
      throw new Error('记录ID不能为空');
    }

    // 检查记录是否存在
    await this.getById(id);

    const updateData = {
      remark: remark || '',
      update_time: Date.now()
    };

    const res = await this.collection.doc(id).update(updateData);
    return res;
  }

  /**
   * 填写广告收入并更新资金池（事务）
   * @async
   * @function fillRevenueWithTransaction
   * @description 使用事务确保填写广告收益和更新资金池的原子性操作
   * @param {Object} data - 收益数据
   * @param {string} data._id - 记录ID
   * @param {number} data.total_cash - 总奖励
   * @param {number} data.total_score - 总积分
   * @param {string} [data.remark] - 备注
   * @returns {Promise<Object>} 返回操作结果
   */
  async fillRevenueWithTransaction(data) {
    const { _id, total_cash, total_score, remark = '' } = data;

    if (!_id) {
      throw new Error('记录ID不能为空');
    }

    // 检查记录是否存在
    const record = await this.getById(_id);
    if (record.is_settled) {
      throw new Error('该记录已结算，无法修改');
    }
    const transaction = await this.db.startTransaction();

    try {
      const now = Date.now();

      // 1. 更新广告收益记录
      const updateData = {
        total_cash,
        total_score,
        is_settled: true,
        update_time: now
      };
      if (remark !== undefined) {
        updateData.remark = remark;
      }

      await transaction.collection(this.tableName).doc(_id).update(updateData);

      // 2. 调用资金池服务的通用方法更新资金池和记录流水
      const fundPoolLogsService = require('./fundPoolLogs');
      const poolResult = await fundPoolLogsService._updatePoolInTransaction(transaction, {
        cash_change: total_cash,
        score_change: total_score,
        type: 'ad_income',
        remark: remark || '广告收入',
        related_id: _id,
        create_time: now
      });

      // 提交事务
      await transaction.commit();

      return {
        success: true,
        message: '填写广告收入成功',
        data: {
          total_cash,
          total_score,
          cash_balance: poolResult.cash_balance,
          exchange_rate: poolResult.exchange_rate
        }
      };
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new AdDailyRevenueRecordService();
