const { POSTBACK_TITLE } = require('./src/constant');
const { helpText } = require('./src/wording');

module.exports = {
  session: {
    driver: 'file',
    stores: {
      memory: {
        maxSize: 500,
      },
      file: {
        dirname: '.session',
      },
      redis: {
        port: 6379,
        host: '127.0.0.1',
        password: 'auth',
        db: 0,
      },
      mongo: {
        url: 'mongodb://localhost:27017',
        collectionName: 'sessions',
      },
    },
  },
  initialState: {
    todos: [],
    isWaitingUserInput: false,
    userInput: null,
    prefs: { dailyReminder: null },
  },
  channels: {
    messenger: {
      enabled: true,
      path: '/webhooks/messenger',
      pageId: process.env.MESSENGER_PAGE_ID,
      accessToken: process.env.MESSENGER_ACCESS_TOKEN,
      appId: process.env.MESSENGER_APP_ID,
      appSecret: process.env.MESSENGER_APP_SECRET,
      verifyToken: process.env.MESSENGER_VERIFY_TOKEN,
      profile: {
        get_started: {
          payload: 'GET_STARTED',
        },
        greeting: [
          {
            locale: 'default',
            text: helpText,
          },
        ],
        persistent_menu: [
          {
            locale: 'default',
            composer_input_disabled: false,
            call_to_actions: [
              {
                type: 'postback',
                title: POSTBACK_TITLE.ADD_TODO,
                payload: POSTBACK_TITLE.ADD_TODO,
              },
              {
                type: 'postback',
                title: POSTBACK_TITLE.LIST_TODO,
                payload: POSTBACK_TITLE.LIST_TODO,
              },
              {
                type: 'postback',
                title: POSTBACK_TITLE.SETTINGS,
                payload: POSTBACK_TITLE.SETTINGS,
              },
            ],
          },
        ],
      },
    },
    line: {
      enabled: false,
      path: '/webhooks/line',
      accessToken: process.env.LINE_ACCESS_TOKEN,
      channelSecret: process.env.LINE_CHANNEL_SECRET,
    },
    telegram: {
      enabled: false,
      path: '/webhooks/telegram',
      accessToken: process.env.TELEGRAM_ACCESS_TOKEN,
    },
    slack: {
      enabled: false,
      path: '/webhooks/slack',
      accessToken: process.env.SLACK_ACCESS_TOKEN,
      verificationToken: process.env.SLACK_VERIFICATION_TOKEN,
    },
    viber: {
      enabled: false,
      path: '/webhooks/viber',
      accessToken: process.env.VIBER_ACCESS_TOKEN,
      sender: {
        name: 'xxxx',
      },
    },
  },
};
