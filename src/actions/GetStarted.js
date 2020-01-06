const { helpText } = require('../utils/wording');
const { INPUT_TYPE } = require('../utils/constant');

module.exports = async function GetStarted(context) {
  await context.sendText(helpText);
  await context.sendText(
    `Now, you need to enter your timezone first to make sure the reminder will work fine.\n\nYou can find your timezone at https://www.timeanddate.com/time/map/\n\nPlease enter a value between -12 ~ 14.\n\nYou can revise it later from Settings in the menu.`
  );
  context.setState({
    userInput: { type: INPUT_TYPE.SET_TIME_ZONE },
    isWaitingUserInput: true,
  });
};
