/* eslint-disable require-atomic-updates */

module.exports = async function MessengerAddUser(context, { next }) {
  context.user = await context.getUserProfile();
  if (context.user) console.log(`Get message from: ${context.user.name}`);
  return next;
};
