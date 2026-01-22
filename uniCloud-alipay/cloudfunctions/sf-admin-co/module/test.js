/**
 * 模块控制器层
 */

const testService = require("../service/test");
class Action {
  async _before(params = {}) {

  }

  async _after(res, err) {
    if (err) {
      throw err;
    }
    return res;
  }
  /**
   * 获取列表数据
   */
  async getList(data = {}) {
    let res = await testService.getList(data);
    return res;
  }

}
module.exports = new Action();
