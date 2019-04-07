const util = require('util');
const axios = require('axios');
const _ = require('lodash');
const sh = require('shelljs');
const commonConfig = require('./config.json');
const { delay, logger } = require('../../libs/helpers.js');

const log = logger('ping');

let alreadyRunAlert = false;

module.exports = function* ping(type) {
  const config = commonConfig[type];
  log(type, 'access', 'Начинаю работу!');
  while (true) {
    let res;
    try {
      res = yield axios(config.axiosConfig);
      const isSuccessRequest = getIsSuccessRequest(res, config.expectedResponse);
      const { status, statusText, data } = res.status;
      if (isSuccessRequest) {
        log(type, 'access', 'Success request!');
        alreadyRunAlert = false;
      } else {
        if ([
          status,
          statusText,
          data
        ].some(Boolean)) {
          log(type, 'error', `status: "${status}", statusText: "${statusText}", data: ${data}`);
        } else {
          log(type, 'error', ['response: ', res]);
        }
        runAlert(config.alertCommand);
      }
    } catch (error) {
      log(type, 'error', `\
      errorCode: "${error.code}"
      responseStatus: "${_.get(error, 'response.status')}"
      responseStatusText: "${_.get(error, 'response.statusText')}"
      responseData: "${util.inspect(_.get(error, 'response.data', {}))}"\
      `.replace(/ {6}/g, ''));
      runAlert(config.alertCommand);
    }


    yield delay(config.delayBetweenCheckSeconds * 1000);
  }
};


function getIsSuccessRequest(res, expected) {
  return _
    .chain(expected)
    .map((value, key) => {
      const expectedValue = _.get(res, key);
      // console.log('|42| expectedValue ->    ', JSON.stringify(expectedValue, null, '  '));
      // console.log('|42| key ->    ', key);
      // if (!_.isEqual(value, expectedValue)) {
      //   debugger;
      // }
      return _.isEqual(value, expectedValue);
    })
    .every(Boolean)
    .value();
}


function runAlert(command) {
  if (!alreadyRunAlert) {
    sh.exec(command, { async: true });
    alreadyRunAlert = true;
  }
}
