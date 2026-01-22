/**
 * 服务实现层
 */
const libs = require('../libs'); // 工具类

const db = uniCloud.database();
const _ = db.command;
const $ = db.command.aggregate;

const testCollection = db.collection("test");

module.exports = {
  /**
   * 获取列表数据
   */
  async getList(data = {}) {
    let {
      pageIndex = 1,
      pageSize = 20
    } = data;

    const where = {};
    const skip = (pageIndex - 1) * pageSize;
    const limit = pageSize;

    let { data: list } = await testCollection.where(where).skip(skip).limit(limit).get();
    let { total } = await testCollection.where(where).count();

    return {
      list,
      total
    };
  }
}
