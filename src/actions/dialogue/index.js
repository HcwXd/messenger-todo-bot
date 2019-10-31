/* eslint-disable no-case-declarations */
const { router, text } = require('bottender/router');
const EditTodo = require('../EditTodo');
const AddTodoByDialogue = require('../AddTodoByDialogue');
const SetDailyReminder = require('../SetDailyReminder');
const SetTimezone = require('../SetTimezone');
const { INPUT_TYPE } = require('../../utils/constant');

module.exports = async function HandleUserInputInDialogue(context) {
  /**  Userinput initiated by user && Shortcut text */
  /**  User input after instruction */
  switch (context.state.userInput.type) {
    case INPUT_TYPE.EDIT_TODO:
      const targetTodoTitle = context.state.userInput.payload;
      const targetIdx = context.state.todos.findIndex(({ title }) => title === targetTodoTitle);
      await EditTodo(context, targetTodoTitle, targetIdx);
      break;
    case INPUT_TYPE.ADD_TODO:
      const todoTitle = context.event.text;
      await AddTodoByDialogue(context, todoTitle);
      break;
    case INPUT_TYPE.SET_DAILY_REMINDER:
      const dailyReminder = context.event.text;
      await SetDailyReminder(context, dailyReminder);
      break;
    case INPUT_TYPE.SET_TIME_ZONE:
      const timezone = context.event.text;
      await SetTimezone(context, +timezone);
      break;
  }
  context.setState({
    isWaitingUserInput: false,
    userInput: null,
  });
  return;
};
