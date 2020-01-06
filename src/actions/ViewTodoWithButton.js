const { constructTodoSubtitle } = require('../utils/utils');
const { POSTBACK_TITLE } = require('../utils/constant');

module.exports = async function ViewTodoWithButton(context, targetTodo) {
  const { title, reminder, note } = context.state.todos.find(({ title }) => title === targetTodo);
  await context.sendGenericTemplate(
    [
      {
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
      },
    ],
    { image_aspect_ratio: 'square' }
  );
};
