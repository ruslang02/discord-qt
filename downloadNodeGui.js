/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const { dirname, join } = require('path');
const { https } = require('follow-redirects');

const { platform } = process;
const { arch } = process;
const version = 'v0.26.0';

const binPath = join(__dirname, 'node_modules/@nodegui/nodegui/build/Release/nodegui_core.node');

if (!fs.existsSync(binPath)) {
  fs.mkdirSync(dirname(binPath), { recursive: true });

  const dlPath = `https://github.com/ruslang02/nodegui-bin/releases/download/${version}/nodegui_core-${platform}-${arch}.node`;
  const file = fs.createWriteStream(binPath);

  https.get(dlPath, (r) => r.pipe(file));
}