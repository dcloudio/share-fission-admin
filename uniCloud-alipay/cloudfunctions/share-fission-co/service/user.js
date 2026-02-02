/**
 * 用户表 (uni-id-users) - 服务实现层
 * @module service/user
 * @description 用户管理模块，提供用户信息的增删改查功能，支持手机号/邮箱唯一性校验
 */
const { Tables } = require('../constants');
const libs = require('../libs');
const BaseService = require('./base');

/**
 * @typedef {Object} User
 * @property {string} [_id] - 用户ID
 * @property {string} username - 用户名
 * @property {string} [nickname] - 昵称
 * @property {string} [avatar] - 头像 URL
 * @property {string} [mobile] - 手机号
 * @property {number} [mobile_confirmed] - 手机号是否已确认（0:未确认 1:已确认）
 * @property {string} [email] - 邮箱
 * @property {number} [email_confirmed] - 邮箱是否已确认（0:未确认 1:已确认）
 * @property {number} [status=0] - 用户状态（0:正常 1:禁用 2:审核中 3:审核拒绝）
 * @property {number} [score] - 用户积分
 * @property {number} [register_date] - 注册时间戳（毫秒）
 */

/**
 * @typedef {Object} UserListQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [keyword=''] - 搜索关键词，支持按ID、用户名、昵称、手机号搜索
 * @property {string} [sortField=''] - 排序字段
 * @property {string} [sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} UserListResult
 * @property {User[]} list - 用户列表（不包含 token 和 password 字段）
 * @property {number} total - 总记录数
 */

/**
 * 用户状态枚举
 * @readonly
 * @enum {number}
 */
const UserStatus = {
  /** 正常 */
  NORMAL: 0,
  /** 禁用 */
  DISABLED: 1,
  /** 审核中 */
  PENDING: 2,
  /** 审核拒绝 */
  REJECTED: 3
};

class UserService extends BaseService {
  constructor() {
    super();
    this.tableName = Tables.users;
    this.scoresCollection = this.db.collection(Tables.scores);
  }

