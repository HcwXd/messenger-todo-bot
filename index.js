const { MessengerBot, FileSessionStore } = require('bottender');
const { createServer } = require('bottender/express');
const config = require('./bottender.config').messenger;
const { POSTBACK_TITLE, INPUT_TYPE } = require('./constant');
const {
  dCopy,
  replaceArrayItemByIndex,
  getTimestampFromDueDate,
  getTimestampFromReminder,
  renderDueDate,
  renderReminder,
} = require('./utils');

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

const constructTodoSubtitle = ({ reminder, dueDate, note }) => {
  let subtitle = '';
  if (dueDate) subtitle += `Due ${renderDueDate(dueDate)}\n`;
  if (reminder) subtitle += `Remind me at ${renderReminder(reminder)}\n`;
  if (note) subtitle += `Note: ${note}`;
  return subtitle;
};

const listTodos = async (context) => {
  await context.sendGenericTemplate(
    context.state.todos.map(({ title, reminder, dueDate, note }) => {
      return {
        title: title,
        subtitle: constructTodoSubtitle({ reminder, dueDate, note }),
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
        const targetIdx = context.state.todos.findIndex(
          ({ title }) => title === context.state.userInput.payload
        );
        const editTodo = dCopy(context.state.todos[targetIdx]);
        const editData = context.event.text;
        const editArray = editData.split('\n');
        editArray.forEach(async (element) => {
          if (element[0] === 'R') {
            let setData = element.split(' ');
            if (setData.length !== 3) {
              await context.sendText(`Wrong format: ${element}`);
            } else {
              const timeStamp = getTimestampFromReminder(
                `${element.split(' ')[1]} ${element.split(' ')[2]}`
              );
              if (!timeStamp) {
                await context.sendText(`Wrong format: ${element}`);
              } else {
                editTodo.reminder = timeStamp;
              }
            }
          } else if (element[0] === 'D') {
            let setData = element.split(' ');
            if (setData.length !== 2) {
              await context.sendText(`Wrong format: ${element}`);
            } else {
              const timeStamp = getTimestampFromDueDate(element.split(' ')[1]);
              if (!timeStamp) {
                await context.sendText(`Wrong format: ${element}`);
              } else {
                editTodo.dueDate = timeStamp;
              }
            }
          } else if (element[0] === 'N') {
            editTodo.note = element.slice(2);
          }
        });
        await context.sendText(`Update ${context.state.userInput.payload}`);
        context.setState({
          todos: replaceArrayItemByIndex(context.state.todos, targetIdx, editTodo),
          isWaitingUserInput: false,
          userInput: null,
        });
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
        // TODO: Should use webview instead for more complicated flow
        context.setState({
          userInput: { type: INPUT_TYPE.EDIT_TODO, payload: context.event.postback.payload },
          isWaitingUserInput: true,
        });
        await context.sendText(
          `Please enter the todo info in the following format:\nD YYYY/MM/DD\nR YYYY/MM/DD/ HH:MM\nN Some notes here\n\nFor example:\nD 2020/02/01\nR 2020/01/01 13:00\nN Remember to call Jack first\n\nIf you only want to edit certain fields, you can just enter those (don't have to be in the same order as the example)\n\nFor example:\nR 2020/01/01 13:00\n\nFor more information, click Help in the menu!`
        );

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
      case POSTBACK_TITLE.LIST_TODO:
        await context.sendText(`Hello Setting is not implemented yet :(`);
        break;
      default:
        await context.sendText(`Hello Something went wrong :(`);
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
