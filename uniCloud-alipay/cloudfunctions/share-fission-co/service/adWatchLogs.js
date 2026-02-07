/**
 * 广告观看记录表 - 服务实现层
 * @module service/adWatchLogs
 * @description 广告观看记录管理模块，提供广告观看记录的查询功能。
 * 用于追踪用户观看广告的行为和积分获取情况
 */
const { Tables } = require('../constants');
const libs = require('../libs');
const BaseService = require('./base');

/**
 * @typedef {Object} AdWatchLog
 * @property {string} [_id] - 记录ID
 * @property {string} user_id - 用户ID
 * @property {string} ad_id - 广告ID
 * @property {string} ad_type - 广告类型（如：rewardedVideo, interstitial 等）
 * @property {number} [score_earned] - 获得的积分数量
 * @property {number} [watch_duration] - 观看时长（秒）
 * @property {boolean} [is_complete] - 是否完整观看
 * @property {string} [platform] - 平台标识（如：mp-alipay, mp-weixin）
 * @property {Object} [device_info] - 设备信息
 * @property {number} [create_time] - 创建时间戳（毫秒）
 */

/**
 * @typedef {Object} AdWatchLogQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [keyword=''] - 搜索关键词，支持按ID、用户ID、广告ID、广告类型搜索
 * @property {string} [sortField=''] - 排序字段
 * @property {string} [sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} AdWatchLogListResult
 * @property {AdWatchLog[]} list - 广告观看记录列表
 * @property {number} total - 总记录数
 */

/**
 * 广告类型枚举
 * @readonly
 * @enum {string}
 */
const AdType = {
  /** 激励视频广告 */
  REWARDED_VIDEO: 'rewardedVideo',
  /** 插屏广告 */
  INTERSTITIAL: 'interstitial',
  /** Banner 广告 */
  BANNER: 'banner',
  /** 原生广告 */
  NATIVE: 'native'
};

class AdWatchLogsService extends BaseService {
  constructor() {
    super();
    this.tableName = Tables.adWatchLogs;
  }

  /**
   * 分页查询广告观看记录列表
   * @async
   * @function getList
   * @description 使用聚合管道查询广告观看记录列表，关联用户表获取昵称和头像。
   * 支持关键词搜索（ID、用户ID、广告ID、广告类型）、自定义排序和分页。
   * 默认按创建时间倒序排列
   * @param {AdWatchLogQueryParams} [data={}] - 查询参数对象
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.keyword=''] - 搜索关键词，支持按ID、用户ID、广告ID、广告类型搜索
   * @param {string} [data.sortField=''] - 排序字段，为空时默认按创建时间倒序
   * @param {string} [data.sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
   * @returns {Promise<AdWatchLogListResult>} 返回广告观看记录列表和总数
   * @example
   * // 查询某用户的广告观看记录
   * const result = await adWatchLogsService.getList({
   *   keyword: 'user_xxx',
   *   pageSize: 10
   * });
   */
  async getList(data = {}) {
    let { user_id, pageIndex = 1, pageSize = 20, keyword = '', sortField = '', sortOrder = 'desc' } = data;

    let matchConditions = [];

    // user_id 筛选
    if (user_id) {
      matchConditions.push({ user_id: user_id });
    }

    // 关键词搜索
    if (keyword) {
      if (libs.common.isObjectId(keyword)) {
        matchConditions.push({
          $or: [
            { _id: keyword },
            { user_id: keyword },
            { ad_id: keyword }
          ]
        });
      } else {
        matchConditions.push({
          $or: [
            { user_id: { $regex: keyword, $options: 'i' } },
            { ad_id: { $regex: keyword, $options: 'i' } },
            { ad_type: { $regex: keyword, $options: 'i' } }
          ]
        });
      }
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建聚合管道
    let pipeline = [];

    // 匹配条件
    if (matchConditions.length > 0) {
      pipeline.push({
        $match: matchConditions.length === 1 ? matchConditions[0] : { $and: matchConditions }
      });
    }

    // 关联用户表获取昵称和头像
    pipeline.push({
      $lookup: {
        from: Tables.users,
        localField: 'user_id',
        foreignField: '_id',
        as: 'user_info'
      }
    });

    // 添加计算字段
    pipeline.push({
      $addFields: {
        user_nickname: { $arrayElemAt: ['$user_info.nickname', 0] },
        user_avatar: { $arrayElemAt: ['$user_info.avatar', 0] }
      }
    });

    // 排序
    let sortObj = {};
    if (sortField && sortOrder) {
      sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj['create_time'] = -1;
    }
    if (sortField !== '_id') {
      sortObj['_id'] = sortOrder === 'asc' ? 1 : -1;
    }
    pipeline.push({ $sort: sortObj });

    // 统计总数的管道
    const countPipeline = [...pipeline, { $count: 'total' }];

    // 分页
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: pageSize });

    // 移除不需要的字段
    pipeline.push({
      $project: {
        user_info: 0
      }
    });

    // 执行查询
    const [listResult, countResult] = await Promise.all([
      this.collection.aggregate(pipeline).end(),
      this.collection.aggregate(countPipeline).end()
    ]);

    return {
      list: listResult.data || [],
      total: countResult.data[0]?.total || 0
    };
  }
}

module.exports = new AdWatchLogsService();
