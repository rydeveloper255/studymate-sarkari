const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'dist', 'server.cjs');

if (!fs.existsSync(serverPath)) {
  console.log('[StudyMate Server] dist/server.cjs not found! Running build...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (err) {
    console.error('[StudyMate Server] Build failed with npm, trying bun...', err);
    try {
      execSync('bun run build', { stdio: 'inherit' });
    } catch (bunErr) {
      console.error('[StudyMate Server] Fatal build failure:', bunErr);
      process.exit(1);
    }
  }
}

if (!fs.existsSync(serverPath)) {
  console.error('[StudyMate Server] FATAL: dist/server.cjs still not found after build!');
  process.exit(1);
}

console.log('[StudyMate Server] Starting server from dist/server.cjs...');
require(serverPath);
