const fs = require('node:fs');
const path = require('node:path');

// Shared metadata for executable cases and the Excel exporter; never store credentials.
module.exports = function registerCases(test, defaults) {
  return function testcase(meta, execute) {
    const record = {
      type: 'N', role: 'N/A', level: 'Unit',
      precondition: 'Isolated fixtures; repository/external services mocked; no live database.',
      steps: 'Arrange the documented input; invoke the function; assert the expected result and side effects.',
      ...defaults, ...meta,
    };
    if (!/^[A-Z0-9-]+$/.test(record.id)) throw Error('Invalid testcase ID');
    for (const key of ['title', 'group', 'source', 'expected', 'input']) {
      if (!record[key]) throw Error(`${record.id}: missing ${key}`);
    }
    const directory = path.join(process.env.QA_RESULTS_DIR || path.resolve(__dirname, 'results/manual'), 'catalog');
    fs.mkdirSync(directory, { recursive: true });
    const destination = path.join(directory, record.id + '.json');
    if (fs.existsSync(destination) && process.env.QA_RUN_ID) {
      const old = JSON.parse(fs.readFileSync(destination, 'utf8'));
      if (JSON.stringify(old) !== JSON.stringify(record)) throw Error(`Conflicting testcase ID: ${record.id}`);
    }
    fs.writeFileSync(destination, JSON.stringify(record, null, 2) + '\n');
    test(`[${record.id}] ${record.title}`, execute);
  };
};
