const { helpText } = require('../wording');

module.exports = async function Nothing(context) {
  return await context.sendText(helpText);
};
