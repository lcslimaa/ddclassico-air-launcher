'use strict';
const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, '.generated');
fs.mkdirSync(output, {recursive: true});
fs.writeFileSync(path.join(output, 'preload.js'),
  ['capture.js', 'preload-body.js'].map(name => fs.readFileSync(path.join(__dirname, 'src', name), 'utf8')).join('\n'));
console.log('Sandboxed login observer prepared.');
