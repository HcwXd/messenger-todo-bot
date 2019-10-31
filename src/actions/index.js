/* eslint-disable no-case-declarations */
const { router, text, payload, route } = require('bottender/router');
const GetStarted = require('./GetStarted');
const Nothing = require('./Nothing');
const TextRouter = require('./text');
const DialogueRouter = require('./Dialogue');
const { POSTBACK_TITLE, INPUT_TYPE, QUICK_REPLY } = require('../utils/constant');
const { constructTodoSubtitle } = require('../utils/utils');
const { editTodoHint } = require('../utils/wording');

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

module.exports = async function App(context) {
  return router([
    payload('GET_STARTED', GetStarted),
    route(context => context.state.isWaitingUserInput, DialogueRouter),
    route(context => context.event.isPostback, HandleButtonAction),
    route(context => context.event.isQuickReply, HandleQuickReply),
    route(context => context.event.isText, TextRouter),

    text('*', async () => {
      await context.sendText(`Hello :)`);
    }),
  ]);
};
