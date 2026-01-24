/**
 * Demo 示例 - 模块控制器层
 */
const service = require('../../service');
const libs = require('../../libs');
const fail = libs.response.fail;

module.exports = {
  // 函数执行前钩子
  async _before() {
    await this.middleware.auth();
  },
  // 查列表
  async getList(data = {}) {
    return await service.demo.getList(data);
  },
  // 查详情
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail('缺少参数 _id');
    return await service.demo.getById(_id);
  },
  // 添加
  async add(data = {}) {
    const { name } = data;
    if (!name) return fail('姓名不能为空');
    return await service.demo.add(data);
  },
  // 修改
  async update(data = {}) {
    const { _id, ...updateData } = data;
    if (!_id) return fail('缺少参数 _id');
    return await service.demo.update(_id, updateData);
  },
  // 删除
  async remove(data = {}) {
    const { ids } = data;
    if (!ids || !ids.length) return fail('缺少参数 ids');
    return await service.demo.remove(ids);
  }
}
