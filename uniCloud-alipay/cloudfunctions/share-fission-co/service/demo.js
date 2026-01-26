/**
 * Demo 示例表 - 服务实现层
 * @module service/demo
 * @description 员工管理示例模块，提供员工信息的增删改查功能，用于演示标准 CRUD 操作
 */
const db = uniCloud.database();
const _ = db.command;
const $ = _.aggregate;

const { Tables } = require('../constants');
const libs = require('../libs');
const collection = db.collection(Tables.demoEmployee);

/**
 * @typedef {Object} Employee
 * @property {string} [_id] - 员工记录ID
 * @property {string} name - 姓名
 * @property {number} [age] - 年龄
 * @property {string} [department] - 部门
 * @property {string} [city] - 城市
 * @property {string} [email] - 邮箱
 * @property {string} [phone] - 电话
 * @property {string} [address] - 地址
 * @property {number} [salary] - 薪资
 * @property {string} [joinDate] - 入职日期
 * @property {string} [status] - 状态
 * @property {number} [create_time] - 创建时间戳（毫秒）
 * @property {number} [update_time] - 更新时间戳（毫秒）
 */

/**
 * @typedef {Object} ListQueryParams
 * @property {number} [pageIndex=1] - 页码，从1开始
 * @property {number} [pageSize=20] - 每页条数
 * @property {string} [keyword=''] - 搜索关键词，支持按姓名、部门搜索
 * @property {string} [sortField=''] - 排序字段
 * @property {string} [sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
 */

/**
 * @typedef {Object} ListResult
 * @property {Employee[]} list - 员工列表
 * @property {number} total - 总记录数
 */

module.exports = {
  /**
   * 分页查询员工列表
   * @async
   * @function getList
   * @description 支持关键词搜索（姓名、部门）、自定义排序和分页。默认按创建时间倒序排列
   * @param {ListQueryParams} [data={}] - 查询参数对象
   * @param {string} [data.user_id=''] - 用户id
   * @param {number} [data.pageIndex=1] - 页码，从1开始
   * @param {number} [data.pageSize=20] - 每页条数
   * @param {string} [data.keyword=''] - 搜索关键词，支持按姓名、部门模糊搜索
   * @param {string} [data.sortField=''] - 排序字段，为空时默认按 create_time 倒序
   * @param {string} [data.sortOrder='desc'] - 排序方向，'asc' 升序 | 'desc' 降序
   * @returns {Promise<ListResult>} 返回列表数据和总数
   * @example
   * const result = await demoService.getList({
   *   pageIndex: 1,
   *   pageSize: 10,
   *   keyword: '张三'
   * });
   * console.log(result.list); // 员工列表
   * console.log(result.total); // 总数
   */
  async getList(data = {}) {
    let { user_id, pageIndex = 1, pageSize = 20, keyword = '', sortField = '', sortOrder = 'desc' } = data;

    let where = {};

    if (user_id) {
      where.user_id = user_id;
    }

    // 关键词搜索
    if (keyword) {
      if (libs.common.isObjectId(keyword)) {
        where = _.or([
          { name: keyword },
          { department: keyword }
        ]);
      } else {
        where = _.or([
          { name: new RegExp(keyword, 'i') },
          { department: new RegExp(keyword, 'i') }
        ]);
      }
    }

    const skip = (pageIndex - 1) * pageSize;

    // 构建查询
    let query = collection.where(where);

    // 处理排序
    if (sortField && sortOrder) {
      query = query.orderBy(sortField, sortOrder);
    } else {
      // 默认按创建时间倒序
      query = query.orderBy('create_time', 'desc');
    }

    if (sortField !== "_id") {
      query = query.orderBy("_id", sortOrder);
    }

    let { data: list } = await query.skip(skip).limit(pageSize).get();
    let { total } = await collection.where(where).count();

    return { list, total };
  },

  /**
   * 根据ID获取单条员工记录
   * @async
   * @function getById
   * @param {string} _id - 员工记录ID
   * @returns {Promise<Employee|undefined>} 员工详情，如果不存在则返回 undefined
   * @example
   * const employee = await demoService.getById('xxx');
   * if (employee) {
   *   console.log(employee.name);
   * }
   */
  async getById(_id) {
    const { data: [info] } = await collection.doc(_id).get();
    return info;
  },

  /**
   * 新增员工记录
   * @async
   * @function add
   * @description 创建新员工记录，会自动添加 create_time 字段
   * @param {Employee} [data={}] - 员工数据对象
   * @param {string} data.name - 姓名（必填）
   * @param {number} [data.age] - 年龄
   * @param {string} [data.department] - 部门
   * @param {string} [data.city] - 城市
   * @param {string} [data.email] - 邮箱
   * @param {string} [data.phone] - 电话
   * @param {string} [data.address] - 地址
   * @param {number} [data.salary] - 薪资
   * @param {string} [data.joinDate] - 入职日期
   * @param {string} [data.status] - 状态
   * @returns {Promise<{id: string}>} 包含新增记录ID的对象
   * @example
   * const result = await demoService.add({
   *   name: '张三',
   *   department: '技术部',
   *   salary: 10000
   * });
   * console.log(result.id); // 新记录ID
   */
  async add(data = {}) {
    const { _id, create_time, update_time, ...record } = data;
    record.create_time = Date.now();
    const { id } = await collection.add(record);
    return { id };
  },

  /**
   * 更新员工记录
   * @async
   * @function update
   * @description 根据ID更新员工信息，会自动添加 update_time 字段
   * @param {string} _id - 员工记录ID
   * @param {Partial<Employee>} [data={}] - 要更新的数据，会自动过滤 _id 和 create_time 字段
   * @param {string} [data.name] - 姓名
   * @param {number} [data.age] - 年龄
   * @param {string} [data.department] - 部门
   * @param {string} [data.city] - 城市
   * @param {string} [data.email] - 邮箱
   * @param {string} [data.phone] - 电话
   * @param {string} [data.address] - 地址
   * @param {number} [data.salary] - 薪资
   * @param {string} [data.joinDate] - 入职日期
   * @param {string} [data.status] - 状态
   * @returns {Promise<{updated: number}>} 更新的记录数（0或1）
   * @example
   * const result = await demoService.update('xxx', {
   *   salary: 12000,
   *   department: '产品部'
   * });
   */
  async update(_id, data = {}) {
    const { _id: __, create_time, ...rest } = data;
    const updateData = {
      ...rest,
      update_time: Date.now()
    };
    const { updated } = await collection.doc(_id).update(updateData);
    return { updated };
  },

  /**
   * 删除员工记录（支持多种参数形式）
   * @async
   * @function remove
   * @description 支持三种删除方式：单个ID、ID数组批量删除、自定义where条件删除
   * @param {string|string[]|Object} data - 删除条件
   *   - string: 单个记录ID，删除该条记录
   *   - string[]: ID数组，批量删除多条记录
   *   - Object: 完整的where条件对象
   * @returns {Promise<{deleted: number}>} 删除的记录数
   * @example
   * // 根据ID删除单条记录
   * await demoService.remove('xxx');
   *
   * // 根据ID数组批量删除
   * await demoService.remove(['id1', 'id2', 'id3']);
   *
   * // 根据自定义条件删除
   * await demoService.remove({ status: 'inactive' });
   */
  async remove(data) {
    let condition;
    if (typeof data === 'string') {
      condition = { _id: data };
    } else if (Array.isArray(data)) {
      condition = { _id: _.in(data) };
    } else {
      condition = data;
    }
    const { deleted } = await collection.where(condition).remove();
    return { deleted };
  }
};
