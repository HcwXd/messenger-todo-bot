const { router, text } = require('bottender/router');
const ListTodo = require('../ListTodo');
const listSettings = require('../listSettings');
const SendHelp = require('../SendHelp');
const AddTodoByShortcut = require('../AddTodoByShortcut');
const ViewTodo = require('../ViewTodo');
const NewTodo = require('../NewTodo');
const { advanceEditTodoHint } = require('../../utils/wording');

module.exports = async function TextRouter(context) {
  /**  Userinput initiated by user && Shortcut text */
  return router([
    text(/^(list|l)$/i, ListTodo),
    text(/^(settings|s)$/i, listSettings),
    text(/^\/a/, AddTodoByShortcut),
    text(/^(help|h)$/i, SendHelp),
    text(/^(help edit)$/i, async () => {
      await context.sendText(advanceEditTodoHint);
    }),
    text('*', async () => {
      const targetIdx = context.state.todos.findIndex(({ title }) => title === context.event.text);
      if (targetIdx !== -1) {
        return ViewTodo;
      } else {
        return NewTodo;
      }
    }),
  ]);
};
