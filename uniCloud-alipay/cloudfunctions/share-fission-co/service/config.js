/**
 * 系统配置 - 服务实现层
 */
const db = uniCloud.database();
const _ = db.command;
const $ = _.aggregate;

const { Tables } = require('../constants');
const collection = db.collection(Tables.systemConfig);

const CONFIG_ID = 'main';

module.exports = {
  /**
   * 获取系统配置
   * @returns {Promise<Object>} 系统配置对象
   */
  async get() {
    const { data: [info] } = await collection.doc(CONFIG_ID).get();
    return info || {};
  },

  /**
   * 更新系统配置
   * @param {Object} data - 配置数据
   * @param {string} [data.app_name] - 应用名称
   * @param {string} [data.app_logo] - 应用 Logo
   * @param {string} [data.app_description] - 应用描述
   * @param {string} [data.copyright] - 版权信息
   * @param {string} [data.icp_number] - ICP 备案号
   * @returns {Promise<{result: Object}>} 更新结果
   */
  async update(data = {}) {
    const { _id, ...rest } = data;
    const updateData = {
      ...rest,
      update_time: Date.now()
    };

    // 检查是否存在
    const { total } = await collection.where({ _id: CONFIG_ID }).count();

    let res;
    if (total > 0) {
      res = await collection.doc(CONFIG_ID).update(updateData);
    } else {
      res = await collection.add({
        _id: CONFIG_ID,
        ...updateData
      });
    }

    return { result: res };
  }
};
