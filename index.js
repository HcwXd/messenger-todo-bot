const { MessengerBot, FileSessionStore } = require('bottender');
const { createServer } = require('bottender/express');
const config = require('./bottender.config').messenger;
const { POSTBACK_TITLE, INPUT_TYPE, SHORT_CUT, QUICK_REPLY } = require('./constant');
const {
  dCopy,
  replaceArrayItemByIndex,
  getTimestampFromDueDate,
  getTimestampFromReminder,
  renderDueDate,
  renderReminder,
  isCorrectTimeFormat,
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
  prefs: { dailyReminder: null },
});

const sendWrongFormat = async (context, value, type) => {
  // TODO: Send different message according to different types
  console.log(`sendWrongFormat ${type}:${value}`);
  await context.sendText(`Wrong format: ${value}`);
};

const constructTodoSubtitle = ({ reminder, dueDate, note }) => {
  let subtitle = '';
  if (dueDate) subtitle += `Due ${renderDueDate(dueDate)}\n`;
  if (reminder) subtitle += `Remind me at ${renderReminder(reminder)}\n`;
  if (note) subtitle += `Note: ${note}`;
  return subtitle;
};

const listTodos = async (context) => {
  if (context.state.todos.length === 0) {
    await context.sendText(`There's no todo in your list :-p`);
    return;
  }
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

const updateTargetTodo = async (context, targetIdx) => {
  const updatedTodo = dCopy(context.state.todos[targetIdx]);
  const editRawData = context.event.text;
  const editRawArray = editRawData.split('\n');

  editRawArray.forEach(async (editString) => {
    if (editString[0] === 'R') {
      // Set Reminder
      let setData = editString.split(' ');
      if (setData.length !== 3) {
        await sendWrongFormat(context, editString, INPUT_TYPE.EDIT_TODO_REMINDER);
      } else {
        const timeStamp = getTimestampFromReminder(
          `${editString.split(' ')[1]} ${editString.split(' ')[2]}`
        );
        if (!timeStamp) {
          await sendWrongFormat(context, editString, INPUT_TYPE.EDIT_TODO_REMINDER);
        } else {
          updatedTodo.reminder = timeStamp;
        }
      }
    } else if (editString[0] === 'D') {
      // Set DueDate
      let setData = editString.split(' ');
      if (setData.length !== 2) {
        await sendWrongFormat(context, editString, INPUT_TYPE.EDIT_TODO_DUE_DATE);
      } else {
        const timeStamp = getTimestampFromDueDate(editString.split(' ')[1]);
        if (!timeStamp) {
          await sendWrongFormat(context, editString, INPUT_TYPE.EDIT_TODO_DUE_DATE);
        } else {
          updatedTodo.dueDate = timeStamp;
        }
      }
    } else if (editString[0] === 'N') {
      // Set Note
      updatedTodo.note = editString.slice(2);
    }
  });
  return updatedTodo;
};

const listSettings = async (context) => {
  await context.sendGenericTemplate(
    [
      {
        title: 'Daily Reminder',
        subtitle: context.state.prefs.dailyReminder
          ? `Your daily reminder now set at ${context.state.prefs.dailyReminder}.`
          : `You don't have daily reminder yet.`,
        buttons: [
          {
            type: 'postback',
            title: POSTBACK_TITLE.SET_DAILY_REMINDER,
            payload: POSTBACK_TITLE.SET_DAILY_REMINDER,
          },
        ],
      },
    ],
    { image_aspect_ratio: 'square' }
  );
};

bot.onEvent(async (context) => {
  if (context.state.isWaitingUserInput && context.event.isText) {
    switch (context.state.userInput.type) {
      case INPUT_TYPE.EDIT_TODO:
        const targetTodoTitle = context.state.userInput.payload;
        const targetIdx = context.state.todos.findIndex(({ title }) => title === targetTodoTitle);
        const editTodo = await updateTargetTodo(context, targetIdx);

        await context.sendText(`Update ${targetTodoTitle}`);
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
        await context.sendText(
          `Add todo: ${todoTitle}.\n\nTo add a todo faster, you can simply enter "/a something todo" without clicking the Add todo button.\nFor example:\n/a ${todoTitle}`
        );
        break;
      case INPUT_TYPE.SET_DAILY_REMINDER:
        const dailyReminder = context.event.text;
        if (isCorrectTimeFormat(dailyReminder)) {
          context.setState({
            prefs: { ...context.state.prefs, dailyReminder },
            isWaitingUserInput: false,
            userInput: null,
          });
          await context.sendText(`Set daily reminder: ${dailyReminder}`);
        } else {
          context.setState({
            isWaitingUserInput: false,
            userInput: null,
          });
          await sendWrongFormat(context, dailyReminder, INPUT_TYPE.SET_DAILY_REMINDER);
        }
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
          `Enter the todo info in the following format:\nD YYYY/MM/DD\nR YYYY/MM/DD/ HH:mm\nN Some notes here\n\nFor example:\nD 2020/02/01\nR 2020/01/01 13:00\nN Remember to call Jack first\n\nIf you only want to edit certain fields, you can just enter those (don't have to be in the same order as the example)\n\nFor example:\nR 2020/01/01 13:00\n\nFor more information, click Help in the menu!`
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
      case POSTBACK_TITLE.SETTINGS:
        await listSettings(context);
        break;
      case POSTBACK_TITLE.SET_DAILY_REMINDER:
        await context.sendText(
          `Enter a time in the following format: HH:mm\nFor example:\n13:00\nThis will set a daily reminder that will send a message at certain time everyday to remind you all the todos you have.`
        );
        context.setState({
          userInput: { type: INPUT_TYPE.SET_DAILY_REMINDER },
          isWaitingUserInput: true,
        });
        break;
      default:
        await context.sendText(`Hello :)`);
        break;
    }
  } else if (context.event.isText) {
    if (context.event.text.slice(0, 3) === SHORT_CUT.ADD_TODO) {
      const todoTitle = context.event.text.slice(3);
      context.setState({
        todos: context.state.todos.concat({ title: todoTitle }),
        isWaitingUserInput: false,
        userInput: null,
      });
      await context.sendText(`Add todo: ${todoTitle}`);
    } else {
      if (context.event.isQuickReply) {
        console.log('quickReply', context.event.quickReply);
        const { payload } = context.event.quickReply;
        if (payload.slice(0, QUICK_REPLY.ADD_TODO.length) === QUICK_REPLY.ADD_TODO) {
          const targetTodo = payload.slice(QUICK_REPLY.ADD_TODO.length + 1);
          console.log(targetTodo);
          context.setState({
            todos: context.state.todos.concat({ title: targetTodo }),
            isWaitingUserInput: false,
            userInput: null,
          });
          await context.sendText(`Add todo: ${targetTodo}!`);
        }
      } else {
        context.sendText('Pick an action', {
          quick_replies: [
            {
              content_type: 'text',
              title: `Add as todo`,
              payload: `${QUICK_REPLY.ADD_TODO}/${context.event.text}`,
            },
            {
              content_type: 'text',
              title: `Nothing`,
              payload: QUICK_REPLY.NOTHING,
            },
          ],
        });
      }
    }
  } else {
    await context.sendText(`Hello :)`);
  }
});

const server = createServer(bot, { verifyToken: config.verifyToken });

server.listen(config.port, () => {
  console.log(`server is running on ${config.port} port`);
});
