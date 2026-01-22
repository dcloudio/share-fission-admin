/**
 * Demo 员工表 - 模块控制器层
 */
const demoService = require('../service/demo');

const fail = (errMsg, errCode = 'PARAM_ERROR') => ({ errCode, errMsg });

class Demo {
  async getList(data = {}) {
    return await demoService.getList(data);
  }

  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail('缺少参数 _id');
    return await demoService.getById(_id);
  }

  async add(data = {}) {
    const { name } = data;
    if (!name) return fail('姓名不能为空');
    return await demoService.add(data);
  }

  async update(data = {}) {
    const { _id, ...updateData } = data;
    if (!_id) return fail('缺少参数 _id');
    return await demoService.update(_id, updateData);
  }

  async remove(data = {}) {
    const { ids } = data;
    if (!ids || !ids.length) return fail('缺少参数 ids');
    return await demoService.remove(ids);
  }
}

module.exports = new Demo();
