const generateHandle = require('./generateHandle');
const fileHandle = require('./fileHandle');

module.exports = function () {
  generateHandle();
  fileHandle();
};