require('dotenv').config();
const { POSTBACK_TITLE } = require('./constant');

module.exports = {
  messenger: {
    accessToken: process.env.MESSENGER_ACCESS_TOKEN,
    verifyToken: process.env.MESSENGER_VERIFY_TOKEN,
    appId: process.env.MESSENGER_APP_ID,
    appSecret: process.env.MESSENGER_APP_SECRET,
    port: process.env.PORT,
    profile: {
      get_started: {
        payload: 'GET_STARTED',
      },
      greeting: [
        {
          locale: 'default',
          text: 'Welcome to use TODO BOT',
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
};
