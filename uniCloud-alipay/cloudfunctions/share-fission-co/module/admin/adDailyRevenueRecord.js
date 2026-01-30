/**
 * 每日广告收益记录 - 模块控制器层
 * @module module/admin/adDailyRevenueRecord
 */
const service = require('../../service');
const { fail } = require('../../libs/response');

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
  
  /**
   * 查询列表
   * @param {Object} data - 查询参数
   * @returns {Promise<Object>} 返回列表数据
   */
  async getList(data = {}) {
    return await service.adDailyRevenueRecord.getList(data);
  },
  
  /**
   * 查询详情
   * @param {Object} data - 查询参数
   * @param {string} data._id - 记录ID
   * @returns {Promise<Object>} 返回记录详情
   */
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });
    return await service.adDailyRevenueRecord.getById(_id);
  },
  
  /**
   * 填写广告收入
   * @param {Object} data - 收益数据
   * @param {string} data._id - 记录ID
   * @param {number} data.total_cash - 总奖励
   * @param {number} data.total_score - 总积分
   * @param {string} [data.remark] - 备注
   * @returns {Promise<Object>} 返回操作结果
   */
  async fillRevenue(data = {}) {
    const { _id, total_cash, total_score, remark = '' } = data;
    if (!_id) return fail(400001, { name: '_id' });
    if (total_cash === undefined || total_cash === null) return fail(400001, { name: 'total_cash' });
    if (typeof total_cash !== 'number' || total_cash < 0) return fail(400002, { name: 'total_cash', message: '总奖励必须是非负数' });
    if (total_score === undefined || total_score === null) return fail(400001, { name: 'total_score' });
    if (typeof total_score !== 'number' || total_score < 0) return fail(400002, { name: 'total_score', message: '总积分必须是非负数' });
    await service.adDailyRevenueRecord.fillRevenue(data);
    await service.fundPoolLogs.addFund(total_cash, remark, total_score);
    return { success: true };
  },
  
  /**
   * 更新备注
   * @param {Object} data - 更新数据
   * @param {string} data._id - 记录ID
   * @param {string} data.remark - 备注内容
   * @returns {Promise<Object>} 返回操作结果
   */
  async updateRemark(data = {}) {
    const { _id, remark } = data;
    if (!_id) return fail(400001, { name: '_id' });
    return await service.adDailyRevenueRecord.updateRemark(_id, remark);
  }
}
