import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

export default defineConfig({
    base: process.env.NODE_ENV === 'production' ? '/Vitegame/' : '/',
    root: '.',
    define: {
        // Dev indicator - set at build time
        __BUILD_TYPE__: JSON.stringify(process.env.NODE_ENV !== 'production' ? 'Development' : 'Release'),
        // Inject version from package.json
        __APP_VERSION__: JSON.stringify(
            JSON.parse(readFileSync('./package.json', 'utf-8')).version
        ),
        __APP_NAME__: JSON.stringify(
            JSON.parse(readFileSync('./package.json', 'utf-8')).name
        ),
        __APP_STATE__: JSON.stringify(
            JSON.parse(readFileSync('./package.json', 'utf-8')).state
        ),
        // Generate build number as timestamp: YYYYMMDDHHMMSS
        __BUILD_NUMBER__: JSON.stringify(
            (() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hour = String(now.getHours()).padStart(2, '0');
                const minute = String(now.getMinutes()).padStart(2, '0');
                const second = String(now.getSeconds()).padStart(2, '0');
                return `${year}${month}${day}${hour}${minute}${second}`;
            })()
        ),
        // Git commit hash (short)
        __GIT_HASH__: JSON.stringify(
            (() => {
                try {
                    return execSync('git rev-parse --short HEAD').toString().trim();
                } catch (e) {
                    return 'hash';
                }
            })()
        ),
        // Git branch name
        __GIT_BRANCH__: JSON.stringify(
            (() => {
                try {
                    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
                } catch (e) {
                    return 'branch';
                }
            })()
        ),
        // Build timestamp
        __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    }
});