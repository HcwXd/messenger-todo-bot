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
  isQuickReplyOf,
  isShortCutOf,
} = require('./utils');
const { helpText } = require('./helpText');

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
  subtitle += dueDate ? `Due ${renderDueDate(dueDate)}\n` : `No due date\n`;
  subtitle += reminder ? `Remind me at ${renderReminder(reminder)}\n` : `No reminder\n`;
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

const listSingleTodo = async (context, targetTodo) => {
  const { title, reminder, dueDate, note } = context.state.todos.find(
    ({ title }) => title === targetTodo
  );
  await context.sendGenericTemplate(
    [
      {
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
      },
    ],
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
    if (editString[0] === 'T') {
      const todoTitle = editString.slice(2);
      if (context.state.todos.findIndex(({ title }) => title === todoTitle) !== -1) {
        await context.sendText(`Todo ${todoTitle} already exists`);
      } else {
        updatedTodo.title = todoTitle;
      }
    } else if (editString[0] === 'R') {
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

const sendQuickReplyAfterAddingTodo = async (context, todoTitle) => {
  context.sendText(
    `You can add due date and reminder of the todo by clicking the edit button.\nOr ignore the button and add those later.`,
    {
      quick_replies: [
        {
          content_type: 'text',
          title: `Edit`,
          payload: `${QUICK_REPLY.EDIT_TODO}/${todoTitle}`,
        },
      ],
    }
  );
};

const constructShortCutTodoList = (todos) =>
  todos.map(({ title }, idx) => `${idx + 1}. ${title}`).join('\n');

const editTodoHint = `
To edit the todo title, enter in the following format:
T Some New Title

To edit the due date, enter in the following format:
D YYYY/MM/DD

To edit the reminder, enter in following format:
R YYYY/MM/DD HH:mm

To edit the notes, enter in following format:
N Some notes here

For example:
T Call Jack and Bob
D 2019/12/02
R 2019/12/01 13:00
N Remember to call Jack first

If you only want to edit certain fields, you can enter those in any order.
For example:
R 2020/01/01 13:00
D 2020/01/01

If you don't want to edit anything, enter "cancel"`;

bot.onEvent(async (context) => {
  const user = await context.getUserProfile();
  console.log(user);
  if (context.event.payload === 'GET_STARTED') {
    await context.sendText(helpText);
    await context.sendText("Let's add your first todo by simply entering a name of a todo item!");
  } else if (context.state.isWaitingUserInput && context.event.isText) {
    switch (context.state.userInput.type) {
      case INPUT_TYPE.EDIT_TODO:
        const targetTodoTitle = context.state.userInput.payload;
        const targetIdx = context.state.todos.findIndex(({ title }) => title === targetTodoTitle);
        if (targetIdx !== -1) {
          if (context.event.text === 'cancel') {
            await context.sendText(`Cancel update ${targetTodoTitle}`);
            context.setState({
              isWaitingUserInput: false,
              userInput: null,
            });
          } else {
            const editTodo = await updateTargetTodo(context, targetIdx);
            await context.sendText(`Update ${targetTodoTitle}`);
            context.setState({
              todos: replaceArrayItemByIndex(context.state.todos, targetIdx, editTodo),
              isWaitingUserInput: false,
              userInput: null,
            });
          }
        } else {
          await context.sendText(`Update ${targetTodoTitle} failed. Please try again later`);
          context.setState({
            isWaitingUserInput: false,
            userInput: null,
          });
        }
        break;
      case INPUT_TYPE.ADD_TODO:
        const todoTitle = context.event.text;
        if (context.state.todos.findIndex(({ title }) => title === todoTitle) !== -1) {
          context.setState({
            isWaitingUserInput: false,
            userInput: null,
          });
          await context.sendText(`Todo ${todoTitle} already exists`);
        } else {
          context.setState({
            todos: context.state.todos.concat({ title: todoTitle }),
            isWaitingUserInput: false,
            userInput: null,
          });
          await context.sendText(
            `Add todo: ${todoTitle}..\n\nTo add a todo faster, you can simply enter "/a something todo".\nFor example:\n/a ${todoTitle}`
          );
          await sendQuickReplyAfterAddingTodo(context, todoTitle);
        }
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
        await context.sendText(editTodoHint);
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
    if (isShortCutOf(SHORT_CUT.ADD_TODO, context.event.text)) {
      const todoTitle = context.event.text.slice(3);
      if (context.state.todos.findIndex(({ title }) => title === todoTitle) !== -1) {
        context.setState({
          isWaitingUserInput: false,
          userInput: null,
        });
        await context.sendText(`Todo ${todoTitle} already exists`);
      } else {
        context.setState({
          todos: context.state.todos.concat({ title: todoTitle }),
          isWaitingUserInput: false,
          userInput: null,
        });
        await context.sendText(`Add todo: ${todoTitle}.`);
        await sendQuickReplyAfterAddingTodo(context, todoTitle);
      }
    } else if (isShortCutOf(SHORT_CUT.LIST_TODO, context.event.text)) {
      if (context.event.text.length === SHORT_CUT.LIST_TODO.length) {
        if (context.state.todos.length === 0) {
          await context.sendText(`There's no todo in your list :-p`);
          return;
        }
        context.sendText(
          `Your Todo:\n${constructShortCutTodoList(
            context.state.todos
          )}\n\nChoose the index of the todo you want to view or edit:`,
          {
            quick_replies: context.state.todos.map(({ title }, idx) => {
              return {
                content_type: 'text',
                title: `${idx + 1}`,
                payload: `${QUICK_REPLY.CHOOSE_TODO}/${title}`,
              };
            }),
          }
        );
      }
    } else if (isShortCutOf(SHORT_CUT.HELP, context.event.text)) {
      if (context.event.text.length === SHORT_CUT.HELP.length) {
        await context.sendText(helpText);
      }
    } else {
      if (context.event.isQuickReply) {
        const { payload } = context.event.quickReply;
        if (isQuickReplyOf(QUICK_REPLY.ADD_TODO, payload)) {
          const todoTitle = payload.slice(QUICK_REPLY.ADD_TODO.length + 1);
          if (context.state.todos.findIndex(({ title }) => title === todoTitle) !== -1) {
            context.setState({
              isWaitingUserInput: false,
              userInput: null,
            });
            await context.sendText(`Todo ${todoTitle} already exists`);
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
        } else if (isQuickReplyOf(QUICK_REPLY.VIEW_TODO, payload)) {
          const todoTitle = payload.slice(QUICK_REPLY.VIEW_TODO.length + 1);
          const { title, reminder, dueDate, note } = context.state.todos.find(
            ({ title }) => title === todoTitle
          );
          await context.sendText(
            `# ${title}\n${constructTodoSubtitle({ reminder, dueDate, note })}`
          );
        } else if (isQuickReplyOf(QUICK_REPLY.EDIT_TODO, payload)) {
          const todoTitle = payload.slice(QUICK_REPLY.EDIT_TODO.length + 1);
          // TODO: Should use webview instead for more complicated flow
          context.setState({
            userInput: { type: INPUT_TYPE.EDIT_TODO, payload: todoTitle },
            isWaitingUserInput: true,
          });
          await context.sendText(editTodoHint);
        } else if (isQuickReplyOf(QUICK_REPLY.DELETE_TODO, payload)) {
          const todoTitle = payload.slice(QUICK_REPLY.DELETE_TODO.length + 1);
          await deleteTodo(context, todoTitle);
        } else if (isQuickReplyOf(QUICK_REPLY.CHOOSE_TODO, payload)) {
          const todoTitle = payload.slice(QUICK_REPLY.CHOOSE_TODO.length + 1);
          await listSingleTodo(context, todoTitle);
        }
      } else {
        const targetIdx = context.state.todos.findIndex(
          ({ title }) => title === context.event.text
        );
        if (targetIdx !== -1) {
          await context.sendText(`Todo "${context.event.text}" exists, you want to:`, {
            quick_replies: [
              {
                content_type: 'text',
                title: `View todo`,
                payload: `${QUICK_REPLY.VIEW_TODO}/${context.event.text}`,
              },
              {
                content_type: 'text',
                title: `Edit todo`,
                payload: `${QUICK_REPLY.EDIT_TODO}/${context.event.text}`,
              },
              {
                content_type: 'text',
                title: `Delete todo`,
                payload: `${QUICK_REPLY.DELETE_TODO}/${context.event.text}`,
              },
              {
                content_type: 'text',
                title: `Nothing`,
                payload: QUICK_REPLY.NOTHING,
              },
            ],
          });
        } else {
          await context.sendText('Pick an action', {
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
    }
  } else {
    await context.sendText(`Hello :)`);
  }
});

const server = createServer(bot, { verifyToken: config.verifyToken });

server.listen(config.port, () => {
  console.log(`server is running on ${config.port} port`);
});
