const redis = require('redis');

const redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);
console.log('redisClient', process.env.REDIS_PORT);

redisClient.on('connect', () => {
  console.log('redis connected');
});
redisClient.on('error', err => {
  console.error(err);
});
redisClient.on('warning', warning => {
  console.warn(warning);
});

module.exports = {
  redisClient,
};
