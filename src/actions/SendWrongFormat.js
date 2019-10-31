module.exports = async function SendWrongFormat(context, value, type) {
  // TODO: Send different message according to different types
  console.log(`sendWrongFormat ${type}:${value}`);
  await context.sendText(`Wrong format: ${value}`);
};
