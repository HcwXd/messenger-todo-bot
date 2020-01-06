module.exports = async function addState(context, { next }) {
  if (!context.state.todos) {
    context.setState({
      todos: [],
      isWaitingUserInput: false,
      isInitialSetUp: true,
      userInput: null,
      prefs: { dailyReminder: null, timezone: 8 },
    });
  }
  if (!context.state.prefs.timezone) {
    context.setState({
      prefs: { ...context.state.prefs, timezone: 8 },
    });
  }
  return next;
};
