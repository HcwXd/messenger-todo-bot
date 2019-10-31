const sendQuickReplyAfterAddingTodo = require('./SendQuickReplyAfterAddingTodo');

module.exports = async function AddTodoByDialogue(context, todoTitle) {
  if (context.state.todos.findIndex(({ title }) => title === todoTitle) !== -1) {
    await context.sendText(`Todo ${todoTitle} already exists`);
  } else {
    context.setState({
      todos: context.state.todos.concat({ title: todoTitle }),
    });
    await context.sendText(
      `Add todo: ${todoTitle}..\n\nTo add a todo faster, you can simply enter "/a something todo".\nFor example:\n/a ${todoTitle}`
    );
    await sendQuickReplyAfterAddingTodo(context, todoTitle);
  }
};
