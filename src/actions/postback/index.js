/* eslint-disable no-case-declarations */
const ListTodoDetailed = require('../ListTodoDetailed');
const ListSettings = require('../ListSettings');
const DeleteTodo = require('../DeleteTodo');
const { INPUT_TYPE, POSTBACK_TITLE } = require('../../utils/constant');
const { editTodoHint } = require('../../utils/wording');

module.exports = async function PostbackRouter(context) {
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
      await DeleteTodo(context, targetTodo);
      break;
    case POSTBACK_TITLE.LIST_TODO:
      await ListTodoDetailed(context);
      break;
    case POSTBACK_TITLE.SETTINGS:
      await ListSettings(context);
      break;
    default:
      await context.sendText(`Hello :)`);
      break;
  }
};
