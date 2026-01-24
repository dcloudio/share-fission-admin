const libs = require('../libs'); // 工具类

const db = uniCloud.database();
const _ = db.command;
const $ = db.command.aggregate;

const oneDayTime = 1000 * 3600 * 24; // 一天的时间戳

module.exports = async function(params = {}) {
  const nowTime = Date.now(); // 当前时间戳
  const yesterday = nowTime - oneDayTime; // 昨天的时间戳
  let statement_date = libs.common.timeFormat(yesterday, "yyyy-MM-dd"); // 账单日期，格式为yyyy-MM-dd
  console.log('statement_date: ', statement_date)
  return {
    errCode: 0
  };
}
