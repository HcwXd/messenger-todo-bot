const { QUICK_REPLY } = require('../utils/constant');

module.exports = async function SendQuickReplyAfterAddingTodo(context, todoTitle) {
  context.sendText(
    `You can add due date and reminder of the todo by clicking the edit button.\nOr ignore the button and add those later.`,
    {
      quick_replies: [
        {
          content_type: 'text',
          title: `Edit`,
          payload: `${QUICK_REPLY.EDIT_TODO}/${todoTitle}`,
        },
      ],
    }
  );
};
