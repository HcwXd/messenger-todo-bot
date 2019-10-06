const { MessengerBot, FileSessionStore } = require('bottender');
const { createServer } = require('bottender/express');
const config = require('./bottender.config').messenger;
const { ADD_TODO, LIST_TODO, DELETE_TODO } = require('./constant');

const bot = new MessengerBot({
  accessToken: config.accessToken,
  appSecret: config.appSecret,
  sessionStore: new FileSessionStore(),
});

bot.setInitialState({
  todos: [],
  isAsking: false,
  actionType: null,
});

const sendActionList = async (context) => {
  await context.sendText(`Okay`);
};

const sendDeleteTodoList = async (context) => {
  await context.sendButtonTemplate(
    'Please choose one to delete',
    context.state.todos.map((todo) => {
      return {
        type: 'postback',
        title: todo,
        payload: `delete/${todo}`,
      };
    })
  );
};

bot.onEvent(async (context) => {
  const user = await context.getUserProfile();
  console.log(user);
  if (context.state.isAsking) {
    if (context.state.actionType === DELETE_TODO && context.event.isPostback) {
      context.setState({
        todos: context.state.todos.filter((todo) => todo !== context.event.postback.title),
        actionType: null,
        isAsking: false,
      });
      await context.sendText(`Delete Todo ${context.event.postback.title}`);
    } else if (context.state.actionType === ADD_TODO) {
      context.setState({
        todos: context.state.todos.concat(context.event.text),
        actionType: null,
        isAsking: false,
      });
      await context.sendText(`Add Todo ${context.event.text}`);
    } else {
      context.setState({
        actionType: null,
        isAsking: false,
      });
    }
    await sendActionList(context);
  } else {
    if (context.event.isPostback) {
      switch (context.event.postback.payload) {
        case ADD_TODO:
          context.setState({ actionType: ADD_TODO, isAsking: true });
          await context.sendText(`Please enter your todo`);
          break;
        case LIST_TODO:
          const todoList = context.state.todos.map((todo) => `- ${todo}`).join('\n');
          await context.sendText(`Your Todo: \n${todoList}`);
          await sendActionList(context);
          break;
        case DELETE_TODO:
          context.setState({ actionType: DELETE_TODO, isAsking: true });
          await sendDeleteTodoList(context);
          break;
        default:
          break;
      }
    } else {
      await sendActionList(context);
    }
  }
});

const server = createServer(bot, { verifyToken: config.verifyToken });

server.listen(config.port, () => {
  console.log(`server is running on ${config.port} port`);
});
