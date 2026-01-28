/**
 * 用户管理 - 模块控制器层（客户端API）
 * @module client/user
 * @description 客户端API，提供分销裂变业务特有的用户功能。
 * uni-id-co 已提供基础的用户管理功能（登录、注册、获取用户信息、更新用户信息、获取下线列表等），
 * 本模块专注于分销裂变业务特有的功能。
 */
const service = require('../../service');
const { fail } = require('../../libs/response');
const { Tables } = require('../../constants');

module.exports = {
  /**
   * 函数执行前钩子
   * @async
   * @function _before
   * @description 在执行具体方法前进行权限验证。所有方法都需要登录验证，因为只能操作当前用户自己的数据。
   * @returns {Promise<void>}
   */
  async _before() {
    const methodName = this.getMethodName();
    // 所有方法都需要登录验证
    const noAuthFunctionNames = [];
    const requireAuth = !noAuthFunctionNames.includes(methodName);
    await this.middleware.auth(requireAuth);
  },

  /**
   * 获取当前用户的邀请码
   * @async
   * @function getInviteCode
   * @description 获取当前登录用户的邀请码（my_invite_code），用于生成邀请链接、分享邀请码等。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 只能获取当前用户自己的邀请码
   * - 如果用户没有邀请码，将返回空字符串
   *
   * @param {Object} [data={}] - 查询参数对象（当前版本暂未使用，保留用于扩展）
   * @returns {Promise<Object>} 返回邀请码对象，包含 invite_code 字段
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 获取当前用户的邀请码
   * const result = await user.getInviteCode();
   * console.log(result.invite_code); // 邀请码字符串
   *
   * @example
   * // 生成邀请链接
   * const { invite_code } = await user.getInviteCode();
   * const inviteUrl = `https://example.com/register?inviteCode=${invite_code}`;
   */
  async getInviteCode(data = {}) {
    const user_id = this.getUserId();
    const user = await service.user.getById(user_id);
    if (!user) {
      return fail(404001, { name: '用户' });
    }
    return {
      invite_code: user.my_invite_code || ''
    };
  },

  /**
   * 获取团队统计信息
   * @async
   * @function getTeamStats
   * @description 获取当前用户的团队统计数据，包括一级/二级下线数量、团队总人数和团队总收益。
   *
   * **重要说明：**
   * - 需要登录验证
   * - 只能查询当前用户自己的团队统计
   * - 一级下线：inviter_uid[0] 等于当前用户ID的用户
   * - 二级下线：inviter_uid[1] 等于当前用户ID的用户
   * - 团队收益：从积分记录中统计 source='invite' 且 relation_level 相关的收益
   *
   * @param {Object} [data={}] - 查询参数对象（当前版本暂未使用，保留用于扩展）
   * @returns {Promise<Object>} 返回团队统计对象，包含以下字段：
   *   - level1_count: 一级下线数量
   *   - level2_count: 二级下线数量
   *   - total_count: 团队总人数（一级+二级）
   *   - total_income: 团队总收益（积分），从积分记录中统计 source='invite' 的收益总和
   * @throws {Object} 如果未登录，返回认证错误，格式：{ errCode: number, errMsg: string }
   * @example
   * // 获取团队统计信息
   * const stats = await user.getTeamStats();
   * console.log(stats.level1_count); // 一级下线数量
   * console.log(stats.level2_count); // 二级下线数量
   * console.log(stats.total_count); // 团队总人数
   * console.log(stats.total_income); // 团队总收益（积分）
   */
  async getTeamStats(data = {}) {
    const user_id = this.getUserId();
    const db = uniCloud.database();
    const usersCollection = db.collection(Tables.users);
    const scoresCollection = db.collection(Tables.scores);

    // 统计一级下线数量（inviter_uid[0] 等于当前用户ID）
    const level1Result = await usersCollection.where({
      'inviter_uid.0': user_id
    }).count();

    // 统计二级下线数量（inviter_uid[1] 等于当前用户ID）
    const level2Result = await usersCollection.where({
      'inviter_uid.1': user_id
    }).count();

    // 统计团队总收益（从积分记录中查询 source='invite' 且 user_id 为当前用户的记录）
    // 注意：团队收益是指当前用户从团队获得的收益，所以查询条件是 user_id 为当前用户
    const incomeResult = await scoresCollection.where({
      user_id: user_id,
      source: 'invite',
      type: 1 // 收入类型
    }).field({
      score: true
    }).get();

    // 计算总收益
    const total_income = incomeResult.data.reduce((sum, record) => {
      return sum + (record.score || 0);
    }, 0);

    return {
      level1_count: level1Result.total || 0,
      level2_count: level2Result.total || 0,
      total_count: (level1Result.total || 0) + (level2Result.total || 0),
      total_income: total_income
    };
  }
}
