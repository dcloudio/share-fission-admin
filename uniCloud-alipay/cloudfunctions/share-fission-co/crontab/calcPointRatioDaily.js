/**
 * 定时任务 - 计算积分兑换现金的比例
 * 计算公式：
 * 今日积分兑换比例 = 昨日用户积分余额总和 / 奖金池现金总和
 * 昨日用户积分余额总和 = sf-ad-watch-logs 表 score 字段求和
 * 奖金池现金总和 = sf-ad-watch-logs 表 revenue 字段求和
 *
 * 结果保存到 sf-ad-daily-revenue-record 表
 */
const libs = require('../libs'); // 工具类
const { Tables } = require('../constants'); // 表名常量

const db = uniCloud.database();
const _ = db.command;
const $ = db.command.aggregate;

const adDailyRevenueRecordCollection = db.collection(Tables.adDailyRevenueRecord);
const adWatchLogsCollection = db.collection(Tables.adWatchLogs);

const oneDayTime = 1000 * 3600 * 24; // 一天的时间戳

module.exports = async function(params = {}) {
  const nowTime = Date.now(); // 当前时间戳
  const yesterday = nowTime - oneDayTime; // 昨天的时间戳
  const statement_date = libs.common.timeFormat(yesterday, "yyyy-MM-dd"); // 统计日期，格式为yyyy-MM-dd
  console.log('结算日期: ', statement_date);

  try {
    // 1. 检查是否已经生成过当天的记录

    const existRecord = await adDailyRevenueRecordCollection.where({ statement_date: statement_date }).get();

    if (existRecord.data && existRecord.data.length > 0) {
      console.log(`${statement_date} 的记录已存在，跳过生成`);
      return {
        errCode: 0,
        errMsg: '记录已存在'
      };
    }

    // 2. 计算昨天0点到23:59:59的时间范围
    const yesterdayStart = new Date(`${statement_date}T00:00:00+08:00`).getTime();
    const yesterdayEnd = yesterdayStart + oneDayTime - 1;

    console.log('时间范围:', {
      start: libs.common.timeFormat(yesterdayStart, "yyyy-MM-dd HH:mm:ss"),
      end: libs.common.timeFormat(yesterdayEnd, "yyyy-MM-dd HH:mm:ss")
    });

    // 3. 从 sf-ad-watch-logs 表统计昨天的数据

    // 使用聚合查询统计数据
    const aggregateResult = await adWatchLogsCollection.aggregate()
      .match({
        watch_time: _.gte(yesterdayStart).and(_.lte(yesterdayEnd))
      })
      .group({
        _id: null,
        total_score: $.sum('$score'), // 总积分
        total_cash: $.sum('$revenue'), // 总奖励（元）
        total_times: $.sum(1), // 总次数
        user_ids: $.addToSet('$user_id') // 收集所有不重复的用户ID
      })
      .end();

    console.log('聚合查询结果:', aggregateResult);

    // 4. 处理统计结果
    let total_score = 0;
    let total_cash = 0;
    let total_times = 0;
    let total_people = 0;

    if (aggregateResult.data && aggregateResult.data.length > 0) {
      const stats = aggregateResult.data[0];
      total_score = Math.floor(stats.total_score || 0); // 总积分（整数）
      total_cash = Math.floor((stats.total_cash || 0) * 100); // 总奖励转换为分（整数）
      total_times = stats.total_times || 0; // 总次数
      total_people = (stats.user_ids || []).length; // 去重后的用户数
    }

    console.log('统计数据:', {
      total_score,
      total_cash,
      total_times,
      total_people
    });

    // 5. 将统计结果插入到 sf-ad-daily-revenue-record 表
    const recordData = {
      statement_date: statement_date,
      total_cash: total_cash, // 总奖励（分）
      total_score: total_score, // 总积分
      total_people: total_people, // 总人数
      total_times: total_times, // 总次数
      is_settled: false, // 标记为未结算
      remark: `${statement_date} 的广告收益统计`,
      create_time: nowTime,
      update_time: nowTime
    };

    const insertResult = await adDailyRevenueRecordCollection.add(recordData);
    console.log('插入结果:', insertResult);

    if (insertResult.id) {
      console.log(`成功生成 ${statement_date} 的每日广告收益记录`);
      return {
        errCode: 0,
        errMsg: '统计成功',
        data: recordData
      };
    } else {
      throw new Error('插入记录失败');
    }

  } catch (error) {
    console.error('定时任务执行失败:', error);
    return {
      errCode: -1,
      errMsg: error.message || '执行失败'
    };
  }
}
