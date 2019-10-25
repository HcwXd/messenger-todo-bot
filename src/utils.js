const { DAY_OF_WEEK } = require('./constant');

const paddingLeft = value => {
  return `${value < 10 ? '0' : ''}${value}`;
};

const replaceArrayItemByIndex = (array, idx, newItem) => {
  const ret = array.slice(0);
  ret[idx] = newItem;
  return ret;
};

const getTimestampFromDueDate = dueDate => {
  if (dueDate.length !== 10) return false;
  if (dueDate.split('/').length !== 3) return false;
  const [year, month, day] = dueDate.split('/');
  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
  return new Date(year, month - 1, day);
};

const getTimestampFromReminder = reminder => {
  if (reminder.length !== 16 || reminder.split(' ').length !== 2) return false;
  const [date, time] = reminder.split(' ');

  if (date.split('/').length !== 3) return false;
  const [year, month, day] = date.split('/');
  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

  if (time.split(':').length !== 2) return false;
  const [hour, minute] = time.split(':');
  if (isNaN(hour) || isNaN(minute)) return false;

  return new Date(year, month - 1, day, hour - 8, minute);
};
const renderDueDate = dueDate => {
  const timeStamp = new Date(dueDate);
  timeStamp.setHours(timeStamp.getHours() + 8);
  const year = timeStamp.getFullYear();
  const month = paddingLeft(timeStamp.getMonth() + 1);
  const date = paddingLeft(timeStamp.getDate());
  const day = paddingLeft(DAY_OF_WEEK[timeStamp.getDay()]);
  return year === new Date().getFullYear()
    ? `${month}/${date} (${day})`
    : `${year}/${month}/${date} (${day})`;
};

const renderReminder = reminder => {
  const timeStamp = new Date(reminder);
  timeStamp.setHours(timeStamp.getHours() + 8);
  const year = timeStamp.getFullYear();
  const month = paddingLeft(timeStamp.getMonth() + 1);
  const date = paddingLeft(timeStamp.getDate());
  const day = DAY_OF_WEEK[timeStamp.getDay()];
  const hour = paddingLeft(timeStamp.getHours());
  const minute = paddingLeft(timeStamp.getMinutes());

  return year === new Date().getFullYear()
    ? `${month}/${date} (${day}) ${hour}:${minute}`
    : `${year}/${month}/${date} (${day}) ${hour}:${minute}`;
};

const isCorrectTimeFormat = timeString => {
  return (
    timeString.length === 5 &&
    timeString[2] === ':' &&
    !isNaN(timeString.split(':')[0]) &&
    !isNaN(timeString.split(':')[1])
  );
};

const constructTodoSubtitle = ({ reminder, dueDate, note }) => {
  let subtitle = '';
  subtitle += dueDate ? `Due ${renderDueDate(dueDate)}\n` : `No due date\n`;
  subtitle += reminder ? `Remind me at ${renderReminder(reminder)}\n` : `No reminder\n`;
  if (note) subtitle += `Note: ${note}`;
  return subtitle;
};

const constructShortCutTodoList = todos =>
  todos.map(({ title }, idx) => `${idx + 1}. ${title}`).join('\n');

module.exports = {
  replaceArrayItemByIndex,
  getTimestampFromDueDate,
  getTimestampFromReminder,
  renderDueDate,
  renderReminder,
  isCorrectTimeFormat,
  constructTodoSubtitle,
  constructShortCutTodoList,
};
