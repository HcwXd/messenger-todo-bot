require('dotenv').config();
const fs = require('fs');
const ls = require('ls');
const axios = require('axios');

const sendUrl = `https://graph.facebook.com/v4.0/me/messages?access_token=${process.env.MESSENGER_ACCESS_TOKEN}`;
const checkReminderInterval = 6000;

const sendReminder = async ({ id, message }) => {
  await axios.post(sendUrl, {
    messaging_type: 'UPDATE',
    recipient: {
      id,
    },
    message,
  });
};

const constuctDailyReminderMessage = (todos) => {
  const text = `#Daily Reminder\nYour Todos:\n${todos.map(({ title }) => `- ${title}`).join('\n')}`;
  return { text };
};

const findDailyReminder = async (id, { todos, prefs }) => {
  if (prefs && prefs.dailyReminder) {
    const [hour, minute] = prefs.dailyReminder.split(':');
    if (+hour === new Date().getHours() && +minute === new Date().getMinutes()) {
      const message = constuctDailyReminderMessage(todos);
      await sendReminder({ id, message });
    }
  }
};

const findReminder = async ({ user, _state: state }) => {
  const { id } = user;
  await findDailyReminder(id, state);
};

const checkReminder = async () => {
  const files = ls('./.sessions/*');
  for (let file of files) {
    let rawdata = fs.readFileSync(`./.sessions/${file.file}`);
    let jsonData = JSON.parse(rawdata);
    await findReminder(jsonData);
  }
};

setInterval(checkReminder, checkReminderInterval);
