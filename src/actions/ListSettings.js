const { POSTBACK_TITLE } = require('../utils/constant');

module.exports = async function ListSettings(context) {
  await context.sendGenericTemplate(
    [
      {
        title: 'Daily Reminder',
        subtitle: context.state.prefs.dailyReminder
          ? `Your daily reminder now set at ${context.state.prefs.dailyReminder}.`
          : `You don't have daily reminder yet.`,
        buttons: context.state.prefs.dailyReminder
          ? [
              {
                type: 'postback',
                title: POSTBACK_TITLE.SET_DAILY_REMINDER,
                payload: POSTBACK_TITLE.SET_DAILY_REMINDER,
              },
              {
                type: 'postback',
                title: POSTBACK_TITLE.DELETE_DAILY_REMINDER,
                payload: POSTBACK_TITLE.DELETE_DAILY_REMINDER,
              },
            ]
          : [
              {
                type: 'postback',
                title: POSTBACK_TITLE.SET_DAILY_REMINDER,
                payload: POSTBACK_TITLE.SET_DAILY_REMINDER,
              },
            ],
      },
      {
        title: 'Set Timezone',
        subtitle: context.state.prefs.timezone
          ? `Your timezone now set at ${context.state.prefs.timezone}.`
          : `You haven't set your timezone yet.`,
        buttons: [
          {
            type: 'postback',
            title: POSTBACK_TITLE.SET_TIME_ZONE,
            payload: POSTBACK_TITLE.SET_TIME_ZONE,
          },
        ],
      },
    ],

    { image_aspect_ratio: 'square' }
  );
};
