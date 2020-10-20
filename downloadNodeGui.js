const fs = require('fs');
const path = require('path');
const https = require('follow-redirects').https;

const platform = process.platform;
const arch = process.arch;
const version = 'v0.26.0';

const binPath = path.join(__dirname, 'node_modules/@nodegui/nodegui/build/Release/nodegui_core.node');
if (fs.existsSync(binPath)) return process.exit(0);
fs.mkdirSync(path.dirname(binPath), { recursive: true });

const dlPath = `https://github.com/ruslang02/nodegui-bin/releases/download/${version}/nodegui_core-${platform}-${arch}.node`;

const file = fs.createWriteStream(binPath);
https.get(dlPath, r => r.pipe(file));