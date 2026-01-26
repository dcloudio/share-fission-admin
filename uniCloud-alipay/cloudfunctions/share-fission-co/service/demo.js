/**
 * Demo 示例表 - 服务实现层
 */
const db = uniCloud.database();
const _ = db.command;
const $ = _.aggregate;

const { Tables } = require('../constants');
const libs = require('../libs');
const collection = db.collection(Tables.demoEmployee);

module.exports = {
  /**
   * 分页查询列表
   * @param {Object} data
   * @param {number} data.pageIndex - 页码
   * @param {number} data.pageSize - 每页条数
   * @param {string} data.keyword - 搜索关键词
   * @param {string} data.sortField - 排序字段
   * @param {string} data.sortOrder - 排序方向 'asc' | 'desc'
   */
  async getList(data = {}) {
    let { pageIndex = 1, pageSize = 20, keyword = '', sortField = '', sortOrder = 'desc' } = data;

    let where = {};
    // 关键词搜索
    if (keyword) {
      if (libs.common.isObjectId(keyword)) {
        where = _.or([
          { name: keyword },
          { department: keyword }
        ]);
      } else {
        where = _.or([
          { name: new RegExp(keyword, 'i') },
          { department: new RegExp(keyword, 'i') }
        ]);
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
   * 新增记录
   * @param {Object} data - 员工数据
   * @param {string} data.name - 姓名
   * @param {number} [data.age] - 年龄
   * @param {string} [data.department] - 部门
   * @param {string} [data.city] - 城市
   * @param {string} [data.email] - 邮箱
   * @param {string} [data.phone] - 电话
   * @param {string} [data.address] - 地址
   * @param {number} [data.salary] - 薪资
   * @param {string} [data.joinDate] - 入职日期
   * @param {string} [data.status] - 状态
   * @returns {Promise<{id: string}>} 新增记录的 ID
   */
  async add(data = {}) {
    const { _id, create_time, update_time, ...record } = data;
    record.create_time = Date.now();
    const { id } = await collection.add(record);
    return { id };
  },

  /**
   * 更新记录
   * @param {string} _id - 记录 ID
   * @param {Object} data - 更新数据
   * @param {string} [data.name] - 姓名
   * @param {number} [data.age] - 年龄
   * @param {string} [data.department] - 部门
   * @param {string} [data.city] - 城市
   * @param {string} [data.email] - 邮箱
   * @param {string} [data.phone] - 电话
   * @param {string} [data.address] - 地址
   * @param {number} [data.salary] - 薪资
   * @param {string} [data.joinDate] - 入职日期
   * @param {string} [data.status] - 状态
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
  }
};
