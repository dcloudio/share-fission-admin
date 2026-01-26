/**
 * 商品管理 - 服务实现层
 */
const db = uniCloud.database();
const _ = db.command;

const { Tables } = require('../constants');
const libs = require('../libs');
const collection = db.collection(Tables.goods);
const categoryCollection = db.collection(Tables.goodsCategories);

module.exports = {
  /**
   * 分页查询列表
   * @param {Object} data
   * @param {number} data.pageIndex - 页码
   * @param {number} data.pageSize - 每页条数
   * @param {string} data.keyword - 搜索关键词
   * @param {string} data.category_id - 分类ID筛选
   * @param {number} data.status - 状态筛选
   * @param {string} data.sortField - 排序字段
   * @param {string} data.sortOrder - 排序方向 'asc' | 'desc'
   */
  async getList(data = {}) {
    let { pageIndex = 1, pageSize = 20, keyword = '', category_id, status, sortField = 'sort_order', sortOrder = 'desc' } = data;

    let where = {
      is_deleted: _.neq(true) // 排除软删除的记录
    };

    // 分类筛选
    if (category_id) {
      where.category_id = category_id;
    }

    // 状态筛选
    if (status !== undefined && status !== null && status !== '') {
      where.status = status;
    }

    // 关键词搜索
    if (keyword) {
      where.name = new RegExp(keyword, 'i');
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建查询
    let query = collection.where(where);

    // 处理排序
    if (sortField && sortOrder) {
      query = query.orderBy(sortField, sortOrder);
    } else {
      query = query.orderBy('sort_order', 'desc');
    }

    if (sortField !== "_id") {
      query = query.orderBy("_id", sortOrder);
    }

    let { data: list } = await query.skip(skip).limit(pageSize).get();
    let { total } = await collection.where(where).count();

    // 关联查询分类名称
    if (list.length > 0) {
      const categoryIds = [...new Set(list.filter(item => item.category_id).map(item => item.category_id))];
      if (categoryIds.length > 0) {
        const { data: categories } = await categoryCollection.where({ _id: _.in(categoryIds) }).field({ _id: true, name: true }).get();
        const categoryMap = {};
        categories.forEach(c => { categoryMap[c._id] = c.name; });
        list = list.map(item => ({
          ...item,
          category_name: item.category_id ? categoryMap[item.category_id] || '' : ''
        }));
      } else {
        list = list.map(item => ({ ...item, category_name: '' }));
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
   * @param {Object} data - 商品数据
   * @returns {Promise<{id: string}>} 新增记录的 ID
   */
  async add(data = {}) {
    const { _id, create_time, update_time, is_deleted, ...record } = data;
    record.create_time = Date.now();
    record.is_deleted = false;
    record.status = record.status ?? 1;
    record.sort_order = record.sort_order ?? 0;
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
    const { _id: __, create_time, is_deleted, ...rest } = data;
    const updateData = {
      ...rest,
      update_time: Date.now()
    };
    const { updated } = await collection.doc(_id).update(updateData);
    return { updated };
  },

  /**
   * 删除记录（软删除，支持批量）
   * @param {string|string[]} ids - 单个 ID 或 ID 数组
   * @returns {Promise<{updated: number}>} 更新的记录数
   */
  async remove(ids) {
    if (!Array.isArray(ids)) ids = [ids];
    const { updated } = await collection.where({ _id: _.in(ids) }).update({
      is_deleted: true,
      update_time: Date.now()
    });
    return { deleted: updated };
  }
};
