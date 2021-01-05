const { join } = require('path');
const { mkdirSync, readdirSync, readFileSync } = require('fs');
const { execSync } = require('child_process');

const { log } = console;

const CONFIG_FILE = join(__dirname, 'deploy', 'config.json');
const { appName } = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
const safeName = appName.replace(' ', '').toLowerCase();

const BUILD_DIR = join(__dirname, 'deploy', 'linux', 'build', appName);
const LIB_DIR = join(__dirname, 'deb-struct', 'usr', 'lib');
const BIN_DIR = join(__dirname, 'deb-struct', 'usr', 'bin', appName);
const paths = [
  './deb-struct/DEBIAN/',
  './deb-struct/usr/bin/',
  './deb-struct/usr/lib/',
  './deb-struct/usr/share/applications/',
];

function getFilesFromPath(path, extension) {
  const files = readdirSync(path);

  return files.filter((file) => file.match(new RegExp(`.*.(${extension})`, 'ig')));
}

log('Packaging DiscordQt into a Debian package...');

paths.forEach((dir) => mkdirSync(dir, { recursive: true }));
paths.forEach((dir) => execSync(`rm -rf ${dir}*`));

log('Copying control...');
execSync('cp ./control ./deb-struct/DEBIAN/control');

log('Copying build directory...');
execSync(`cp -R '${BUILD_DIR}' '${LIB_DIR}'`);
execSync(`cp -R ./assets './deb-struct/usr/lib/${appName}'`);
execSync(`mv './deb-struct/usr/lib/${appName}' ./deb-struct/usr/lib/${safeName}`);

log('Copying symlink...');
execSync(`ln -s /usr/lib/${safeName}/qode '${BIN_DIR}'`);

log('Copying .desktop file...');
const from = join(BUILD_DIR, getFilesFromPath(BUILD_DIR, '.desktop')[0]);
const to = join(__dirname, 'deb-struct/usr/share/applications/', `${safeName}.desktop`)

execSync(`cp '${from}' '${to}'`);

log('Generating Debian package...');
execSync('dpkg-deb --build deb-struct');
execSync(`mv deb-struct.deb ${safeName}.deb`);
