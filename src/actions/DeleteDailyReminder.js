const { redisClient } = require('../services/redis');
const { REDIS_KEY } = require('../utils/constant');
const { constructDailyReminderKey } = require('../utils/utils');

module.exports = async function DeleteDailyReminder(context) {
  context.setState({
    prefs: { ...context.state.prefs, dailyReminder: null },
  });
  await redisClient.zrem(REDIS_KEY.DAILY_QUEUE, constructDailyReminderKey(context.user.id));
  await context.sendText(`Your daily reminder has been deleted`);
};
