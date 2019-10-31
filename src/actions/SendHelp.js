const { helpText } = require('../utils/wording');

module.exports = async function Nothing(context) {
  return await context.sendText(helpText);
};
