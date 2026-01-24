module.exports = async function(params = {}) {
  const {
    name,
    data
  } = params;
  if (!name) {
    return { errCode: "param-required", errMsgValue: { param: "name" } }
  }
  const [group, moduleName, method] = name.split("/");
  if (!group || !moduleName || !method) {
    return { errCode: "invalid-param-name", errMsgValue: { param: name } }
  }
  let action;
  try {
    action = require(`./module/${group}/${moduleName}`);
  } catch (err) {
    console.error(`加载${group}/${moduleName}模块失败: `, err)
    return { errCode: "invalid-module", errMsgValue: { moduleName } }
  }
  const main = action[method];
  if (!main || typeof main !== "function") {
    return { errCode: "invalid-module-method", errMsgValue: { moduleName, method } }
  }
  let res;
  try {
    if (typeof action._before === "function") {
      await action._before.call(this, data);
    }
    res = await main.call(this, data);
    if (typeof action._after === "function") {
      let newRes = await action._after.call(this, null, res);
      if (newRes) res = newRes;
    }
  } catch (err) {
    if (typeof action._after === "function") {
      let newRes = await action._after.call(this, err, res);
      if (newRes) {
        res = newRes;
      } else {
        throw err;
      }
    }
  }
  return res;
}
