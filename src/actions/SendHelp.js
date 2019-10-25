const { helpText } = require('../wording');

module.exports = async function SendHelp(context) {
  return await context.sendText(helpText);
};
