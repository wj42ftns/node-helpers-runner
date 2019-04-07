const sh = require('shelljs');
const SshShell = require('ssh-shell');
const moment = require('moment');
const commonConfig = require('./config.json');
const getUsedMemPercent = require('./getUsedMemPercent');
const GetUsedCpuPercent = require('./GetUsedCpuPercent');
const { delay } = require('../../libs/helpers.js');
const { getPreparedEnvironment, timeConverter, logger } = require('../helpers.js');

const accessLog = logger('monitoring', 'access');
const errorLog = logger('monitoring', 'error');

let stressStartTimeStamp = null;
let alreadyRunAlert = false;
let stressTime = null;
let noAlert = false;
let lastSshReconnect = new Date().getTime();
let lastFormattedStressTime = null;

module.exports = function* monitoring(env, option) {
  noAlert = option === '--noAlert';
  const environment = getPreparedEnvironment(env);
  if (!['stage', 'production', 'bd'].includes(environment)) {
    throw new Error(`not supported environment: "${environment}"`);
  }

  accessLog(environment, `Начинаю работу! --noAlert: "${noAlert}"`);
  const config = commonConfig[environment];
  const [username, host] = config.ssh.split('@');
  const remoteSh = new SshShell({
    host,
    username,
    privateKey: true
  });


  yield remoteSh.open();
  const getUsedCpuPercent = new GetUsedCpuPercent(remoteSh);
  const timeToAlertMs = timeConverter(config.alert.time);
  const sshReconnectTimeMs = timeConverter(config.sshReconnectTime);
  while (true) {
    try {
      yield reconnectSshIfNeed(remoteSh, sshReconnectTimeMs, environment);
      const usedCpuPercent = yield getUsedCpuPercent();
      const usedMemPercent = yield getUsedMemPercent(remoteSh);
      runAlertIfNeed(config, usedCpuPercent, usedMemPercent, timeToAlertMs);
      showInfo(environment, usedCpuPercent, usedMemPercent);
    } catch (error) {
      if (error.level === 'client-socket') {
        yield reconnectSshIfNeed(remoteSh, 0, environment);
      } else if (noAlert) {
        yield delay(5000);
        yield reconnectSshIfNeed(remoteSh, 0, environment);
      } else {
        errorLog(environment, error);
        runAlert(config.alert.command);
      }
    }

    yield delay(config.delayBetweenCheckSeconds * 1000);
  }
};

function* reconnectSshIfNeed(remoteSh, sshReconnectTimeMs, environment) {
  const now = new Date().getTime();
  if (lastSshReconnect + sshReconnectTimeMs < now) {
    accessLog(environment, 'ssh reconnect');
    lastSshReconnect = now;
    remoteSh.close();
    yield remoteSh.open();
  }
}


function runAlertIfNeed(config, usedCpuPercent, usedMemPercent, timeToAlertMs) {
  const isStress = [
    usedCpuPercent > config.alert.CPU,
    usedMemPercent > config.alert.MEM,
  ].some(Boolean);
  if (!noAlert && isStress && stressStartTimeStamp === null) {
    stressStartTimeStamp = new Date().getTime();
  }

  if (!isStress) {
    stressStartTimeStamp = null;
    alreadyRunAlert = false;
  }

  if (isStress && stressStartTimeStamp !== null) {
    const now = new Date().getTime();
    stressTime = now - stressStartTimeStamp;

    const showAlert = getStressTimeIsOver(now, timeToAlertMs);
    if (showAlert) {
      runAlert(config.alert.command);
    }
  }
}


function getStressTimeIsOver(now, timeToAlertMs) {
  return stressStartTimeStamp + timeToAlertMs < now;
}

function runAlert(command) {
  if (!alreadyRunAlert) {
    sh.exec(command, { async: true });
    alreadyRunAlert = true;
  }
}

function showInfo(environment, usedCpuPercent, usedMemPercent) {
  let message = `CPU: ${usedCpuPercent}%   MEM: ${usedMemPercent}%`;
  if (stressTime > 999) {
    const formattedStressTime = moment(stressTime).format('mm:ss');
    if (formattedStressTime !== lastFormattedStressTime) {
      message += ` — stressTime: ${formattedStressTime}`;
      lastFormattedStressTime = formattedStressTime;
      stressStartTimeStamp = null;
      alreadyRunAlert = false;
    }
  }

  accessLog(environment, message);
}
