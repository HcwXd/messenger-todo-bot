/* eslint-disable no-case-declarations */
const { router, text, payload, route } = require('bottender/router');
const GetStarted = require('./GetStarted');
const SendHelp = require('./SendHelp');
const Nothing = require('./Nothing');
const { redisClient } = require('../services/redis');
const { POSTBACK_TITLE, INPUT_TYPE, QUICK_REPLY, REDIS_KEY } = require('../utils/constant');
const {
  replaceArrayItemByIndex,
  getTimestampFromDueDate,
  getTimestampFromReminder,
  isCorrectTimeFormat,
  constructTodoSubtitle,
  constructShortCutTodoList,
  constructTodoReminderKey,
} = require('../utils/utils');
const { editTodoHint, advanceEditTodoHint } = require('../utils/wording');

const sendWrongFormat = async (context, value, type) => {
  // TODO: Send different message according to different types
  console.log(`sendWrongFormat ${type}:${value}`);
  await context.sendText(`Wrong format: ${value}`);
};

const listTodos = async context => {
  if (context.state.todos.length === 0) {
    await context.sendText(`There's no todo in your list :-p`);
    return;
  }
  await context.sendGenericTemplate(
    context.state.todos.map(({ title, reminder, dueDate, note }) => {
      return {
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

const deleteTodo = async (context, targetTodo) => {
  context.setState({
    todos: context.state.todos.filter(({ title }) => title !== targetTodo),
  });
  await context.sendText(`Delete todo ${targetTodo}!`);
};

const updateTargetTodo = async (context, targetIdx) => {
  const updatedTodo = context.state.todos[targetIdx];
  const editRawData = context.event.text;
  const editRawArray = editRawData.split('\n');

  editRawArray.forEach(async editString => {
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
          `${editString.split(' ')[1]} ${editString.split(' ')[2]}`,
          context.state.prefs.timezone
        );
        if (!timeStamp) {
          await sendWrongFormat(context, editString, INPUT_TYPE.EDIT_TODO_REMINDER);
        } else {
          updatedTodo.reminder = timeStamp;
          const user = await context.getUserProfile();
          redisClient.zadd(
            REDIS_KEY.TODO_QUEUE,
            Math.floor(timeStamp.getTime() / 1000),
            constructTodoReminderKey(user.id, updatedTodo.title)
          );
        }
      }
    } else if (editString[0] === 'D') {
      // Set DueDate
      let setData = editString.split(' ');
      if (setData.length !== 2) {
        await sendWrongFormat(context, editString, INPUT_TYPE.EDIT_TODO_DUE_DATE);
      } else {
        const timeStamp = getTimestampFromDueDate(
          editString.split(' ')[1],
          context.state.prefs.timezone
        );
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

const listSettings = async context => {
  await context.sendGenericTemplate(
    [
      {
        title: 'Daily Reminder',
        subtitle: context.state.prefs.dailyReminder
          ? `Your daily reminder now set at ${context.state.prefs.dailyReminder}.`
          : `You don't have daily reminder yet.`,
        buttons: context.state.prefs.dailyReminder
          ? [
              {
                type: 'postback',
                title: POSTBACK_TITLE.SET_DAILY_REMINDER,
                payload: POSTBACK_TITLE.SET_DAILY_REMINDER,
              },
              {
                type: 'postback',
                title: POSTBACK_TITLE.DELETE_DAILY_REMINDER,
                payload: POSTBACK_TITLE.DELETE_DAILY_REMINDER,
              },
            ]
          : [
              {
                type: 'postback',
                title: POSTBACK_TITLE.SET_DAILY_REMINDER,
                payload: POSTBACK_TITLE.SET_DAILY_REMINDER,
              },
            ],
      },
      {
        title: 'Set Timezone',
        subtitle: context.state.prefs.timezone
          ? `Your timezone now set at ${context.state.prefs.timezone}.`
          : `You haven't set your timezone yet.`,
        buttons: [
          {
            type: 'postback',
            title: POSTBACK_TITLE.SET_TIME_ZONE,
            payload: POSTBACK_TITLE.SET_TIME_ZONE,
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

const handleInputExistTodo = async context => {
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
};

const handleInputNewTodo = async context => {
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
};

const handleShortCutAddTodo = async (context, todoTitle) => {
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
    });
    await context.sendText(`Add todo: ${todoTitle}.`);
    await sendQuickReplyAfterAddingTodo(context, todoTitle);
  }
};

const handleShortCutListTodo = async context => {
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
};

const handleInputEditTodo = async (context, targetTodoTitle, targetIdx) => {
  if (targetIdx !== -1) {
    if (context.event.text === 'cancel') {
      await context.sendText(`Cancel update ${targetTodoTitle}`);
    } else {
      const editTodo = await updateTargetTodo(context, targetIdx);
      const { reminder, dueDate, note } = editTodo;
      await context.sendText(
        `Update ${targetTodoTitle}\n${constructTodoSubtitle(
          { reminder, dueDate, note },
          context.state.prefs.timezone
        )}`
      );
      context.setState({
        todos: replaceArrayItemByIndex(context.state.todos, targetIdx, editTodo),
      });
    }
  } else {
    await context.sendText(`Update ${targetTodoTitle} failed. Please try again later`);
  }
};

const handleInputAddTodo = async (context, todoTitle) => {
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

const handleInputSetDailyReminder = async (context, dailyReminder) => {
  if (isCorrectTimeFormat(dailyReminder)) {
    context.setState({
      prefs: { ...context.state.prefs, dailyReminder },
    });
    await context.sendText(`Set daily reminder: ${dailyReminder}`);
  } else {
    await sendWrongFormat(context, dailyReminder, INPUT_TYPE.SET_DAILY_REMINDER);
  }
};

const handleInputSetTimezone = async (context, timezone) => {
  if (-12 <= timezone <= 14) {
    context.setState({
      prefs: { ...context.state.prefs, timezone },
    });
    await context.sendText(`Set your timezone: ${timezone}`);
  } else {
    await sendWrongFormat(context, timezone, INPUT_TYPE.SET_TIME_ZONE);
  }
};

const handleQuickReplyAddTodo = async (context, todoTitle) => {
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

const handleQuickReplyViewTodo = async (context, todoTitle) => {
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

const HandleUserInputAfterInstruction = async context => {
  /**  User input after instruction */
  switch (context.state.userInput.type) {
    case INPUT_TYPE.EDIT_TODO:
      const targetTodoTitle = context.state.userInput.payload;
      const targetIdx = context.state.todos.findIndex(({ title }) => title === targetTodoTitle);
      await handleInputEditTodo(context, targetTodoTitle, targetIdx);
      break;
    case INPUT_TYPE.ADD_TODO:
      const todoTitle = context.event.text;
      await handleInputAddTodo(context, todoTitle);
      break;
    case INPUT_TYPE.SET_DAILY_REMINDER:
      const dailyReminder = context.event.text;
      await handleInputSetDailyReminder(context, dailyReminder);
      break;
    case INPUT_TYPE.SET_TIME_ZONE:
      const timezone = context.event.text;
      await handleInputSetTimezone(context, +timezone);
      break;
  }
  context.setState({
    isWaitingUserInput: false,
    userInput: null,
  });
  return;
};

const HandleButtonAction = async context => {
  /**  Button action */
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
      if (context.state.todos.length >= 10) {
        await context.sendText(`Sorry. You can only have 10 todos in your list.`);
      } else {
        context.setState({
          userInput: { type: INPUT_TYPE.ADD_TODO },
          isWaitingUserInput: true,
        });
        await context.sendText(`Enter a title for this todo:`);
      }
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
    case POSTBACK_TITLE.SET_TIME_ZONE:
      await context.sendText(
        `Enter your timezone offset.\nFor example, if you live in Taiwan, enter "8".\nIf you live in New York, enter "-4".\nYou can find your timezone at https://www.timeanddate.com/time/map/`
      );
      context.setState({
        userInput: { type: INPUT_TYPE.SET_TIME_ZONE },
        isWaitingUserInput: true,
      });
      break;
    case POSTBACK_TITLE.DELETE_DAILY_REMINDER:
      context.setState({
        prefs: { ...context.state.prefs, dailyReminder: null },
      });
      await context.sendText(`Your daily reminder has been deleted`);
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
    default:
      await context.sendText(`Hello :)`);
      break;
  }
};

const HandleQuickReply = async context => {
  /**  Quick Reply */
  const { quickReply } = context.event;
  return router([
    payload(new RegExp(`^${QUICK_REPLY.ADD_TODO}`), async () => {
      const todoTitle = quickReply.payload.slice(QUICK_REPLY.ADD_TODO.length + 1);
      await handleQuickReplyAddTodo(context, todoTitle);
    }),
    payload(new RegExp(`^${QUICK_REPLY.VIEW_TODO}`), async () => {
      const todoTitle = quickReply.payload.slice(QUICK_REPLY.VIEW_TODO.length + 1);
      await handleQuickReplyViewTodo(context, todoTitle);
    }),
    payload(new RegExp(`^${QUICK_REPLY.EDIT_TODO}`), async () => {
      const todoTitle = quickReply.payload.slice(QUICK_REPLY.EDIT_TODO.length + 1);
      await context.sendText(editTodoHint);
      // TODO: Should use webview instead for more complicated flow
      context.setState({
        userInput: { type: INPUT_TYPE.EDIT_TODO, payload: todoTitle },
        isWaitingUserInput: true,
      });
    }),
    payload(new RegExp(`^${QUICK_REPLY.CHOOSE_TODO}`), async () => {
      const todoTitle = quickReply.payload.slice(QUICK_REPLY.CHOOSE_TODO.length + 1);
      await listSingleTodo(context, todoTitle);
    }),
    payload(QUICK_REPLY.NOTHING, Nothing),
  ]);
};

const HandleUserInputInitiatedByUser = async context => {
  /**  Userinput initiated by user && Shortcut text */
  return router([
    text(/^(list|l)$/i, async () => {
      await handleShortCutListTodo(context);
    }),
    text(/^(help|h)$/i, SendHelp),
    text(/^(help edit)$/i, async () => {
      await context.sendText(advanceEditTodoHint);
    }),
    text(/^(settings|s)$/i, async () => {
      await listSettings(context);
    }),
    text(/^\/a/, async () => {
      const todoTitle = context.event.text.slice(3);
      await handleShortCutAddTodo(context, todoTitle);
    }),
    text('*', async () => {
      const targetIdx = context.state.todos.findIndex(({ title }) => title === context.event.text);
      if (targetIdx !== -1) {
        await handleInputExistTodo(context);
      } else {
        await handleInputNewTodo(context);
      }
    }),
  ]);
};

module.exports = async function App(context) {
  if (!context.state.todos) {
    context.setState({
      todos: [],
      isWaitingUserInput: false,
      userInput: null,
      prefs: { dailyReminder: null, timezone: 8 },
    });
  }
  if (!context.state.prefs.timezone) {
    context.setState({
      prefs: { ...context.state.prefs, timezone: 8 },
    });
  }

  return router([
    payload('GET_STARTED', GetStarted),
    route(
      context => context.state.isWaitingUserInput && context.event.isText,
      HandleUserInputAfterInstruction
    ),
    route(context => context.event.isPostback, HandleButtonAction),
    route(context => context.event.isQuickReply, HandleQuickReply),
    route(context => context.event.isText, HandleUserInputInitiatedByUser),

    text('*', async () => {
      await context.sendText(`Hello :)`);
    }),
  ]);
};
