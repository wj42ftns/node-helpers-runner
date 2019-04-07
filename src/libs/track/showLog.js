const moment = require('moment');
const path = require('path');
const fs = require('fs');

module.exports = function showLog(srcDate) {
  const date = srcDate || moment().format('YYYY.MM.DD');
  const logFilePath = path.join(__dirname, `logs/${date}/track.log`);

  try {
    const logFile = fs.readFileSync(logFilePath, 'utf8');
    console.log(logFile);
  } catch (err) {
    console.log('нет записей!');
  }
};
