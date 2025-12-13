import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const gitHash = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'hash';
  }
})();

const gitBranch = (() => {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch {
    return 'branch';
  }
})();

const buildNumber = (() => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0')
  ].join('');
})();

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/Vitegame/' : '/',
  root: '.',

  build: {
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    },

  define: {
    __BUILD_TYPE__: JSON.stringify(mode === 'production' ? 'Release' : 'Development'),
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_NAME__: JSON.stringify(pkg.name),
    __APP_STATE__: JSON.stringify(pkg.state),
    __BUILD_NUMBER__: JSON.stringify(buildNumber),
    __GIT_HASH__: JSON.stringify(gitHash),
    __GIT_BRANCH__: JSON.stringify(gitBranch),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
}));