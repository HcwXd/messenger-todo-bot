const { QUICK_REPLY } = require('../utils/constant');

module.exports = async function SendQuickReplyAfterNewTodoInput(context) {
  await context.sendText('Pick an action', {
    quick_replies: [
      {
        content_type: 'text',
        title: `Add as todo`,
        payload: `${QUICK_REPLY.ADD_TODO}/${context.event.text}`,
      },
      {
        content_type: 'text',
        title: `Nothing`,
        payload: QUICK_REPLY.NOTHING,
      },
    ],
  });
};
