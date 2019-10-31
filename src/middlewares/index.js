const { chain } = require('bottender');
const addUser = require('./addUser');
const addState = require('./addState');

module.exports = chain([addUser, addState]);
