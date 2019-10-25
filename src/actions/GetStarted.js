const { helpText } = require('../wording');
const { sendText, series } = require('bottender-compose');

module.exports = async function GetStarted() {
  series([
    sendText(helpText),
    sendText("Let's add your first todo by simply entering a name of a todo item!"),
  ]);
};
