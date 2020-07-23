#!/usr/bin/env node
const cp = require('child_process');
console.log(__dirname, process.cwd())
const proc = cp.spawn('npm run start', {
  shell: true
});
proc.stdout.on('data', (chunk) => console.log(chunk.toString()));
proc.stderr.on('data', (chunk) => console.error(chunk.toString()));