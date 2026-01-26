/**
 * 卡密管理 - 服务实现层
 */
const db = uniCloud.database();
const _ = db.command;
const $ = _.aggregate;

const { Tables } = require('../constants');
const libs = require('../libs');
const collection = db.collection(Tables.cardKeys);
const goodsCollection = db.collection(Tables.goods);

module.exports = {
  /**
   * 获取商品列表（用于下拉选择）
   * @returns {Promise<{list: Array}>} 商品列表
   */
  async getGoodsList() {
    const { data: list } = await goodsCollection
      .where({ is_deleted: _.neq(true) })
      .field({ _id: 1, name: 1 })
      .orderBy('sort_order', 'desc')
      .orderBy('create_time', 'desc')
      .get();
    return { list };
  },

  /**
   * 分页查询列表
   * @param {Object} data
   * @param {number} data.pageIndex - 页码
   * @param {number} data.pageSize - 每页条数
   * @param {string} data.keyword - 搜索关键词（卡号）
   * @param {string} data.goods_id - 商品ID筛选
   * @param {number} data.status - 状态筛选
   * @param {string} data.sortField - 排序字段
   * @param {string} data.sortOrder - 排序方向 'asc' | 'desc'
   */
  async getList(data = {}) {
    let { pageIndex = 1, pageSize = 20, keyword = '', goods_id = '', status = '', sortField = '', sortOrder = 'desc' } = data;

    let where = {};

    // 关键词搜索（卡号）
    if (keyword) {
      if (libs.common.isObjectId(keyword)) {
        where.card_no = keyword;
      } else {
        where.card_no = new RegExp(keyword, 'i');
      }
    }

    // 商品筛选
    if (goods_id) {
      where.goods_id = goods_id;
    }

    // 状态筛选
    if (status !== '' && status !== null && status !== undefined) {
      where.status = parseInt(status);
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
      query = query.orderBy("_id", sortOrder || 'desc');
    }

    let { data: list } = await query.skip(skip).limit(pageSize).get();
    let { total } = await collection.where(where).count();

    // 获取商品名称映射
    if (list.length > 0) {
      const goodsIds = [...new Set(list.map(item => item.goods_id).filter(Boolean))];
      if (goodsIds.length > 0) {
        const { data: goodsData } = await goodsCollection
          .where({ _id: _.in(goodsIds) })
          .field({ _id: 1, name: 1 })
          .get();
        const goodsMap = {};
        goodsData.forEach(g => { goodsMap[g._id] = g.name; });
        list = list.map(item => ({
          ...item,
          goods_name: goodsMap[item.goods_id] || '-'
        }));
      }
    }

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
   * 新增记录
   * @param {Object} data - 卡密数据
   * @param {string} data.goods_id - 商品ID
   * @param {string} data.card_no - 卡号
   * @param {string} [data.card_pwd] - 卡密
   * @param {string} [data.exchange_url] - 兑换地址
   * @param {number} [data.status] - 状态
   * @returns {Promise<{id: string}>} 新增记录的 ID
   */
  async add(data = {}) {
    const { _id, create_time, update_time, ...record } = data;
    record.status = record.status ?? 0;
    record.create_time = Date.now();
    const { id } = await collection.add(record);
    return { id };
  },

  /**
   * 更新记录
   * @param {string} _id - 记录 ID
   * @param {Object} data - 更新数据
   * @returns {Promise<{updated: number}>} 更新的记录数
   */
  async update(_id, data = {}) {
    const { _id: __, create_time, ...rest } = data;
    const updateData = {
      ...rest,
      update_time: Date.now()
    };
    const { updated } = await collection.doc(_id).update(updateData);
    return { updated };
  },

  /**
   * 删除记录（支持批量）
   * @param {string|string[]} ids - 单个 ID 或 ID 数组
   * @returns {Promise<{deleted: number}>} 删除的记录数
   */
  async remove(ids) {
    if (!Array.isArray(ids)) ids = [ids];
    const { deleted } = await collection.where({ _id: _.in(ids) }).remove();
    return { deleted };
  },

  /**
   * 批量导入卡密
   * @param {string} goods_id - 商品ID
   * @param {Array} list - 卡密列表
   * @param {string} list[].card_no - 卡号
   * @param {string} [list[].card_pwd] - 卡密
   * @param {string} [list[].exchange_url] - 兑换地址
   * @returns {Promise<{count: number}>} 导入的记录数
   */
  async batchImport(goods_id, list) {
    const now = Date.now();
    const records = list.map(item => ({
      goods_id,
      card_no: String(item.card_no || '').trim(),
      card_pwd: String(item.card_pwd || '').trim(),
      exchange_url: String(item.exchange_url || '').trim(),
      status: 0,
      create_time: now
    })).filter(item => item.card_no); // 过滤掉没有卡号的记录

    if (records.length === 0) {
      return { count: 0 };
    }

    // 批量插入（uniCloud 不支持 insertMany，需要逐条插入或使用事务）
    // 这里使用循环插入，如果数据量大可考虑优化
    let count = 0;
    for (const record of records) {
      try {
        await collection.add(record);
        count++;
      } catch (e) {
        console.error('导入卡密失败:', e);
      }
    }

    return { count };
  }
};
