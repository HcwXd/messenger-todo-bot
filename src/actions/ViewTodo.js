const { QUICK_REPLY } = require('../utils/constant');

module.exports = async function ViewTodo(context) {
  await context.sendText(`Todo "${context.event.text}" exists, you want to:`, {
    quick_replies: [
      {
        content_type: 'text',
        title: `View todo`,
        payload: `${QUICK_REPLY.VIEW_TODO}/${context.event.text}`,
      },
      {
        content_type: 'text',
        title: `Edit todo`,
        payload: `${QUICK_REPLY.EDIT_TODO}/${context.event.text}`,
      },
      {
        content_type: 'text',
        title: `Delete todo`,
        payload: `${QUICK_REPLY.DELETE_TODO}/${context.event.text}`,
      },
      {
        content_type: 'text',
        title: `Nothing`,
        payload: QUICK_REPLY.NOTHING,
      },
    ],
  });
};
