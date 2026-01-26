/**
 * 广告观看记录表 - 服务实现层
 */
const db = uniCloud.database();
const _ = db.command;

const { Tables } = require('../constants');
const libs = require('../libs');
const collection = db.collection(Tables.adWatchLogs);

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
          { _id: keyword },
          { user_id: keyword },
          { ad_id: keyword }
        ]);
      } else {
        where = _.or([
          { user_id: new RegExp(keyword, 'i') },
          { ad_id: new RegExp(keyword, 'i') },
          { ad_type: new RegExp(keyword, 'i') }
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
      query = query.orderBy("_id", sortOrder || 'desc');
    }

    let { data: list } = await query.skip(skip).limit(pageSize).get();
    let { total } = await collection.where(where).count();

    return { list, total };
  }
};
