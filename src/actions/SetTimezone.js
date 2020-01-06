const { INPUT_TYPE } = require('../utils/constant');
const sendWrongFormat = require('./SendWrongFormat');

module.exports = async function SetDailyReminder(context, timezone) {
  if (-12 <= timezone <= 14) {
    context.setState({
      prefs: { ...context.state.prefs, timezone },
    });
    await context.sendText(`Set your timezone: ${timezone}`);
    if (context.state.isInitialSetUp) {
      await context.sendText(`Now you can add your first todo by entering "/a myFirstTodo"`);
      context.setState({
        isInitialSetUp: false,
      });
    }
  } else {
    await sendWrongFormat(context, timezone, INPUT_TYPE.SET_TIME_ZONE);
  }
};