  /**
   * 分页查询用户列表
   * @async
   * @function getList
   * @description 支持关键词搜索（ID、用户名、昵称、手机号）、自定义排序和分页。
   * 返回结果不包含敏感字段（token、password）。默认按注册时间倒序排列
   * @param {UserListQueryParams} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.keyword=''] - 搜索关键词，支持按ID、用户名、昵称、手机号搜索
   * @param {string} [data.sortField=''] - 排序字段，为空时默认按 register_date 倒序
   * @param {string} [data.sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
   * @returns {Promise<UserListResult>} 返回用户列表数据和总数
   * @example
   * const result = await userService.getList({
   *   pageIndex: 1,
   *   pageSize: 10,
   *   keyword: '13800138000'
   * });
   */
  async getList(data = {}) {
    let { user_id, pageIndex = 1, pageSize = 20, keyword = '', sortField = '', sortOrder = 'desc' } = data;

    let where = {};

    if (user_id) {
      where.user_id = user_id;
    }

    // 关键词搜索
    if (keyword) {
      if (libs.common.isObjectId(keyword)) {
        where = this._.or([
          { _id: keyword },
          { username: keyword },
          { nickname: keyword },
          { mobile: keyword }
        ]);
      } else {
        where = this._.or([
          { username: new RegExp(keyword, 'i') },
          { nickname: new RegExp(keyword, 'i') },
          { mobile: new RegExp(keyword, 'i') }
        ]);
      }
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建查询（排除敏感字段）
    let query = this.collection.where(where).field({
      token: false,
      password: false,
    });

    // 处理排序
    if (sortField && sortOrder) {
      query = query.orderBy(sortField, sortOrder);
    } else {
      // 默认按注册时间倒序
      query = query.orderBy('register_date', 'desc');
    }

    if (sortField !== "_id") {
      query = query.orderBy("_id", sortOrder);
    }

    // 并行执行查询列表和查询总数
    const [listResult, totalResult] = await Promise.all([
      query.skip(skip).limit(pageSize).get(),
      this.collection.where(where).count()
    ]);

    return {
      list: listResult.data,
      total: totalResult.total
    };
  }

  /**
   * 根据ID获取单条用户记录
   * @async
   * @function getById
   * @description 获取用户详情，返回结果不包含敏感字段（token、password）
   * @param {string} _id - 用户ID
   * @returns {Promise<User|undefined>} 用户详情，如果不存在则返回 undefined
   * @example
   * const user = await userService.getById('xxx');
   * if (user) {
   *   console.log(user.nickname);
   * }
   */
  async getById(_id) {
    if (!_id) return undefined;
    const { data: [info] } = await this.collection
      .doc(_id)
      .field({
        token: false,
        password: false,
      })
      .get();
    return info;
  }

  /**
   * 新增用户记录
   * @async
   * @function add
   * @description 创建新用户，会自动添加 register_date 字段，status 默认为 0（正常）
   * @param {Object} [data={}] - 用户数据对象
   * @param {string} data.username - 用户名（必填）
   * @param {string} [data.nickname] - 昵称
   * @param {string} [data.avatar] - 头像 URL
   * @param {string} [data.mobile] - 手机号
   * @param {string} [data.email] - 邮箱
   * @param {number} [data.status=0] - 状态（0:正常 1:禁用 2:审核中 3:审核拒绝）
   * @returns {Promise<{id: string}>} 包含新增用户ID的对象
   * @example
   * const result = await userService.add({
   *   username: 'testuser',
   *   nickname: '测试用户',
   *   mobile: '13800138000'
   * });
   */
  async add(data = {}) {
    const { _id, register_date, ...record } = data;
    record.register_date = Date.now();
    record.status = record.status ?? 0;
    const { id } = await this.collection.add(record);
    return { id };
  }

  /**
   * 更新用户记录
   * @async
   * @function update
   * @description 根据ID更新用户信息。会自动校验手机号和邮箱的唯一性。
   * 更新手机号时会自动设置 mobile_confirmed=1，清空则删除该字段。
   * 更新邮箱时会自动设置 email_confirmed=1，清空则删除该字段。
   * 不允许更新 username、register_date、password 字段
   * @param {string} _id - 用户ID
   * @param {Object} [data={}] - 要更新的数据
   * @param {string} [data.nickname] - 昵称
   * @param {string} [data.avatar] - 头像 URL
   * @param {string} [data.mobile] - 手机号（会校验唯一性）
   * @param {string} [data.email] - 邮箱（会校验唯一性）
   * @param {number} [data.status] - 状态（0:正常 1:禁用 2:审核中 3:审核拒绝）
   * @returns {Promise<{updated: number}>} 更新的记录数（0或1）
   * @throws {Error} 该手机号已被其他用户使用
   * @throws {Error} 该邮箱已被其他用户使用
   * @example
   * const result = await userService.update('xxx', {
   *   nickname: '新昵称',
   *   mobile: '13900139000'
   * });
   */
  async update(_id, data = {}) {
    // 排除不允许更新的字段
    const { _id: __, username, register_date, password, mobile, email, ...rest } = data;

    // 处理手机号
    if (mobile !== undefined) {
      if (mobile) {
        // 检查手机号是否与其他用户重复
        const { total } = await this.collection.where({
          _id: this._.neq(_id),
          mobile: mobile
        }).count();
        if (total > 0) {
          throw new Error('该手机号已被其他用户使用');
        }
        // 手机号有值，设置 mobile_confirmed = 1
        rest.mobile = mobile;
        rest.mobile_confirmed = 1;
      } else {
        // 手机号清空，删除 mobile 和 mobile_confirmed 字段
        rest.mobile = this._.remove();
        rest.mobile_confirmed = this._.remove();
      }
    }

    // 处理邮箱
    if (email !== undefined) {
      if (email) {
        // 检查邮箱是否与其他用户重复
        const { total } = await this.collection.where({
          _id: this._.neq(_id),
          email: email
        }).count();
        if (total > 0) {
          throw new Error('该邮箱已被其他用户使用');
        }
        // 邮箱有值，设置 email_confirmed = 1
        rest.email = email;
        rest.email_confirmed = 1;
      } else {
        // 邮箱清空，删除 email 和 email_confirmed 字段
        rest.email = this._.remove();
        rest.email_confirmed = this._.remove();
      }
    }

    const { updated } = await this.collection.doc(_id).update(rest);
    return { updated };
  }

  /**
   * 给指定用户增加或扣除积分
   * @async
   * @function addScore
   * @description 给用户增加积分或扣除积分，同时记录积分变动日志。
   * 当 source='rewarded-video-ad' 时，会根据系统配置给上级和上上级发放奖励。
   * @param {string} user_id - 用户ID
   * @param {number} score - 增加的积分数量（可以为负数表示扣除）
   * @param {string} source - 积分来源（如：'admin_add', 'admin_deduct', 'rewarded-video-ad' 等）
   * @param {string} [comment=''] - 备注说明
   * @returns {Promise<{new_balance: number}>} 返回更新后的积分余额
   * @throws {Error} 用户不存在
   * @throws {Error} 积分变动数量不能为0
   * @example
   * // 给用户增加 100 积分
   * const result = await userService.addScore('xxx', 100, 'admin_add', '管理员手动增加积分');
   *
   * // 扣除用户 50 积分
   * const result = await userService.addScore('xxx', -50, 'admin_deduct', '违规扣除');
   */
  async addScore(user_id, score, source, comment = '') {
    // 参数验证
    if (!user_id) {
      throw new Error('用户ID不能为空');
    }
    if (!score || score === 0) {
      throw new Error('积分变动数量不能为0');
    }
    if (!source) {
      throw new Error('积分来源不能为空');
    }

    // 检查用户是否存在
    const { data: [user] } = await this.collection.doc(user_id).get();
    if (!user) {
      throw new Error('用户不存在');
    }

    // 开启事务
    const transaction = await this.db.startTransaction();

    try {
      const now = Date.now();

      // 更新用户积分
      const { data: currentUser } = await transaction.collection(this.tableName).doc(user_id).get();
      const currentScore = currentUser.score || 0;
      const new_balance = currentScore + score;

      await transaction.collection(this.tableName).doc(user_id).update({
        score: this._.inc(score)
      });

      // 添加积分变动记录
      await transaction.collection(Tables.scores).add({
        user_id,
        score: score,
        type: score > 0 ? 1 : 2, // 1=收入 2=支出
        balance: new_balance,
        source: source,
        comment: comment || (score > 0 ? '增加积分' : '扣除积分'),
        create_date: now
      });

      // 如果是看广告获得积分，给上级和上上级发放奖励
      if (source === 'rewarded-video-ad' && score > 0) {
        await this._rewardInvitersInTransaction(transaction, user, score, now);
      }

      // 提交事务
      await transaction.commit();

      return {
        new_balance: new_balance,
        score_change: score
      };
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 在事务中给上级发放奖励（内部方法）
   * @async
   * @function _rewardInvitersInTransaction
   * @private
   * @param {Object} transaction - 事务对象
   * @param {Object} user - 当前用户对象
   * @param {number} score - 用户获得的积分
   * @param {number} now - 当前时间戳
   */
  async _rewardInvitersInTransaction(transaction, user, score, now) {
    // 获取系统配置
    const { data: config } = await transaction.collection(Tables.systemConfig).doc('main').get();
    if (!config) {
      return;
    }

    const { ad_score_l1_rate = 0, ad_score_l2_rate = 0 } = config;
    const inviter_uid = user.inviter_uid || [];

    // 给一级上级发放奖励
    if (inviter_uid[0] && ad_score_l1_rate > 0) {
      const l1Score = Math.floor(score * ad_score_l1_rate);
      if (l1Score > 0) {
        await this._addInviterScoreInTransaction(
          transaction,
          inviter_uid[0],
          l1Score,
          now,
          `一级用户${user._id}看广告奖励`
        );
      }
    }

    // 给二级上级发放奖励
    if (inviter_uid[1] && ad_score_l2_rate > 0) {
      const l2Score = Math.floor(score * ad_score_l2_rate);
      if (l2Score > 0) {
        await this._addInviterScoreInTransaction(
          transaction,
          inviter_uid[1],
          l2Score,
          now,
          `二级用户${user._id}看广告奖励`
        );
      }
    }
  }

  /**
   * 在事务中给邀请人增加积分（内部方法）
   * @async
   * @function _addInviterScoreInTransaction
   * @private
   * @param {Object} transaction - 事务对象
   * @param {string} inviter_id - 邀请人用户ID
   * @param {number} score - 奖励积分
   * @param {number} now - 当前时间戳
   * @param {string} comment - 备注
   */
  async _addInviterScoreInTransaction(transaction, inviter_id, score, now, comment) {
    // 获取邀请人当前积分
    const { data: inviter } = await transaction.collection(this.tableName).doc(inviter_id).get();
    if (!inviter) {
      return; // 邀请人不存在，跳过
    }

    const currentScore = inviter.score || 0;
    const new_balance = currentScore + score;

    // 更新邀请人积分
    await transaction.collection(this.tableName).doc(inviter_id).update({
      score: this._.inc(score)
    });

    // 添加积分变动记录
    await transaction.collection(Tables.scores).add({
      user_id: inviter_id,
      score: score,
      type: 1, // 1=收入
      balance: new_balance,
      source: 'invite',
      comment: comment,
      create_date: now
    });
  }

  /**
   * 获取团队统计信息
   * @async
   * @function getTeamStats
   * @param {string} user_id - 用户ID
   * @param {Object} [options={}] - 查询选项
   * @param {string} [options.timeRange='all'] - 时间范围 today|yesterday|week|all
   * @returns {Promise<Object>} 返回团队统计对象
   */
  async getTeamStats(user_id, options = {}) {
    if (!user_id) {
      throw new Error('用户ID不能为空');
    }

    const { timeRange = 'all' } = options;

    // 统计一级下线数量
    const level1Result = await this.collection.where({
      'inviter_uid.0': user_id
    }).count();

    // 统计二级下线数量
    const level2Result = await this.collection.where({
      'inviter_uid.1': user_id
    }).count();

    // 计算时间范围
    const timeFilter = this._getTimeFilter(timeRange);

    // 基础积分查询条件
    const baseWhere = {
      user_id: user_id,
      source: 'invite',
      type: 1
    };

    // 全部时间的总收益
    const incomeAllResult = await this.scoresCollection
      .where(baseWhere)
      .field({ score: true })
      .get();

    const total_income_all = incomeAllResult.data.reduce((sum, record) => {
      return sum + (record.score || 0);
    }, 0);

    // 指定时间范围的收益
    let total_income = total_income_all;
    if (timeFilter) {
      const timeWhere = { ...baseWhere, create_date: timeFilter };
      const incomeResult = await this.scoresCollection
        .where(timeWhere)
        .field({ score: true })
        .get();

      total_income = incomeResult.data.reduce((sum, record) => {
        return sum + (record.score || 0);
      }, 0);
    }

    return {
      level1_count: level1Result.total || 0,
      level2_count: level2Result.total || 0,
      total_count: (level1Result.total || 0) + (level2Result.total || 0),
      total_income,
      total_income_all
    };
  }

  /**
   * 获取时间过滤条件（内部方法）
   * @private
   * @param {string} timeRange - 时间范围
   * @returns {Object|null} 数据库查询条件
   */
  _getTimeFilter(timeRange) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1;

    switch (timeRange) {
      case 'today':
        return this._.gte(todayStart).and(this._.lte(todayEnd));
      case 'yesterday':
        const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
        const yesterdayEnd = todayStart - 1;
        return this._.gte(yesterdayStart).and(this._.lte(yesterdayEnd));
      case 'week':
        const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;
        return this._.gte(weekStart).and(this._.lte(todayEnd));
      case 'all':
      default:
        return null;
    }
  }
}

module.exports = new UserService();
