const { MessengerBot, FileSessionStore } = require('bottender');
const { createServer } = require('bottender/express');
const config = require('./bottender.config').messenger;
const { POSTBACK_TITLE, INPUT_TYPE } = require('./constant');

const bot = new MessengerBot({
  accessToken: config.accessToken,
  appSecret: config.appSecret,
  sessionStore: new FileSessionStore(),
});

bot.setInitialState({
  todos: [],
  isWaitingUserInput: false,
  userInput: null,
});

const listTodos = async (context) => {
  await context.sendGenericTemplate(
    context.state.todos.map(({ title, reminder }) => {
      return {
        title: title,
        subtitle: '',
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

const deleteTodo = async (context, targetTodo) => {
  context.setState({
    todos: context.state.todos.filter(({ title }) => title !== targetTodo),
  });
  await context.sendText(`Delete todo ${targetTodo}!`);
};

bot.onEvent(async (context) => {
  const user = await context.getUserProfile();
  console.log(user);
  if (context.state.isWaitingUserInput && context.event.isText) {
    switch (context.state.userInput.type) {
      case INPUT_TYPE.EDIT_TODO:
        break;
      case INPUT_TYPE.ADD_TODO:
        const todoTitle = context.event.text;
        context.setState({
          todos: context.state.todos.concat({ title: todoTitle }),
          isWaitingUserInput: false,
          userInput: null,
        });
        await context.sendText(`Add todo: ${todoTitle}`);
        break;
    }
  } else if (context.event.isPostback) {
    switch (context.event.postback.title) {
      case POSTBACK_TITLE.EDIT_TODO:
        context.setState({
          userInput: { type: INPUT_TYPE.EDIT_TODO, payload: context.event.postback.payload },
          isWaitingUserInput: true,
        });
        break;
      case POSTBACK_TITLE.ADD_TODO:
        context.setState({
          userInput: { type: INPUT_TYPE.ADD_TODO },
          isWaitingUserInput: true,
        });
        await context.sendText(`Enter a title for this todo:`);
        break;
      case POSTBACK_TITLE.DELETE_TODO:
        const targetTodo = context.event.postback.payload;
        await deleteTodo(context, targetTodo);
        break;
      case POSTBACK_TITLE.LIST_TODO:
        await listTodos(context);
        break;
      default:
        await context.sendText(`Hello :)`);
        break;
    }
  } else {
    await context.sendText(`Hello :)`);
  }
});

const server = createServer(bot, { verifyToken: config.verifyToken });

server.listen(config.port, () => {
  console.log(`server is running on ${config.port} port`);
});
