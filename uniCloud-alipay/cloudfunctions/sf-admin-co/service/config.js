/**
 * 系统配置 - 服务实现层
 */
const db = uniCloud.database();
const _ = db.command;
const $ = _.aggregate;

const libs = require('../libs');
const collection = db.collection("sf_system_config");

const CONFIG_ID = 'main';

module.exports = {
  /**
   * 获取系统配置
   */
  async get() {
    const { data: [info] } = await collection.doc(CONFIG_ID).get();
    return info || {};
  },

  /**
   * 更新系统配置
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
