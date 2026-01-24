/**
 * 用户表 (uni-id-users) - 服务实现层
 */
const db = uniCloud.database();
const _ = db.command;

const collection = db.collection("uni-id-users");

module.exports = {
  /**
   * 分页查询列表
   * @param {Object} data
   * @param {number} data.pageIndex - 页码
   * @param {number} data.pageSize - 每页条数
   * @param {string} data.keyword - 搜索关键词
   * @param {string} data.sortField - 排序字段
   * @param {string} data.sortOrder - 排序方向 'asc' | 'desc'
   */
  async getList(data = {}) {
    let { pageIndex = 1, pageSize = 20, keyword = '', sortField = '', sortOrder = 'desc' } = data;

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

    // 构建查询
    let query = collection.where(where).field({
      token: false,
      password: false,
    });

    // 处理排序
    if (sortField && sortOrder) {
      query = query.orderBy(sortField, sortOrder);
    } else {
      // 默认按注册时间倒序
      query = query.orderBy('register_date', 'desc');
    }

    if (sortField !== "_id") {
      query = query.orderBy("_id", sortOrder);
    }

    let { data: list } = await query.skip(skip).limit(pageSize).get();
    let { total } = await collection.where(where).count();

    return { list, total };
  },

  /**
   * 获取单条记录
   * @param {string} _id - 用户 ID
   * @returns {Promise<Object|undefined>} 用户详情
   */
  async getById(_id) {
    const { data: [info] } = await collection
      .doc(_id)
      .field({
        token: false,
        password: false,
      })
      .get();
    return info;
  },

  /**
   * 新增记录
   * @param {Object} data - 用户数据
   * @param {string} data.username - 用户名
   * @param {string} [data.nickname] - 昵称
   * @param {string} [data.avatar] - 头像
   * @param {string} [data.mobile] - 手机号
   * @param {string} [data.email] - 邮箱
   * @param {number} [data.status=0] - 状态 (0:正常 1:禁用 2:审核中 3:审核拒绝)
   * @returns {Promise<{id: string}>} 新增用户的 ID
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
   * @param {string} _id - 用户 ID
   * @param {Object} data - 更新数据
   * @param {string} [data.nickname] - 昵称
   * @param {string} [data.avatar] - 头像
   * @param {string} [data.mobile] - 手机号 (会校验是否重复，更新后设置 mobile_confirmed=1，清空则删除该字段)
   * @param {string} [data.email] - 邮箱 (会校验是否重复，更新后设置 email_confirmed=1，清空则删除该字段)
   * @param {number} [data.status] - 状态 (0:正常 1:禁用 2:审核中 3:审核拒绝)
   * @returns {Promise<{updated: number}>} 更新的记录数
   * @throws {Error} 手机号已被其他用户使用
   * @throws {Error} 邮箱已被其他用户使用
   */
  async update(_id, data = {}) {
    // 排除不允许更新的字段
    const { _id: __, username, register_date, password, mobile, email, ...rest } = data;

    // 处理手机号
    if (mobile !== undefined) {
      if (mobile) {
        // 检查手机号是否与其他用户重复
        const { total } = await collection.where({
          _id: _.neq(_id),
          mobile: mobile
        }).count();
        if (total > 0) {
          throw new Error('该手机号已被其他用户使用');
        }
        // 手机号有值，设置 mobile_confirmed = 1
        rest.mobile = mobile;
        rest.mobile_confirmed = 1;
      } else {
        // 手机号清空，删除 mobile 和 mobile_confirmed 字段
        rest.mobile = _.remove();
        rest.mobile_confirmed = _.remove();
      }
    }

    // 处理邮箱
    if (email !== undefined) {
      if (email) {
        // 检查邮箱是否与其他用户重复
        const { total } = await collection.where({
          _id: _.neq(_id),
          email: email
        }).count();
        if (total > 0) {
          throw new Error('该邮箱已被其他用户使用');
        }
        // 邮箱有值，设置 email_confirmed = 1
        rest.email = email;
        rest.email_confirmed = 1;
      } else {
        // 邮箱清空，删除 email 和 email_confirmed 字段
        rest.email = _.remove();
        rest.email_confirmed = _.remove();
      }
    }

    const { updated } = await collection.doc(_id).update(rest);
    return { updated };
  },

  /**
   * 删除记录（支持批量）
   * @param {string|string[]} ids - 单个用户 ID 或 ID 数组
   * @returns {Promise<{deleted: number}>} 删除的记录数
   */
  async remove(ids) {
    if (!Array.isArray(ids)) ids = [ids];
    const { deleted } = await collection.where({ _id: _.in(ids) }).remove();
    return { deleted };
  }
};
