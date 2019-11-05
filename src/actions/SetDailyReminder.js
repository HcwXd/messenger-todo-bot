const { isCorrectTimeFormat } = require('../utils/utils');
const { INPUT_TYPE } = require('../utils/constant');
const sendWrongFormat = require('./SendWrongFormat');

module.exports = async function SetDailyReminder(context, dailyReminder) {
  if (isCorrectTimeFormat(dailyReminder)) {
    context.setState({
      prefs: { ...context.state.prefs, dailyReminder },
    });
    await context.sendText(`Set daily reminder: ${dailyReminder}`);
  } else {
    await sendWrongFormat(context, dailyReminder, INPUT_TYPE.SET_DAILY_REMINDER);
  }
};
