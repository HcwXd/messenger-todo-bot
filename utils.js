const { DAY_OF_WEEK } = require('./constant');

module.exports = {
  dCopy: (obj) => {
    if (obj === null) return null;
    if (obj === undefined) return undefined;
    let val;
    const ret = Array.isArray(obj) ? [] : {};
    Object.keys(obj).forEach((key) => {
      val = obj[key];
      ret[key] = typeof val === 'object' ? dCopy(val) : val;
    });
    return ret;
  },
  replaceArrayItemByIndex: (array, idx, newItem) => {
    const ret = array.slice(0);
    ret[idx] = newItem;
    return ret;
  },
  getTimestampFromDueDate: (dueDate) => {
    if (dueDate.length !== 10) return false;
    if (dueDate.split('/').length !== 3) return false;
    const [year, month, day] = dueDate.split('/');
    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
    return new Date(year, month - 1, day);
  },
  getTimestampFromReminder: (reminder) => {
    if (reminder.length !== 16 || reminder.split(' ').length !== 2) return false;
    const [date, time] = reminder.split(' ');

    if (date.split('/').length !== 3) return false;
    const [year, month, day] = date.split('/');
    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

    if (time.split(':').length !== 2) return false;
    const [hour, minute] = time.split(':');
    if (isNaN(hour) || isNaN(minute)) return false;

    return new Date(year, month - 1, day, hour, minute);
  },
  renderDueDate: (dueDate) => {
    const year = new Date(dueDate).getFullYear();
    const month = new Date(dueDate).getMonth() + 1;
    const date = new Date(dueDate).getDate();
    const day = DAY_OF_WEEK[new Date(dueDate).getDay()];
    return year === new Date().getFullYear()
      ? `${month}/${date} (${day})`
      : `${year}/${month}/${date} (${day})`;
  },
  renderReminder: (reminder) => {
    const year = new Date(reminder).getFullYear();
    const month = new Date(reminder).getMonth() + 1;
    const date = new Date(reminder).getDate();
    const day = DAY_OF_WEEK[new Date(reminder).getDay()];
    const hour = new Date(reminder).getHours();
    const minute = new Date(reminder).getMinutes();

    return year === new Date().getFullYear()
      ? `${month}/${date} (${day}) ${hour}:${minute}`
      : `${year}/${month}/${date} (${day}) ${hour}:${minute}`;
  },
  isCorrectTimeFormat: (timeString) => {
    return (
      timeString.length === 5 &&
      timeString[2] === ':' &&
      !isNaN(timeString.split(':')[0]) &&
      !isNaN(timeString.split(':')[1])
    );
  },
};
