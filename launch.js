#!/usr/bin/env node
const cp = require('child_process');

const { log, error } = console;

const proc = cp.spawn('npm run start', {
  shell: true,
  cwd: __dirname,
});

proc.stdout.on('data', (chunk) => log(chunk.toString()));
proc.stderr.on('data', (chunk) => error(chunk.toString()));
