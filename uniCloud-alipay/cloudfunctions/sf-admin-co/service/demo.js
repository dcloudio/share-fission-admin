/**
 * Demo 员工表 - 服务实现层
 */
const libs = require('../libs');

const db = uniCloud.database();
const _ = db.command;

const TABLE_NAME = 'sf-demo-employee';
const collection = db.collection(TABLE_NAME);

module.exports = {
  /**
   * 分页查询列表
   */
  async getList(data = {}) {
    let { pageIndex = 1, pageSize = 20, keyword = '' } = data;

    let where = {};
    // 关键词搜索
    if (keyword) {
      where = _.or([
        { name: new RegExp(keyword, 'i') },
        { department: new RegExp(keyword, 'i') }
      ]);
    }

    const skip = (pageIndex - 1) * pageSize;
    let { data: list } = await collection.where(where).orderBy('create_time', 'desc').skip(skip).limit(pageSize).get();
    let { total } = await collection.where(where).count();

    return { list, total };
  },

  /**
   * 获取单条记录
   */
  async getById(_id) {
    const { data: [info] } = await collection.doc(_id).get();
    return info;
  },

  /**
   * 新增记录
   */
  async add(data = {}) {
    const now = Date.now();
    const record = {
      ...data,
      create_time: now,
    };
    const { id } = await collection.add(record);
    return { id };
  },

  /**
   * 更新记录
   */
  async update(_id, data = {}) {
    const updateData = {
      ...data,
      update_time: Date.now()
    };
    const { updated } = await collection.doc(_id).update(updateData);
    return { updated };
  },

  /**
   * 删除记录（支持批量）
   */
  async remove(ids) {
    if (!Array.isArray(ids)) ids = [ids];
    const { deleted } = await collection.where({ _id: _.in(ids) }).remove();
    return { deleted };
  }
};
