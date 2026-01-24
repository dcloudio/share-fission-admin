// 加载uniId公共模块
const uniIdCommon = require('uni-id-common')
// 加载全局中间件
const middleware = require('./middleware');

module.exports = {
  // 函数执行前钩子
  async _before() {
    const params = this.getParams();
    let clientInfo;
    if (params && params[0] && params[0].clientInfo) {
      clientInfo = params[0].clientInfo;
    } else {
      clientInfo = this.getClientInfo();
    }
    this.uniIdCommon = uniIdCommon.createInstance({
      clientInfo
    });

    // 挂载中间件
    this.middleware = {}
    for (const mwName in middleware) {
      this.middleware[mwName] = middleware[mwName].bind(this);
    }
    // 设置全局获取userId公共函数（可在此云对象的任意其他函数内通过 this.getUserId() 获取当前登录用户的id
    this.getUserId = () => {
      return this.authInfo && this.authInfo.uid ? this.authInfo.uid : undefined;
    }
  },
  // 函数执行后钩子
  _after(error, result) {
    if (error) {
      throw error
    }
    if (typeof result === "object" && !result.errCode) result.errCode = 0;
    return result
  },
  // 定时任务
  _timing: async function(event) {
    let cloudInfo = uniCloud.getCloudInfos();
    console.log('timing------', cloudInfo);
    console.log('event------', event);
    this.source = 'crontab';
    //加载校验组件
    this.validator = new Validator();
    // 挂载中间件
    this.middleware = {}
    for (const mwName in middleware) {
      this.middleware[mwName] = middleware[mwName].bind(this);
    }
    const smsServerCrontabs = require('./crontab');
    if (smsServerCrontabs[event.TriggerName]) {
      console.log('--trigger', event.TriggerName);
      smsServerCrontabs[event.TriggerName].bind(this)({});
    }
  },
  // 加载自定义函数模块
  action: require('./index.action.js'),
  // 加载定时任务（便于手动触发）
  crontab: require('./index.crontab.js')
}
