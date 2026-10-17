const test = require('node:test');
const assert = require('node:assert/strict');
const {sessionFromEmbedding, observeEmbeddings, validateSession, isOfficialPage, isStartupURL,
  sessionFromStartupRequest, trustedStartupRequest, missingStartupFields} = require('../src/capture');
const secret = 'SYNTHETIC_ONLY_NOT_A_CREDENTIAL';
const page = 'https://ddclassico.com/playgame/1';
const config = 'https://s1.ddclassico.com/portugal/config.xml';
function embedding(attributes, children = []) {
  return {getAttribute: name => attributes[name] ?? null,
    querySelectorAll: () => children.map(item => ({getAttribute: name => item[name] ?? null}))};
}
function validElement() {
  return embedding({data: 'https://resource.ddclassico.com/flash/Loading.swf?user=fake&key='+secret+
    '&config='+encodeURIComponent(config)+'&token='+secret+'&rand=synthetic-random'});
}

test('captures complete blocked-request queries and waits for missing fields', () => {
  const raw = validElement().getAttribute('data');
  const value = sessionFromStartupRequest(raw);
  assert.equal(value.parameters.token, secret);
  assert.equal(value.entryUrl, 'https://resource.ddclassico.com/flash/Loading.swf');
  const missing = 'https://resource.ddclassico.com/flash/Loading.swf?user=fake';
  assert.equal(sessionFromStartupRequest(missing), null);
  assert.deepEqual(missingStartupFields(missing), ['key', 'config', 'token', 'rand']);
  assert.equal(sessionFromStartupRequest('https://unrelated.example/flash/Loading.swf'), null);
  assert.throws(() => sessionFromStartupRequest(raw.replace(encodeURIComponent(config), encodeURIComponent('https://unrelated.example/config.xml'))));
});

test('request capture requires browser ownership and an official initiating origin', () => {
  const contents = {id: 10, mainFrame: {url: page}, isDestroyed: () => false};
  assert.ok(trustedStartupRequest({webContentsId: 10, initiatorOrigin: 'https://ddclassico.com'}, contents));
  assert.ok(trustedStartupRequest({webContents: contents, frame: {url: page}}, contents));
  assert.equal(trustedStartupRequest({webContentsId: 11, initiatorOrigin: 'https://ddclassico.com'}, contents), false);
  assert.equal(trustedStartupRequest({webContentsId: 10, initiatorOrigin: 'https://unrelated.example', frame: {url: page}}, contents), false);
  assert.equal(trustedStartupRequest({webContentsId: 10}, contents), false);
  assert.equal(trustedStartupRequest({webContentsId: 10, initiatorOrigin: 'https://ddclassico.com'},
    {...contents, mainFrame: {url: 'https://unrelated.example'}}), false);
});

test('captures query parameters and preserves changing fields without generating values', () => {
  const result = sessionFromEmbedding(validElement(), page);
  assert.equal(result.entryUrl, 'https://resource.ddclassico.com/flash/Loading.swf');
  assert.equal(result.parameters.key, secret);
  assert.equal(result.parameters.token, secret);
  assert.equal(result.parameters.rand, 'synthetic-random');
  assert.equal(result.parameters.config, config);
  assert.equal(result.format, 'ddclassico-air-session-v1');
  assert.ok(Number.isFinite(result.exportedAt));
});

test('supports movie/FlashVars params and query overrides', () => {
  const element = embedding({}, [
    {name: 'MOVIE', value: 'https://resource.ddclassico.com/flash/ddt_loading.swf?key=query-key'},
    {name: 'FlashVars', value: 'user=fake&key=old-key&config='+encodeURIComponent(config)+'&token=flashvar-token&rand=fake-random'}
  ]);
  const result = sessionFromEmbedding(element, page);
  assert.equal(result.parameters.key, 'query-key');
  assert.equal(result.parameters.token, 'flashvar-token');
});

test('rejects unrelated pages/resources and incomplete or invalid sessions', () => {
  assert.equal(sessionFromEmbedding(validElement(), 'https://unrelated.example'), null);
  assert.equal(sessionFromEmbedding(embedding({data: 'https://unrelated.example/Loading.swf'}), page), null);
  assert.equal(sessionFromEmbedding(embedding({data: 'https://resource.ddclassico.com/flash/Loading.swf?user=fake'}), page), null);
  assert.equal(isOfficialPage('https://ddclassico.com.attacker.example'), false);
  assert.equal(isOfficialPage('https://name:pass@ddclassico.com'), false);
  assert.equal(isStartupURL('https://resource.ddclassico.com/flash/Loading.swf#fragment'), false);
  const value = sessionFromEmbedding(validElement(), page);
  assert.throws(() => validateSession({...value, exportedAt: Date.now()-600001}));
  assert.throws(() => validateSession({...value, exportedAt: Date.now()+61000}));
  assert.throws(() => validateSession({...value, parameters: {...value.parameters, config: 'https://unrelated.example/config.xml'}}));
  assert.throws(() => validateSession({...value, parameters: {...value.parameters, token: 1}}));
  assert.throws(() => validateSession({...value, parameters: {...value.parameters, key: 'x'.repeat(8193)}}));
});

test('observer captures dynamic insertions and delayed attribute updates only once', () => {
  const attributes = {data: 'https://resource.ddclassico.com/flash/Loading.swf'};
  const elements = [];
  let callback, disconnected = false, observed;
  class Observer {
    constructor(value) { callback = value; }
    observe(_doc, options) { observed = options; }
    disconnect() { disconnected = true; }
  }
  const document = {querySelectorAll: () => elements};
  const output = [];
  const problems = [];
  observeEmbeddings(document, () => page, Observer, value => output.push(value),
    () => problems.push(true), fn => fn());
  assert.equal(output.length, 0);
  elements.push(embedding(attributes)); callback();
  assert.equal(output.length, 0);
  attributes.flashvars = 'user=fake&key='+secret+'&config='+encodeURIComponent(config);
  callback();
  assert.equal(output.length, 0);
  attributes.flashvars += '&token='+secret+'&rand=fake-random';
  callback(); callback();
  assert.equal(output.length, 1);
  assert.equal(problems.length, 0);
  assert.ok(disconnected);
  assert.deepEqual(observed.attributeFilter, ['src', 'data', 'flashvars', 'name', 'value']);
});

test('observer catches an existing embedding and reports invalid config without values', () => {
  class Observer { observe() {} disconnect() {} }
  const values = [];
  observeEmbeddings({querySelectorAll: () => [validElement()]}, () => page, Observer,
    value => values.push(value), () => assert.fail());
  assert.equal(values.length, 1);
  let problems = 0;
  const broken = embedding({data: 'https://resource.ddclassico.com/flash/Loading.swf?user=fake&key='+secret+
    '&token=fake-token&rand=fake-random&config='+encodeURIComponent('https://unrelated.example/config.xml')});
  observeEmbeddings({querySelectorAll: () => [broken]}, () => page, Observer,
    () => assert.fail(), () => problems++);
  assert.equal(problems, 1);
});
