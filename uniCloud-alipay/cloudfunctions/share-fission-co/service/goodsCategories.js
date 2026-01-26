/**
 * 商品分类表 - 服务实现层
 */
const db = uniCloud.database();
const _ = db.command;
const $ = _.aggregate;

const { Tables } = require('../constants');
const libs = require('../libs');
const collection = db.collection(Tables.goodsCategories);

module.exports = {
  /**
   * 分页查询列表
   * @param {Object} data
   * @param {number} data.pageIndex - 页码
   * @param {number} data.pageSize - 每页条数
   * @param {string} data.keyword - 搜索关键词
   * @param {string} data.parent_id - 父分类ID筛选（'top' 表示顶级分类）
   * @param {string} data.sortField - 排序字段
   * @param {string} data.sortOrder - 排序方向 'asc' | 'desc'
   */
  async getList(data = {}) {
    let { pageIndex = 1, pageSize = 20, keyword = '', parent_id = '', sortField = 'sort', sortOrder = 'asc' } = data;

    let where = {};

    // 父分类筛选
    if (parent_id === 'top') {
      // 顶级分类
      where.parent_id = _.or([_.eq(''), _.exists(false)]);
    } else if (parent_id) {
      where.parent_id = parent_id;
    }

    // 关键词搜索
    if (keyword) {
      if (libs.common.isObjectId(keyword)) {
        where._id = keyword;
      } else {
        where.name = new RegExp(keyword, 'i');
      }
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建查询
    let query = collection.where(where);

    // 处理排序
    if (sortField && sortOrder) {
      query = query.orderBy(sortField, sortOrder);
    } else {
      // 默认按排序值升序
      query = query.orderBy('sort', 'asc');
    }

    if (sortField !== "_id") {
      query = query.orderBy("_id", sortOrder || 'asc');
    }

    let { data: list } = await query.skip(skip).limit(pageSize).get();
    let { total } = await collection.where(where).count();

    // 获取父分类名称
    if (list.length > 0) {
      const parentIds = [...new Set(list.filter(item => item.parent_id).map(item => item.parent_id))];
      if (parentIds.length > 0) {
        const { data: parents } = await collection.where({ _id: _.in(parentIds) }).field({ _id: true, name: true }).get();
        const parentMap = {};
        parents.forEach(p => { parentMap[p._id] = p.name; });
        list = list.map(item => ({
          ...item,
          parent_name: item.parent_id ? parentMap[item.parent_id] || '' : ''
        }));
      } else {
        list = list.map(item => ({ ...item, parent_name: '' }));
      }
    }

    return { list, total };
  },

  /**
   * 获取父分类列表（用于下拉选择，只返回一级分类）
   */
  async getParentList() {
    // 只获取顶级分类作为可选父分类
    const { data: list } = await collection
      .where({
        status: 1,
        level: 1
      })
      .orderBy('sort', 'asc')
      .get();
    return { list };
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
   * @param {Object} data - 分类数据
   * @param {string} [data.parent_id] - 父分类ID
   * @param {string} data.name - 分类名称
   * @param {number} [data.sort] - 排序值
   * @param {number} [data.status] - 状态
   * @returns {Promise<{id: string}>} 新增记录的 ID
   */
  async add(data = {}) {
    const { _id, create_time, update_time, level, ...record } = data;

    // 计算层级
    if (record.parent_id) {
      const parent = await this.getById(record.parent_id);
      if (parent) {
        record.level = (parent.level || 1) + 1;
      } else {
        record.level = 1;
        record.parent_id = '';
      }
    } else {
      record.level = 1;
      record.parent_id = '';
    }

    record.sort = record.sort ?? 0;
    record.status = record.status ?? 1;
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
    const { _id: __, create_time, level, ...rest } = data;
    const updateData = { ...rest };

    // 如果修改了父分类，需要重新计算层级
    if ('parent_id' in data) {
      if (data.parent_id) {
        const parent = await this.getById(data.parent_id);
        if (parent) {
          updateData.level = (parent.level || 1) + 1;
        } else {
          updateData.level = 1;
          updateData.parent_id = '';
        }
      } else {
        updateData.level = 1;
        updateData.parent_id = '';
      }
    }

    updateData.update_time = Date.now();
    const { updated } = await collection.doc(_id).update(updateData);
    return { updated };
  },

  /**
   * 删除记录（支持批量，同时删除子分类）
   * @param {string|string[]} ids - 单个 ID 或 ID 数组
   * @returns {Promise<{deleted: number}>} 删除的记录数
   */
  async remove(ids) {
    if (!Array.isArray(ids)) ids = [ids];

    // 获取所有要删除的分类及其子分类
    const allIds = new Set(ids);

    // 递归查找子分类
    const findChildren = async (parentIds) => {
      if (parentIds.length === 0) return;
      const { data: children } = await collection.where({ parent_id: _.in(parentIds) }).field({ _id: true }).get();
      const childIds = children.map(c => c._id);
      if (childIds.length > 0) {
        childIds.forEach(id => allIds.add(id));
        await findChildren(childIds);
      }
    };

    await findChildren(ids);

    const { deleted } = await collection.where({ _id: _.in([...allIds]) }).remove();
    return { deleted };
  }
};
