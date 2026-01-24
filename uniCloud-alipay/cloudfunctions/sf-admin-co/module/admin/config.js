/**
 * 系统配置 - 模块层
 */
const service = require('../../service');
const libs = require('../../libs');
const fail = libs.response.fail;

module.exports = {
  /**
   * 获取配置
   */
  async get() {
    return await service.config.get();
  },

  /**
   * 更新配置
   */
  async update(data = {}) {
    // 简单校验
    if (typeof data !== 'object') {
      return fail('Invalid data');
    }
    return await service.config.update(data);
  }
};
