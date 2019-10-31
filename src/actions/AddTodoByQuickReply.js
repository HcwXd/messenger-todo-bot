const sendQuickReplyAfterAddingTodo = require('./SendQuickReplyAfterAddingTodo');

module.exports = async function AddTodoByQuickReply(context, todoTitle) {
  if (context.state.todos.findIndex(({ title }) => title === todoTitle) !== -1) {
    context.setState({
      isWaitingUserInput: false,
      userInput: null,
    });
    await context.sendText(`Todo ${todoTitle} already exists`);
  } else if (context.state.todos.length >= 10) {
    await context.sendText(`Sorry. You can only have 10 todos in your list.`);
  } else {
    context.setState({
      todos: context.state.todos.concat({ title: todoTitle }),
      isWaitingUserInput: false,
      userInput: null,
    });
    await context.sendText(
      `Add todo: ${todoTitle}!\n\nTo add a todo faster, you can simply enter "/a something todo".\nFor example:\n/a ${todoTitle}`
    );
    await sendQuickReplyAfterAddingTodo(context, todoTitle);
  }
};
