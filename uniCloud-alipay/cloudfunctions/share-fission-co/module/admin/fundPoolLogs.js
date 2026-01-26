/**
 * 资金池流水 - 模块控制器层
 */
const service = require('../../service');

module.exports = {
  // 函数执行前钩子
  async _before() {
    // 登录验证中间件
    await this.middleware.auth();
  },
  // 函数执行后钩子
  _after(error, result) {
    if (error) {
      throw error
    }
    if (typeof result === "object" && !result.errCode) result.errCode = 0;
    return result
  },
  // 获取资金池信息
  async getPool() {
    return await service.fundPoolLogs.getPool();
  },
  // 查流水列表
  async getList(data = {}) {
    return await service.fundPoolLogs.getList(data);
  }
}
