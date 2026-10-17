const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../../tools/investigation/export_session.js'), 'utf8');
const secret = 'SYNTHETIC_SESSION_NOT_A_REAL_CREDENTIAL';

function run(raw) {
  let downloaded;
  class ExportURL extends URL {
    static createObjectURL(blob) { downloaded = blob; return 'blob:local-test'; }
    static revokeObjectURL() {}
  }
  const element = {querySelectorAll: () => [], getAttribute: n => n === 'data' ? raw : null};
  const link = {click() {}, remove() {}};
  const context = {URL: ExportURL, URLSearchParams, Blob, TextEncoder, Date, setTimeout: () => {},
    location: {href: 'https://ddclassico.com/playgame/1'},
    document: {querySelectorAll: () => [element], createElement: () => link, body: {appendChild() {}}}};
  const result = vm.runInNewContext(code, context);
  return {result, downloaded, link};
}

(async () => {
  const raw = 'https://resource.ddclassico.com/flash/Loading.swf?user=synthetic-user&key='+secret+
    '&config='+encodeURIComponent('https://s1.ddclassico.com/portugal/config.xml')+'&token='+secret;
  const {result, downloaded, link} = run(raw);
  assert.ok(!JSON.stringify(result).includes(secret));
  assert.equal(link.download, 'ddclassico-air-session.json');
  const file = JSON.parse(await downloaded.text());
  assert.equal(file.format, 'ddclassico-air-session-v1');
  assert.equal(file.entryUrl, 'https://resource.ddclassico.com/flash/Loading.swf');
  assert.equal(file.parameters.key, secret);
  assert.equal(file.parameters.config, 'https://s1.ddclassico.com/portugal/config.xml');
  assert.ok(Number.isFinite(file.exportedAt));
  assert.throws(() => run(raw.replace('https://resource.ddclassico.com', 'https://unrelated.example')));
  assert.throws(() => run(raw.replace(encodeURIComponent('https://s1.ddclassico.com/portugal/config.xml'),
                                    encodeURIComponent('https://unrelated.example/config.xml'))));
  assert.throws(() => run('https://resource.ddclassico.com/flash/Loading.swf?user=synthetic-user'));
  console.log('Session export, query decoding, origin checks and metadata value omission passed with synthetic inputs.');
})().catch(error => { console.error(error); process.exitCode = 1; });
