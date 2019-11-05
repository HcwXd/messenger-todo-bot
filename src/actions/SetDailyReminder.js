const moment = require('moment');
const { isCorrectTimeFormat, constructDailyReminderKey } = require('../utils/utils');
const { INPUT_TYPE, REDIS_KEY, SERVER_TIMEZONE_OFFSET } = require('../utils/constant');
const sendWrongFormat = require('./SendWrongFormat');
const { redisClient } = require('../services/redis');

module.exports = async function SetDailyReminder(context, dailyReminder) {
  if (isCorrectTimeFormat(dailyReminder)) {
    context.setState({
      prefs: { ...context.state.prefs, dailyReminder },
    });
    const [hour, minute] = dailyReminder.split(':').map(n => +n);
    let timeStamp = moment()
      .startOf('day')
      .add(hour - context.state.prefs.timezone - SERVER_TIMEZONE_OFFSET, 'hours')
      .add(minute, 'minutes');

    if (timeStamp < moment()) {
      timeStamp = moment()
        .startOf('day')
        .add(1, 'days')
        .add(hour - context.state.prefs.timezone - SERVER_TIMEZONE_OFFSET, 'hours')
        .add(minute, 'minutes');
    }

    console.log(timeStamp.valueOf());

    redisClient.zadd(
      REDIS_KEY.DAILY_QUEUE,
      Math.floor(timeStamp.getTime() / 1000),
      constructDailyReminderKey(context.user)
    );
    await context.sendText(`Set daily reminder: ${dailyReminder}`);
  } else {
    await sendWrongFormat(context, dailyReminder, INPUT_TYPE.SET_DAILY_REMINDER);
  }
};
