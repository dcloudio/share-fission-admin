/**
 * 用户表 (uni-id-users) - 服务实现层
 */
const db = uniCloud.database();
const _ = db.command;

const collection = db.collection("uni-id-users");

module.exports = {
  /**
   * 分页查询列表
   */
  async getList(data = {}) {
    let { pageIndex = 1, pageSize = 20, keyword = '' } = data;

    let where = {};
    // 关键词搜索
    if (keyword) {
      where = _.or([
        { username: new RegExp(keyword, 'i') },
        { nickname: new RegExp(keyword, 'i') },
        { mobile: new RegExp(keyword, 'i') }
      ]);
    }

    const skip = (pageIndex - 1) * pageSize;
    let { data: list } = await collection
      .where(where)
      .field({
        _id: true,
        username: true,
        nickname: true,
        avatar: true,
        mobile: true,
        mobile_confirmed: true,
        email: true,
        email_confirmed: true,
        status: true,
        register_date: true,
        last_login_date: true
      })
      .orderBy('register_date', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();
    let { total } = await collection.where(where).count();

    return { list, total };
  },

  /**
   * 获取单条记录
   */
  async getById(_id) {
    const { data: [info] } = await collection
      .doc(_id)
      .field({
        _id: true,
        username: true,
        nickname: true,
        avatar: true,
        mobile: true,
        mobile_confirmed: true,
        email: true,
        email_confirmed: true,
        status: true,
        register_date: true,
        last_login_date: true
      })
      .get();
    return info;
  },

  /**
   * 新增记录
   */
  async add(data = {}) {
    const { _id, register_date, ...record } = data;
    record.register_date = Date.now();
    record.status = record.status ?? 0;
    const { id } = await collection.add(record);
    return { id };
  },

  /**
   * 更新记录
   */
  async update(_id, data = {}) {
    // 排除不允许更新的字段
    const { _id: __, username, register_date, password, ...rest } = data;
    const { updated } = await collection.doc(_id).update(rest);
    return { updated };
  },

  /**
   * 删除记录（支持批量）
   */
  async remove(ids) {
    if (!Array.isArray(ids)) ids = [ids];
    const { deleted } = await collection.where({ _id: _.in(ids) }).remove();
    return { deleted };
  }
};
