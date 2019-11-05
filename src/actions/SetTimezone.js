const { INPUT_TYPE } = require('../utils/constant');
const sendWrongFormat = require('./SendWrongFormat');

module.exports = async function SetDailyReminder(context, timezone) {
  if (-12 <= timezone <= 14) {
    context.setState({
      prefs: { ...context.state.prefs, timezone },
    });
    await context.sendText(`Set your timezone: ${timezone}`);
  } else {
    await sendWrongFormat(context, timezone, INPUT_TYPE.SET_TIME_ZONE);
  }
};
