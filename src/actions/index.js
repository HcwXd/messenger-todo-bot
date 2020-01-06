/* eslint-disable no-case-declarations */
const { router, text, payload, route } = require('bottender/router');
const GetStarted = require('./GetStarted');
const TextRouter = require('./text');
const DialogueRouter = require('./dialogue');
const QuickReplyRouter = require('./quickReply');
const PostbackRouter = require('./postback');

module.exports = async function App(context) {
  return router([
    payload('GET_STARTED', GetStarted),
    route(context => context.event.isPostback, PostbackRouter),
    route(context => context.event.isQuickReply, QuickReplyRouter),
    route(context => context.state.isWaitingUserInput, DialogueRouter),
    route(context => context.event.isText, TextRouter),
    text('*', async () => {
      await context.sendText(`Hello :)`);
    }),
  ]);
};
