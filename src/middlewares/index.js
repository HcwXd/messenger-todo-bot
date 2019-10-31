const { chain } = require('bottender');
const addUser = require('./addUser');

module.exports = chain([addUser]);
