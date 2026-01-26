/**
 * 订单表 - 服务实现层
 */
const db = uniCloud.database();
const _ = db.command;

const { Tables } = require('../constants');
const libs = require('../libs');

const ordersCollection = db.collection(Tables.orders);
const cardKeysCollection = db.collection(Tables.cardKeys);
const usersCollection = db.collection(Tables.users);
const scoresCollection = db.collection(Tables.scores);

module.exports = {
  /**
   * 分页查询订单列表
   * @param {Object} data
   * @param {number} data.pageIndex - 页码
   * @param {number} data.pageSize - 每页条数
   * @param {string} data.keyword - 搜索关键词（订单号、商品名称）
   * @param {string} data.status - 订单状态筛选
   * @param {string} data.sortField - 排序字段
   * @param {string} data.sortOrder - 排序方向 'asc' | 'desc'
   */
  async getList(data = {}) {
    let { pageIndex = 1, pageSize = 20, keyword = '', status = '', sortField = '', sortOrder = 'desc' } = data;

    let matchConditions = [];

    // 状态筛选
    if (status) {
      matchConditions.push({ status: status });
    }

    // 关键词搜索
    if (keyword) {
      if (libs.common.isObjectId(keyword)) {
        matchConditions.push({
          $or: [
            { order_no: keyword },
            { 'goods_info.name': keyword }
          ]
        });
      } else {
        matchConditions.push({
          $or: [
            { order_no: { $regex: keyword, $options: 'i' } },
            { 'goods_info.name': { $regex: keyword, $options: 'i' } }
          ]
        });
      }
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建聚合管道
    let pipeline = [];

    // 匹配条件
    if (matchConditions.length > 0) {
      pipeline.push({
        $match: matchConditions.length === 1 ? matchConditions[0] : { $and: matchConditions }
      });
    }

    // 关联用户表获取昵称
    pipeline.push({
      $lookup: {
        from: Tables.users,
        localField: 'user_id',
        foreignField: '_id',
        as: 'user_info'
      }
    });

    // 添加计算字段
    pipeline.push({
      $addFields: {
        goods_name: '$goods_info.name',
        user_nickname: { $arrayElemAt: ['$user_info.nickname', 0] }
      }
    });

    // 排序
    let sortObj = {};
    if (sortField && sortOrder) {
      sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj['create_time'] = -1;
    }
    if (sortField !== '_id') {
      sortObj['_id'] = sortOrder === 'asc' ? 1 : -1;
    }
    pipeline.push({ $sort: sortObj });

    // 统计总数的管道
    const countPipeline = [...pipeline, { $count: 'total' }];

    // 分页
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: pageSize });

    // 移除不需要的字段
    pipeline.push({
      $project: {
        user_info: 0
      }
    });

    // 执行查询
    const [listResult, countResult] = await Promise.all([
      ordersCollection.aggregate(pipeline).end(),
      ordersCollection.aggregate(countPipeline).end()
    ]);

    return {
      list: listResult.data || [],
      total: countResult.data[0]?.total || 0
    };
  },

  /**
   * 获取订单关联的卡密信息
   * @param {string} order_id - 订单ID
   * @returns {Promise<Object|null>} 卡密信息
   */
  async getCardKey(order_id) {
    // 先获取订单信息
    const { data: [order] } = await ordersCollection.doc(order_id).get();
    if (!order) {
      throw new Error('订单不存在');
    }

    // 如果订单有关联的卡密ID
    if (order.card_key_id) {
      const { data: [cardKey] } = await cardKeysCollection.doc(order.card_key_id).get();
      return cardKey || null;
    }

    // 也可以通过 order_id 反查卡密表
    const { data: [cardKey] } = await cardKeysCollection.where({ order_id }).get();
    return cardKey || null;
  },

  /**
   * 订单退款
   * @param {string} order_id - 订单ID
   * @returns {Promise<{success: boolean}>}
   */
  async refund(order_id) {
    // 获取订单信息
    const { data: [order] } = await ordersCollection.doc(order_id).get();
    if (!order) {
      throw new Error('订单不存在');
    }

    // 检查订单状态
    if (order.status !== 'complete') {
      throw new Error('只有已完成的订单才能退款');
    }

    const { user_id, score_cost, card_key_id } = order;

    // 获取用户当前积分
    const { data: [user] } = await usersCollection.doc(user_id).get();
    if (!user) {
      throw new Error('用户不存在');
    }

    const currentScore = user.score || 0;
    const newBalance = currentScore + score_cost;

    // 开始事务操作
    const transaction = await db.startTransaction();

    try {
      // 1. 更新订单状态为已取消
      await transaction.collection(Tables.orders).doc(order_id).update({
        status: 'cancel',
        update_time: Date.now()
      });

      // 2. 更新用户积分
      await transaction.collection(Tables.users).doc(user_id).update({
        score: _.inc(score_cost)
      });

      // 3. 创建积分变更记录
      await transaction.collection(Tables.scores).add({
        user_id,
        score: score_cost,
        type: 1, // 收入
        balance: newBalance,
        source: 'refund',
        order_id,
        comment: '订单退款',
        create_date: Date.now()
      });

      // 4. 释放卡密（如果有）
      if (card_key_id) {
        await transaction.collection(Tables.cardKeys).doc(card_key_id).update({
          status: 0, // 未发放
          order_id: _.remove(),
          used_time: _.remove()
        });
      }

      await transaction.commit();

      return { success: true };
    } catch (e) {
      await transaction.rollback();
      throw new Error('退款失败：' + e.message);
    }
  }
};
