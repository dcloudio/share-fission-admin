/**
 * Demo 示例 - 模块控制器层
 */
const service = require('../../service');
const { fail } = require('../../libs/response');

module.exports = {
  // 函数执行前钩子
  async _before() {
    // 如果下面所有的函数都需要登录才能操作，则打开此处注释
    await this.middleware.auth();
  },
  // 查列表
  async getList(data = {}) {
    data.user_id = this.getUserId(); // 只能查询当前用户的订单
    return await service.demo.getList(data);
  },
  // 查详情
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });
    const info = await service.demo.getById(_id);
    if (info.user_id !== this.getUserId()) {
      return fail(404001, { name: 'xxx' });
    }
    return info;
  },
  // 添加
  async add(data = {}) {
    // client端必须使用解构赋值的方式提取能被用户添加的字段
    const {
      parame1,
      parame2
    } = data;
    if (!parame1) return fail(400001, { name: 'parame1' });
    if (!parame2) return fail(400001, { name: 'parame2' });
    // 字段其他格式检测条件
    // ...
    return await service.demo.add({
      parame1,
      parame2
    });
  },
  // 修改
  async update(data = {}) {
    // client端必须使用解构赋值的方式提取能被用户修改的字段
    const {
      _id,
      parame1,
      parame2
    } = data;
    if (!_id) return fail(400001, { name: '_id' });
    if (!parame1) return fail(400001, { name: 'parame1' });
    if (!parame2) return fail(400001, { name: 'parame2' });
    // 字段其他格式检测条件
    // ...
    // 判断权限
    const info = await service.demo.getById(_id);
    if (info.user_id !== this.getUserId()) {
      return fail(404001, { name: 'xxx' });
    }
    return await service.demo.update(_id, {
      parame1,
      parame2
    });
  },
  // 删除
  async remove(data = {}) {
    const { ids } = data;
    if (!ids || !ids.length) return fail(400001, { name: 'ids' });
    return await service.demo.remove({
      _id: _.in(ids),
      user_id: this.getUserId()
    });
  }
}
