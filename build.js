const fs = require('fs');

const getContents = path => require('child_process').execSync(`cat ${path}`).toString();

const header = getContents('./src/header.js');

// The inclusion order is important.
const includes = ['globals.js', 'helpers.js', 'ui.js']
  .map(fn => getContents(`./src/includes/${fn}`))
  .join('\n');
const main = getContents('./src/main.js');

if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

const data = header + includes + main;

fs.writeFileSync('dist/build.user.js', data);
