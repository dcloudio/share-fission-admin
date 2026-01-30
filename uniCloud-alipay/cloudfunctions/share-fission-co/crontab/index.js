const calcPointRatioDaily = require('./calcPointRatioDaily');

const smsServerCrontabs = {
  calcPointRatioDaily
}

module.exports = async function runCrontab(event) {
  console.log('event------', event);
  const name = event.triggerName || event.TriggerName || event.name;
  if (smsServerCrontabs[name]) {
    console.log('--trigger', name);
    await smsServerCrontabs[name].bind(this)({});
  }
}
