const fs = require('fs');
const path = require('path');
const util = require('util');
const co = require('co');
const _ = require('lodash');
const sh = require('shelljs');
const moment = require('moment');

exports.co = function (func, options) {
  return Promise.resolve(co(function* () {
    return yield func(options);
  }).catch(exports.handleError));
};

/**
 * @param {Function|Generator} fn
 * @param  {...any} args
 */
exports.getFunctionResult = function* getFunctionResult(fn, ...args) {
  const isGenerator = fn.constructor.name === 'GeneratorFunction';

  let result;
  if (isGenerator) {
    result = yield fn(...args);
  } else {
    result = fn(...args);
  }

  return result;
};

/**
 * @param {Number} ms
 */
exports.delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * @param  {function} fn
 * @param  {array} [args=[]]
 * @param  {object} [ctx=fn]
 * @return {Promise.<*>}
 */
exports.runInPromise = function runInPromise(fn, args = [], ctx = fn) {
  return new Promise((resolve, reject) => {
    if (!fn) {
      resolve(null);
      return;
    }

    args.push((err, result) => {
      if (err) reject(err);
      else resolve(result);
    });

    fn.apply(ctx, args);
  });
};


exports.getPreparedEnvironment = function getPreparedEnvironment(env) {
  if (['stage', 's'].includes(env)) {
    return 'stage';
  }
  if (['production', 'prod', 'p'].includes(env)) {
    return 'production';
  }

  return env;
};

exports.timeConverter = function timeConverter(jiraStyleTime) { // weeks (w), days (d), hours (h) minutes (m) seconds (s)
  const times = jiraStyleTime.split(' ');
  let resultTime = 0;

  _.forEach(times, (time) => {
    let multiplier;
    const lastChar = time.slice(-1);
    switch (lastChar) {
      case 's':
        multiplier = 1000;
        break;
      case 'h':
        multiplier = 60 * 60 * 1000;
        break;
      case 'd': // сутки
        multiplier = 24 * 60 * 60 * 1000;
        break;
      case 'w':
        multiplier = 7 * 24 * 60 * 60 * 1000;
        break;

      case 'm':
      default:
        multiplier = 60 * 1000;
    }

    resultTime += Number(time.slice(0, -1) * multiplier);
  });

  return resultTime;
};

exports.logger = _.curry((libName, fileName, subLibDirectory, messages) => { // тут нельзя ставить параметры по умолчанию и использовать ... !
  const args = Array.isArray(messages) ? messages : [messages];
  const preparedArgs = _.compact(args).length === 0 ? [] : args;
  const currentTime = moment().format('YYYY.MM.DD_HH:mm:ss');
  const [day, time] = currentTime.split('_');
  const outputDir = path.join(__dirname, libName, 'logs', day, subLibDirectory);
  const outputFile = `${outputDir}/${fileName}.log`;
  sh.mkdir('-p', outputDir);
  sh.touch(outputFile);

  const string = util.format(`|${time}| `, ...preparedArgs);

  fs.appendFileSync(outputFile, `${string}\n`);
  console.log(string);
});
