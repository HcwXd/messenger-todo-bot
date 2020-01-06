const { POSTBACK_TITLE } = require('../utils/constant');
const { constructTodoSubtitle } = require('../utils/utils');

module.exports = async function ListTodoWithButton(context) {
  if (context.state.todos.length === 0) {
    await context.sendText(`There's no todo in your list :-p`);
    return;
  }
  await context.sendGenericTemplate(
    context.state.todos.map(({ title, reminder, note }) => {
      return {
        title: title,
        subtitle: constructTodoSubtitle({ reminder, note }, context.state.prefs.timezone),
        buttons: [
          {
            type: 'postback',
            title: POSTBACK_TITLE.EDIT_TODO,
            payload: title,
          },
          {
            type: 'postback',
            title: POSTBACK_TITLE.DELETE_TODO,
            payload: title,
          },
        ],
      };
    }),
    { image_aspect_ratio: 'square' }
  );
};
