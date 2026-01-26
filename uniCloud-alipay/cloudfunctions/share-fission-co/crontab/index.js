const demo = require('./demo');

const smsServerCrontabs = {
  demo,
}

module.exports = async function runCrontab(event) {
  const { TriggerName } = event;
  console.log('event------', event);
  this.source = 'crontab';
  if (smsServerCrontabs[TriggerName]) {
    console.log('--trigger', TriggerName);
    await smsServerCrontabs[TriggerName].bind(this)({});
  }
}
