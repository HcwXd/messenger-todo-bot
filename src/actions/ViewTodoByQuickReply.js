const { constructTodoSubtitle } = require('../utils/utils');

module.exports = async function ViewTodoByQuickReply(context, todoTitle) {
  const { title, reminder, note } = context.state.todos.find(({ title }) => title === todoTitle);
  await context.sendText(
    `# ${title}\n${constructTodoSubtitle({ reminder, note }, context.state.prefs.timezone)}`
  );
};
