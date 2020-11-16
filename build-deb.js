const path = require('path');
const fs = require('fs');
const process = require('child_process');

const CONFIG_FILE = path.join(__dirname, 'deploy', 'config.json');
const { appName } = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
const safeAppName = appName.replace(' ', '').toLowerCase();

const BUILD_DIR = path.join(__dirname, 'deploy', 'linux', 'build', appName);
const LIB_DIR = path.join(__dirname, 'deb-struct', 'usr', 'lib');
const BIN_DIR = path.join(__dirname, 'deb-struct', 'usr', 'bin', appName);
const paths = [
  './deb-struct/DEBIAN/',
  './deb-struct/usr/bin/',
  './deb-struct/usr/lib/',
  './deb-struct/usr/share/applications/',
];

function getFilesFromPath(path, extension) {
  const files = fs.readdirSync(path);

  return files.filter(file => file.match(new RegExp(`.*\.(${extension})`, 'ig')));
}

console.log('Packaging DiscordQt into a Debian package...');

paths.forEach(dir => fs.mkdirSync(dir, {recursive: true}));
paths.forEach(dir => process.execSync(`rm -rf ${dir}*`));

console.log('Copying control...');
process.execSync('cp ./control ./deb-struct/DEBIAN/control');

console.log('Copying build directory...');
process.execSync(`cp -R '${BUILD_DIR}' '${LIB_DIR}'`);
process.execSync(`cp -R ./assets './deb-struct/usr/lib/${appName}'`);
process.execSync(`mv './deb-struct/usr/lib/${appName}' ./deb-struct/usr/lib/${safeAppName}`);

console.log('Copying symlink...');
process.execSync(`ln -s /usr/lib/${safeAppName}/qode '${BIN_DIR}'`);

console.log('Copying .desktop file...');
const from = path.join(BUILD_DIR, getFilesFromPath(BUILD_DIR, '.desktop')[0]);
const to = path.join(__dirname, 'deb-struct/usr/share/applications/', `${safeAppName  }.desktop`)

process.execSync(`cp '${from}' '${to}'`);

console.log('Generating Debian package...');
process.execSync('dpkg-deb --build deb-struct');
process.execSync(`mv deb-struct.deb ${safeAppName}.deb`);
