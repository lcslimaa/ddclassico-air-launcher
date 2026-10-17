const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const secret = 'NEVER_EXPORT_THIS';
const element = {
  tagName: 'OBJECT',
  querySelectorAll: () => [{name: 'flashvars', value: 'locale=pt&key='+secret}],
  getAttribute: name => ({data: 'https://resource.example.com/Loading.swf?user='+secret+'&config='+secret,
                         allowscriptaccess: 'always'}[name] || null)
};
const result = vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../tools/investigation/embedding_summary.js'), 'utf8'), {
  URL, URLSearchParams, location: {href: 'https://example.com/game'},
  document: {querySelectorAll: () => [element]}
});
const plain = JSON.parse(JSON.stringify(result));
assert.deepEqual(plain[0].parameterNames, ['locale', 'key', 'user', 'config']);
assert.equal(plain[0].resource, 'https://resource.example.com/Loading.swf');
assert.ok(!JSON.stringify(plain).includes(secret));
console.log('Embedding query/FlashVars detection and value omission verified.');
