const { constructTodoSubtitle } = require('../utils/utils');

module.exports = async function ViewTodoByQuickReply(context, todoTitle) {
  const { title, reminder, dueDate, note } = context.state.todos.find(
    ({ title }) => title === todoTitle
  );
  await context.sendText(
    `# ${title}\n${constructTodoSubtitle(
      { reminder, dueDate, note },
      context.state.prefs.timezone
    )}`
  );
};
