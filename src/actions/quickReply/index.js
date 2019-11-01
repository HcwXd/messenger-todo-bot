/* eslint-disable no-case-declarations */
const { router, payload } = require('bottender/router');
const AddTodoByQuickReply = require('../AddTodoByQuickReply');
const ViewTodoByQuickReply = require('../ViewTodoByQuickReply');
const ViewTodoWithButton = require('../ViewTodoWithButton');
const DeleteTodo = require('../DeleteTodo');
const Nothing = require('../Nothing');
const { INPUT_TYPE, QUICK_REPLY } = require('../../utils/constant');
const { editTodoHint } = require('../../utils/wording');

module.exports = async function QuickReplyRouter(context) {
  /**  Quick Reply */
  const { quickReply } = context.event;
  return router([
    payload(new RegExp(`^${QUICK_REPLY.ADD_TODO}`), async () => {
      const todoTitle = quickReply.payload.slice(QUICK_REPLY.ADD_TODO.length + 1);
      await AddTodoByQuickReply(context, todoTitle);
    }),
    payload(new RegExp(`^${QUICK_REPLY.VIEW_TODO}`), async () => {
      const todoTitle = quickReply.payload.slice(QUICK_REPLY.VIEW_TODO.length + 1);
      await ViewTodoByQuickReply(context, todoTitle);
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
    payload(new RegExp(`^${QUICK_REPLY.DELETE_TODO}`), async () => {
      const todoTitle = quickReply.payload.slice(QUICK_REPLY.DELETE_TODO.length + 1);
      await DeleteTodo(context, todoTitle);
    }),
    payload(new RegExp(`^${QUICK_REPLY.CHOOSE_TODO}`), async () => {
      const todoTitle = quickReply.payload.slice(QUICK_REPLY.CHOOSE_TODO.length + 1);
      await ViewTodoWithButton(context, todoTitle);
    }),
    payload(QUICK_REPLY.NOTHING, Nothing),
  ]);
};
