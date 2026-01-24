module.exports = async function(params = {}) {
	const {
		name, // 定时任务名称
		...data
	} = params;
	if (!name) {
		return { errCode: "param-required", errMsgValue: { param: "name" } }
	}
	let main;
	try {
		main = require(`./crontab/${name}`);
	} catch (err) {
		console.error(`加载定时任务${name}失败: `, err)
		return { errCode: "invalid-module", errMsgValue: { name } }
	}

	res = await main.call(this, data);

	return res;
}
