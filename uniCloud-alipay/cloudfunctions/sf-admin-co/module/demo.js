/**
 * Demo 员工表 - 模块控制器层
 */
const demoService = require('../service/demo');

class Demo {
  async _before(params = {}) {}

  async _after(res, err) {
    if (err) throw err;
    return res;
  }

  /**
   * 获取列表数据
   */
  async getList(data = {}) {
    return await demoService.getList(data);
  }

  /**
   * 获取单条记录
   */
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return { errCode: 'PARAM_ERROR', errMsg: '缺少参数 _id' };
    return await demoService.getById(_id);
  }

  /**
   * 新增记录
   */
  async add(data = {}) {
    const { name } = data;
    if (!name) return { errCode: 'PARAM_ERROR', errMsg: '姓名不能为空' };
    return await demoService.add(data);
  }

  /**
   * 更新记录
   */
  async update(data = {}) {
    const { _id, ...updateData } = data;
    if (!_id) return { errCode: 'PARAM_ERROR', errMsg: '缺少参数 _id' };
    return await demoService.update(_id, updateData);
  }

  /**
   * 删除记录
   */
  async remove(data = {}) {
    const { ids } = data;
    if (!ids || !ids.length) return { errCode: 'PARAM_ERROR', errMsg: '缺少参数 ids' };
    return await demoService.remove(ids);
  }
}

module.exports = new Demo();
