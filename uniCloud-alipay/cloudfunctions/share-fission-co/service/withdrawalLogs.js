/**
 * 提现记录 - 服务实现层
 */
const db = uniCloud.database();
const _ = db.command;

const { Tables } = require('../constants');
const libs = require('../libs');
const collection = db.collection(Tables.withdrawalLogs);
const usersCollection = db.collection(Tables.users);
const scoresCollection = db.collection(Tables.scores);

module.exports = {
  /**
   * 分页查询列表
   * @param {Object} data
   * @param {number} data.pageIndex - 页码
   * @param {number} data.pageSize - 每页条数
   * @param {string} data.keyword - 搜索关键词
   * @param {number} data.status - 状态筛选
   * @param {string} data.sortField - 排序字段
   * @param {string} data.sortOrder - 排序方向 'asc' | 'desc'
   */
  async getList(data = {}) {
    let { pageIndex = 1, pageSize = 20, keyword = '', status, sortField = 'create_time', sortOrder = 'desc' } = data;

    let where = {};
    // 状态筛选
    if (status !== undefined && status !== null && status !== '') {
      where.status = status;
    }
    // 关键词搜索
    if (keyword) {
      if (libs.common.isObjectId(keyword)) {
        where = {
          ...where,
          ..._.or([
            { user_id: keyword },
            { 'account_info.account': keyword }
          ])
        };
      } else {
        where = {
          ...where,
          ..._.or([
            { user_id: new RegExp(keyword, 'i') },
            { 'account_info.account': new RegExp(keyword, 'i') },
            { 'account_info.name': new RegExp(keyword, 'i') }
          ])
        };
      }
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建查询
    let query = collection.where(where);

    // 处理排序
    if (sortField && sortOrder) {
      query = query.orderBy(sortField, sortOrder);
    } else {
      // 默认按创建时间倒序
      query = query.orderBy('create_time', 'desc');
    }

    if (sortField !== "_id") {
      query = query.orderBy("_id", sortOrder);
    }

    let { data: list } = await query.skip(skip).limit(pageSize).get();
    let { total } = await collection.where(where).count();

    return { list, total };
  },

  /**
   * 获取单条记录
   * @param {string} _id - 记录 ID
   * @returns {Promise<Object|undefined>} 记录详情
   */
  async getById(_id) {
    const { data: [info] } = await collection.doc(_id).get();
    return info;
  },

  /**
   * 审核提现申请
   * @param {string} _id - 记录 ID
   * @param {number} status - 状态 1=通过 2=拒绝
   * @param {string} reject_reason - 拒绝原因（拒绝时必填）
   * @returns {Promise<{updated: number}>} 更新的记录数
   */
  async audit(_id, status, reject_reason) {
    // 检查当前状态
    const { data: [record] } = await collection.doc(_id).get();
    if (!record) {
      throw new Error('记录不存在');
    }
    if (record.status !== 0) {
      throw new Error('该记录已审核，不可重复操作');
    }

    const updateData = {
      status,
      audit_time: Date.now()
    };

    if (status === 2 && reject_reason) {
      updateData.reject_reason = reject_reason;
    }

    const { updated } = await collection.doc(_id).update(updateData);

    // 拒绝时退还积分
    if (status === 2) {
      await this._refundScore(record);
    }

    return { updated };
  },

  /**
   * 退还积分（拒绝提现时调用）
   * @param {Object} record - 提现记录
   * @private
   */
  async _refundScore(record) {
    const { user_id, score, _id: withdrawal_id } = record;

    // 获取用户当前积分
    const { data: [user] } = await usersCollection.doc(user_id).get();
    if (!user) {
      throw new Error('用户不存在');
    }

    const currentScore = user.score || 0;
    const newBalance = currentScore + score;

    // 更新用户积分
    await usersCollection.doc(user_id).update({
      score: _.inc(score),
      score_withdrawn: _.inc(score * -1),
    });

    // 添加积分退还记录
    await scoresCollection.add({
      user_id,
      score: score,
      type: 1, // 1=收入
      balance: newBalance,
      source: 'withdraw_refund',
      withdrawal_id,
      comment: '提现申请被拒绝，积分退还',
      create_date: Date.now()
    });
  },

  /**
   * 确认打款
   * @param {string} _id - 记录 ID
   * @returns {Promise<{updated: number}>} 更新的记录数
   */
  async pay(_id) {
    // 检查当前状态
    const { data: [record] } = await collection.doc(_id).get();
    if (!record) {
      throw new Error('记录不存在');
    }
    if (record.status !== 1) {
      throw new Error('只有已通过审核的记录才能打款');
    }

    const updateData = {
      status: 3,
      pay_time: Date.now()
    };

    const { updated } = await collection.doc(_id).update(updateData);
    return { updated };
  }
};
