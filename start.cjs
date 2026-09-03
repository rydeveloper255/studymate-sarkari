const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'dist', 'server.cjs');

if (!fs.existsSync(serverPath)) {
  console.log('[StudyMate Server] dist/server.cjs not found in deployment container. Running build now...');
  try {
    execSync('npx vite build && npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs', {
      stdio: 'inherit',
      cwd: __dirname,
    });
  } catch (err) {
    console.warn('[StudyMate Server] npx build attempt resulted in error, trying npm run build...', err.message);
    try {
      execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
    } catch (npmErr) {
      console.error('[StudyMate Server] Fatal build failure:', npmErr.message);
      process.exit(1);
    }
  }
}

if (!fs.existsSync(serverPath)) {
  console.error('[StudyMate Server] FATAL: dist/server.cjs still not found after build!');
  process.exit(1);
}

console.log('[StudyMate Server] Launching application from dist/server.cjs...');
require(serverPath);

