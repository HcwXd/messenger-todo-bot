const { constructTodoSubtitle } = require('../utils/utils');
const { POSTBACK_TITLE } = require('../utils/constant');

module.exports = async function listSingleTodo(context, targetTodo) {
  const { title, reminder, dueDate, note } = context.state.todos.find(
    ({ title }) => title === targetTodo
  );
  await context.sendGenericTemplate(
    [
      {
        title: title,
        subtitle: constructTodoSubtitle({ reminder, dueDate, note }, context.state.prefs.timezone),
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