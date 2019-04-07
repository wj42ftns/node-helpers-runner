const moment = require('moment');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const { logger } = require('../../libs/helpers.js');
const showLog = require('./showLog.js');

const log = logger('track', 'track', '');

module.exports = function track(...args) {
  if (args[0] === '--show') {
    const date = args[1];
    showLog(date);
    return;
  }

  const currentDate = moment().format('YYYY.MM.DD');
  const logFilePath = path.join(__dirname, `logs/${currentDate}/track.log`);

  let humanTimeDifference;
  try {
    const logFile = fs.readFileSync(logFilePath, 'utf8');
    const lastLogIndex = _.lastIndexOf(logFile, '\n', logFile.length - 2) + 1;
    const prevLogTime = logFile.substring(lastLogIndex + 1, lastLogIndex + 9);
    const prevLogTimeMs = moment(prevLogTime, 'HH:mm:ss').valueOf();
    const timeDifference = moment(new Date().valueOf() - prevLogTimeMs);
    humanTimeDifference = getHumanTimeFromMs(timeDifference);
  } catch (err) {
    //
  }

  const preparedArgs = humanTimeDifference ? [...args, `    ${humanTimeDifference}`] : args;
  log(preparedArgs);
};


function getHumanTimeFromMs(ms) {
  if (!ms) {
    return '';
  }

  const mapping = {
    d: 1000 * 60 * 60 * 8,
    h: 1000 * 60 * 60,
    m: 1000 * 60,
    s: 1000
  };

  let restTime = ms;
  const result = [];
  _.forEach(mapping, (value, key) => {
    if (restTime / value > 1) {
      const count = Math.floor(restTime / value);
      result.push(`${count}${key}`);
      restTime -= count * value;
    }
  });

  return result.join(' ');
}
