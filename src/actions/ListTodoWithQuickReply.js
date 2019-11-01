const { constructShortCutTodoList } = require('../utils/utils');
const { QUICK_REPLY } = require('../utils/constant');

module.exports = async function ListTodoWithQuickReply(context) {
  if (context.state.todos.length === 0) {
    await context.sendText(`There's no todo in your list :-p`);
    return;
  }
  context.sendText(
    `Your Todo:\n${constructShortCutTodoList(
      context.state.todos
    )}\n\nChoose the index of the todo you want to view or edit:`,
    {
      quick_replies: context.state.todos.map(({ title }, idx) => {
        return {
          content_type: 'text',
          title: `${idx + 1}`,
          payload: `${QUICK_REPLY.CHOOSE_TODO}/${title}`,
        };
      }),
    }
  );
};
