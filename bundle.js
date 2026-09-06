const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const htmlPath = path.join(srcDir, 'index.html');
const cssPath = path.join(srcDir, 'style.css');
const logicPath = path.join(srcDir, 'logic.js');
const appPath = path.join(srcDir, 'app.js');

const targetPath = '/Users/petermangin/.gemini/antigravity/brain/cd34f85e-68e9-4f94-8cab-e9e397729e68/sequence_demo.html';

let html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const logic = fs.readFileSync(logicPath, 'utf8');
const app = fs.readFileSync(appPath, 'utf8');

// Replace CSS
const linkTag = '<link rel="stylesheet" href="style.css">';
if (!html.includes(linkTag)) {
  console.error('ERROR: index.html does not contain', linkTag);
  process.exit(1);
}
html = html.replace(linkTag, () => `<style>\n${css}\n</style>`);

// Replace logic.js
const logicTag = '<script src="logic.js"></script>';
if (!html.includes(logicTag)) {
  console.error('ERROR: index.html does not contain', logicTag);
  process.exit(1);
}
html = html.replace(logicTag, () => `<script>\n${logic}\n</script>`);

// Replace app.js
const appTag = '<script src="app.js"></script>';
if (!html.includes(appTag)) {
  console.error('ERROR: index.html does not contain', appTag);
  process.exit(1);
}
html = html.replace(appTag, () => `<script>\n${app}\n</script>`);

fs.writeFileSync(targetPath, html, 'utf8');

console.log('Build completed successfully!');
console.log('Target file:', targetPath);
console.log('Output size:', (html.length / 1024).toFixed(1), 'KB');
console.log('Contains <style>:', html.includes('<style>'));
console.log('Contains <script>:', html.includes('<script>'));
console.log('Contains board-felt-container:', html.includes('board-felt-container'));
