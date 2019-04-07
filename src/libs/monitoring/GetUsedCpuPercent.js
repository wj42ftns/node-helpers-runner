// https://github.com/Leo-G/DevopsWiki/wiki/How-Linux-CPU-Usage-Time-and-Percentage-is-calculated  - это не заработало
// https://github.com/husanu/nodejs-cpu-usage/blob/master/cpuusage.js   - использовал за основу этот код

const _ = require('lodash');
const { delay } = require('../../libs/helpers.js');

module.exports = class GetUsedCpuPercent {
  constructor(remoteSh) {
    this.remoteSh = remoteSh;
    this.prev = {
      total: 0,
      idle: 0,
      load: 0,
    };

    return this.getUsedCpuPercent.bind(this);
  }

  * getUsedCpuPercent() {
    if (_.values(this.prev).every(elem => elem === 0)) {
      yield this.getProcStatInfo();
      yield delay(1000);
    }

    yield this.getProcStatInfo();
    const usedCpuPercent = this.prev.load;

    return usedCpuPercent;
  }

  * getProcStatInfo() {
    const freeRes = yield this.remoteSh.exec('cat /proc/stat');
    const procStat = freeRes.io.toString();

    const [
      user,
      nice,
      system,
      idle,
      // iowait,
      // irq,
      // softirq,
      // steal
    ] = _
      .chain(procStat.substring(0, procStat.indexOf('\n')))
      .split(/\s+/)
      .drop()
      .map(Number)
      .value();

    const total = user + nice + system;
    const load = Math.round(
      (total - this.prev.total) / (total + idle - this.prev.total - this.prev.idle) * 100
    );

    this.prev.load = load;
    this.prev.total = total;
    this.prev.idle = idle;
  }
};
