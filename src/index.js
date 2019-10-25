const { POSTBACK_TITLE, INPUT_TYPE, SHORT_CUT, QUICK_REPLY } = require('./constant');
const {
  replaceArrayItemByIndex,
  getTimestampFromDueDate,
  getTimestampFromReminder,
  isCorrectTimeFormat,
  isQuickReplyOf,
  isShortCutOf,
  constructTodoSubtitle,
  constructShortCutTodoList,
} = require('./utils');
const { helpText, editTodoHint } = require('./wording');

const sendWrongFormat = async (context, value, type) => {
  // TODO: Send different message according to different types
  console.log(`sendWrongFormat ${type}:${value}`);
  await context.sendText(`Wrong format: ${value}`);
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
  const updatedTodo = context.state.todos[targetIdx];
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

const handleInputExistTodo = async (context) => {
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

const handleInputNewTodo = async (context) => {
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

const handleShortCutListTodo = async (context) => {
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
};

const handleInputEditTodo = async (context, targetTodoTitle, targetIdx) => {
  if (targetIdx !== -1) {
    if (context.event.text === 'cancel') {
      await context.sendText(`Cancel update ${targetTodoTitle}`);
    } else {
      const editTodo = await updateTargetTodo(context, targetIdx);
      await context.sendText(`Update ${targetTodoTitle}`);
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
  await context.sendText(`# ${title}\n${constructTodoSubtitle({ reminder, dueDate, note })}`);
};
module.exports = async function App(context) {
  if (!context.state.todos) {
    context.setState({
      todos: [],
      isWaitingUserInput: false,
      userInput: null,
      prefs: { dailyReminder: null },
    });
  }
  const user = await context.getUserProfile();
  console.log(user);
  /**  Get Started Message */
  if (context.event.payload === 'GET_STARTED') {
    await context.sendText(helpText);
    await context.sendText("Let's add your first todo by simply entering a name of a todo item!");
    return;
  }

  /**  User input after instruction */
  if (context.state.isWaitingUserInput && context.event.isText) {
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
    }
    context.setState({
      isWaitingUserInput: false,
      userInput: null,
    });
    return;
  }

  /**  Button action */
  if (context.event.isPostback) {
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
    return;
  }

  /**  Quick Reply */
  if (context.event.isQuickReply) {
    const { payload } = context.event.quickReply;
    if (isQuickReplyOf(QUICK_REPLY.ADD_TODO, payload)) {
      const todoTitle = payload.slice(QUICK_REPLY.ADD_TODO.length + 1);
      await handleQuickReplyAddTodo(context, todoTitle);
    } else if (isQuickReplyOf(QUICK_REPLY.VIEW_TODO, payload)) {
      const todoTitle = payload.slice(QUICK_REPLY.VIEW_TODO.length + 1);
      await handleQuickReplyViewTodo(context, todoTitle);
    } else if (isQuickReplyOf(QUICK_REPLY.EDIT_TODO, payload)) {
      const todoTitle = payload.slice(QUICK_REPLY.EDIT_TODO.length + 1);
      await context.sendText(editTodoHint);
      // TODO: Should use webview instead for more complicated flow
      context.setState({
        userInput: { type: INPUT_TYPE.EDIT_TODO, payload: todoTitle },
        isWaitingUserInput: true,
      });
    } else if (isQuickReplyOf(QUICK_REPLY.DELETE_TODO, payload)) {
      const todoTitle = payload.slice(QUICK_REPLY.DELETE_TODO.length + 1);
      await deleteTodo(context, todoTitle);
    } else if (isQuickReplyOf(QUICK_REPLY.CHOOSE_TODO, payload)) {
      const todoTitle = payload.slice(QUICK_REPLY.CHOOSE_TODO.length + 1);
      await listSingleTodo(context, todoTitle);
    }
    return;
  }

  /**  Userinput initiated by user && Shortcut text */
  if (context.event.isText) {
    if (isShortCutOf(SHORT_CUT.ADD_TODO, context.event.text)) {
      const todoTitle = context.event.text.slice(3);
      await handleShortCutAddTodo(context, todoTitle);
    } else if (isShortCutOf(SHORT_CUT.LIST_TODO, context.event.text)) {
      await handleShortCutListTodo(context);
    } else if (context.event.text === SHORT_CUT.HELP) {
      await context.sendText(helpText);
    } else {
      const targetIdx = context.state.todos.findIndex(({ title }) => title === context.event.text);
      if (targetIdx !== -1) {
        await handleInputExistTodo(context);
      } else {
        await handleInputNewTodo(context);
      }
    }
    return;
  }

  await context.sendText(`Hello :)`);
};
