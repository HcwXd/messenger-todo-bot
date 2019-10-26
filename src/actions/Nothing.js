const random = require('random-item');

module.exports = async function Nothing(context) {
  return await context.sendText(`Nothing happened ${random([':)', ':-p', '^_^', 'O:)', '3:)'])}`);
};
