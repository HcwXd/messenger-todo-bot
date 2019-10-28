require('dotenv').config();
const fs = require('fs');
const ls = require('ls');
const axios = require('axios');
const { redisClient } = require('./services/redis');
const { REDIS_KEY } = require('./constant');

const sendUrl = `https://graph.facebook.com/v4.0/me/messages?access_token=${process.env.MESSENGER_ACCESS_TOKEN}`;
const checkReminderInterval = 60000;

const sendReminder = async ({ id, message }) => {
  await axios.post(sendUrl, {
    messaging_type: 'UPDATE',
    recipient: {
      id,
    },
    message,
  });
};

const constuctDailyReminderMessage = todos => {
  const text = `# Daily Reminder\nYour Todos:\n${todos
    .map(({ title }) => `- ${title}`)
    .join('\n')}`;
  return { text };
};

const constuctTodoReminderMessage = ({ title }) => {
  const text = `# Reminder\n${title}`;
  return { text };
};

const findDailyReminder = async (id, { todos, prefs }) => {
  if (prefs && prefs.dailyReminder) {
    const [hour, minute] = prefs.dailyReminder.split(':');
    const nowHour =
      new Date().getHours() + 8 > 23 ? new Date().getHours() + 8 - 24 : new Date().getHours() + 8;
    if (+hour === nowHour && +minute === new Date().getMinutes() && todos.length > 0) {
      const message = constuctDailyReminderMessage(todos);
      await sendReminder({ id, message });
    }
  }
};

const findTodoReminder = async (id, { todos }) => {
  todos.forEach(async ({ title, reminder, dueDate }) => {
    if (
      reminder &&
      new Date(reminder).toISOString().slice(0, 16) === new Date().toISOString().slice(0, 16)
    ) {
      const message = constuctTodoReminderMessage({ title, dueDate });
      await sendReminder({ id, message });
    }
  });
};

const findReminder = async ({ user, _state: state }) => {
  const { id } = user;
  await findDailyReminder(id, state);
  await findTodoReminder(id, state);
};

const sendTodoReminder = async rep => {
  const { id, title } = JSON.parse(rep);
  const message = constuctTodoReminderMessage({ title });
  await sendReminder({ id, message });
};

const redisCheckTodoQueue = () => {
  const nowTimeStamp = Math.floor(new Date().getTime() / 1000);
  redisClient.zrangebyscore(
    REDIS_KEY.TODO_QUEUE,
    0,
    nowTimeStamp + 60 - (nowTimeStamp % 60),
    'WITHSCORES',
    (err, rep) => {
      if (!rep || rep.length === 0) return;
      rep.forEach(async todo => {
        await sendTodoReminder(todo);
        await redisClient.zrem(REDIS_KEY.TODO_QUEUE, todo);
      });
    }
  );
};

const checkReminder = async () => {
  const files = ls('../.session/*');
  for (let file of files) {
    let rawdata = fs.readFileSync(`../.session/${file.file}`);
    let jsonData = JSON.parse(rawdata);
    await findReminder(jsonData);
  }
  redisCheckTodoQueue();
};
checkReminder();
setInterval(checkReminder, checkReminderInterval);
