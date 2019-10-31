const {
  replaceArrayItemByIndex,
  getTimestampFromDueDate,
  getTimestampFromReminder,
  constructTodoSubtitle,
  constructTodoReminderKey,
} = require('../utils/utils');
const { redisClient } = require('../services/redis');
const { INPUT_TYPE, REDIS_KEY } = require('../utils/constant');
const sendWrongFormat = require('./SendWrongFormat');

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

module.exports = async function EditTodo(context, targetTodoTitle, targetIdx) {
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
