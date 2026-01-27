/**
 * Demo 示例 - 模块控制器层（客户端API）
 * @description 客户端API，所有操作都只能操作当前登录用户自己的数据
 */
const service = require('../../service');
const { fail } = require('../../libs/response');

module.exports = {
  // 函数执行前钩子
  async _before() {
    const methodName = this.getMethodName();
    // 定义不需要登录的函数名
    const noAuthFunctionNames = ["test"];
    const requireAuth = !noAuthFunctionNames.includes(methodName);
    await this.middleware.auth(requireAuth);
  },

  // 查列表
  async getList(data = {}) {
    return await service.demo.getList({
      ...data,
      user_id: this.getUserId() // 只能查询当前用户的
    });
  },

  // 查详情
  async getById(data = {}) {
    const { _id } = data;
    if (!_id) return fail(400001, { name: '_id' });

    const info = await service.demo.getByWhere({
      _id,
      user_id: this.getUserId()
    });
    if (!info) {
      return fail(404001, { name: '记录' });
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
      parame2,
      user_id: this.getUserId(),
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

    // 使用where条件直接更新，确保只能更新自己的记录
    const where = {
      _id,
      user_id: this.getUserId()
    }
    const result = await service.demo.update(where, {
      parame1,
      parame2
    });

    // 如果更新数量为0，说明记录不存在或不属于当前用户
    if (result.updated === 0) {
      return fail(404001, { name: '记录' });
    }

    return result;
  },

  // 删除
  async remove(data = {}) {
    const { id, ids } = data;
    const where = {
      user_id: this.getUserId()
    };
    if (ids && Array.isArray(ids) && ids.length > 0) {
      where._id = {
        $in: ids
      };
    } else if (id) {
      where._id = id;
    } else {
      return fail(400001, { name: 'id' });
    }
    return await service.demo.remove(where);
  }
}
