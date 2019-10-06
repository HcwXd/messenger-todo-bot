require('dotenv').config();
const { ADD_TODO, LIST_TODO, DELETE_TODO } = require('./constant');

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
              title: 'Add Todo',
              payload: ADD_TODO,
            },
            {
              type: 'postback',
              title: 'List Todo',
              payload: LIST_TODO,
            },
            {
              type: 'postback',
              title: 'Delete Todo',
              payload: DELETE_TODO,
            },
          ],
        },
      ],
    },
  },
};
