#!/usr/bin/env node
const co = require('co');
const libs = require('./src/index.js');
const { getFunctionResult } = require('./src/libs/helpers.js');

process.on('uncaughtException', (err) => {
  console.error(err);
});


const [scriptName, ...args] = process.argv.slice(2);

if (Object.keys(libs).includes(scriptName)) {
  co(function* () {
    yield getFunctionResult(libs[scriptName], ...args);
    process.exit(0);
  }).catch((error) => {
    console.error('error: ', error);
    process.exit(1);
  });
} else {
  console.error(`not found script with name: "${scriptName}"`);
  process.exit(1);
}
