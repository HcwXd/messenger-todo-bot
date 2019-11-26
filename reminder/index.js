require('dotenv').config();
const axios = require('axios');
const { redisClient } = require('./services/redis');
const { REDIS_KEY } = require('./constant');
const MongoClient = require('mongodb').MongoClient;

const sendUrl = `https://graph.facebook.com/v4.0/me/messages?access_token=${process.env.MESSENGER_ACCESS_TOKEN}`;
const checkReminderInterval = 60000;

const url = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;
const dbName = process.env.MONGO_NAME;

const sendReminder = async ({ id, message }) => {
  await axios.post(sendUrl, {
    messaging_type: 'UPDATE',
    recipient: {
      id,
    },
    message,
  });
};

const constuctTodoReminderMessage = ({ title }) => {
  const text = `# Reminder\n${title}`;
  return { text };
};

const constuctDailyReminderMessage = todos => {
  const text = `# Daily Reminder\nYour Todos:\n${todos
    .map(({ title }) => `- ${title}`)
    .join('\n')}`;
  return { text };
};

const sendTodoReminder = async rep => {
  const { id, title } = JSON.parse(rep);
  const message = constuctTodoReminderMessage({ title });
  await sendReminder({ id, message });
};

const sendDailyReminder = async rep => {
  const { id } = JSON.parse(rep);
  const client = await MongoClient.connect(url);
  const db = client.db(dbName);
  const Sessions = db.collection('sessions');
  const { _state: state } = await Sessions.findOne({ id: `messenger:${id}` });
  const message = constuctDailyReminderMessage(state.todos);
  await sendReminder({ id, message });
};

const redisCheckTodoQueue = () => {
  const nowTimeStamp = Math.floor(new Date().getTime() / 1000);
  redisClient.zrangebyscore(
    REDIS_KEY.TODO_QUEUE,
    0,
    nowTimeStamp + 60 - (nowTimeStamp % 60),
    (err, rep) => {
      if (!rep || rep.length === 0) return;
      rep.forEach(async key => {
        await sendTodoReminder(key);
        await redisClient.zrem(REDIS_KEY.TODO_QUEUE, key);
      });
    }
  );
};

const redisCheckDailyQueue = () => {
  const nowTimeStamp = Math.floor(new Date().getTime() / 1000);
  redisClient.zrangebyscore(
    REDIS_KEY.DAILY_QUEUE,
    0,
    nowTimeStamp + 60 - (nowTimeStamp % 60),
    (err, rep) => {
      if (!rep || rep.length === 0) return;
      rep.forEach(async key => {
        await sendDailyReminder(key);
        await redisClient.zrem(REDIS_KEY.DAILY_QUEUE, key);
        redisClient.zadd(REDIS_KEY.DAILY_QUEUE, nowTimeStamp + 24 * 60 * 60, key);
      });
    }
  );
};

const checkReminder = async () => {
  redisCheckTodoQueue();
  redisCheckDailyQueue();
};
checkReminder();
setInterval(checkReminder, checkReminderInterval);
