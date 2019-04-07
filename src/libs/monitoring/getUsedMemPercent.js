const _ = require('lodash');


module.exports = function* getUsedMemPercent(remoteSh) {
  const freeRes = yield remoteSh.exec('free');
  const free = freeRes.io.toString();
  const usedMemPercent = _
    .chain(free)
    .split('\n')
    .get('1')
    .split(/\s+/)
    .at(['1', '2'])
    .thru(([fullMem, usedMed]) => Math.round(usedMed * 100 / fullMem))
    .value();

  return usedMemPercent;
};
