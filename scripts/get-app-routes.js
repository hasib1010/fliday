const fs = require('fs');
const path = require('path');

const appDir = path.resolve(__dirname, '../src/app');


function getRoutes(dir = '', prefix = '') {
  const fullPath = path.join(appDir, dir);

  if (!fs.existsSync(fullPath)) {
    console.warn('⚠️ Folder does not exist:', fullPath);
    return [];
  }

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  let routes = [];

  for (const entry of entries) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

    const entryPath = path.join(dir, entry.name);
    const nextPrefix = prefix + '/' + entry.name;

    if (entry.isDirectory()) {
      routes = routes.concat(getRoutes(entryPath, nextPrefix));
    } else if (
      entry.name === 'page.tsx' ||
      entry.name === 'page.jsx' ||
      entry.name === 'page.js' ||
      entry.name === 'page.ts'
    ) {
      const cleanPath = prefix
        .replace(/\/\(([^)]+)\)/g, '')       // remove parallel segments
        .replace(/\[([^\]]+)\]/g, ':$1')     // convert [slug] to :slug
        .replace(/\/page$/, '')              // remove trailing /page
        .replace(/\/$/, '') || '/';

      console.log('✅ Found page:', cleanPath);
      routes.push(cleanPath);
    }
  }

  return routes;
}

const routes = getRoutes();

// Final output
if (routes.length === 0) {
  console.log('⚠️ No routes found. Check your app/ folder structure.');
} else {
  console.log('\n📦 All Routes:\n' + routes.sort().join('\n'));
}
