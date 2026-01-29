const { fail } = require('./libs/response');

module.exports = async function() {
  try {
    // 在 uniCloud 云对象中，通过 this.getParams() 获取参数
    const params = this.getParams();
    const paramObj = params && params[0] ? params[0] : {};
    console.log('action 方法被调用，参数:', JSON.stringify(paramObj));
    const {
      name,
      data
    } = paramObj;
    if (!name) {
      console.error('缺少 name 参数，接收到的参数:', JSON.stringify(paramObj));
      return fail(400001, { name: 'name' })
    }
    const [group, moduleName, method] = name.split("/");
    if (!group || !moduleName || !method) {
      console.error('name 参数格式错误:', name);
      return fail(400002, { name: 'name' })
    }
    console.log(`解析路径: group=${group}, moduleName=${moduleName}, method=${method}`);
    let action;
    try {
      action = require(`./module/${group}/${moduleName}`);
      console.log(`成功加载模块: ${group}/${moduleName}`);
    } catch (err) {
      console.error(`加载${group}/${moduleName}模块失败: `, err);
      return fail(404001, { name: `模块${moduleName}` })
    }
    const main = action[method];
    if (!main || typeof main !== "function") {
      console.error(`方法 ${moduleName}.${method} 不存在或不是函数`);
      return fail(404001, { name: `方法${moduleName}.${method}` })
    }
    let res;
    try {
      if (typeof action._before === "function") {
        console.log(`执行 _before 钩子`);
        await action._before.call(this, data);
      }
      console.log(`执行方法 ${moduleName}.${method}`);
      res = await main.call(this, data);
      console.log(`方法执行成功，返回结果:`, JSON.stringify(res).substring(0, 200));
      if (typeof action._after === "function") {
        let newRes = await action._after.call(this, null, res);
        if (newRes) res = newRes;
      }
    } catch (err) {
      console.error(`执行方法 ${moduleName}.${method} 时出错:`, err);
      console.error('错误堆栈:', err.stack);
      if (typeof action._after === "function") {
        let newRes = await action._after.call(this, err, res);
        if (newRes) {
          res = newRes;
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }
    return res;
  } catch (err) {
    console.error('action 方法执行出错:', err);
    console.error('错误堆栈:', err.stack);
    throw err;
  }
}
