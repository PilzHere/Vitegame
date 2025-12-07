import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

export default defineConfig({
    root: '.',
    define: {
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
        // Generate build number from git commit count or timestamp
        __BUILD_NUMBER__: JSON.stringify(
            (() => {
                try {
                    // Try to get git commit count
                    return execSync('git rev-list --count HEAD').toString().trim();
                } catch (e) {
                    // Fallback to timestamp if not a git repo
                    return Date.now().toString();
                }
            })()
        ),
        // Git commit hash (short)
        __GIT_HASH__: JSON.stringify(
            (() => {
                try {
                    return execSync('git rev-parse --short HEAD').toString().trim();
                } catch (e) {
                    return 'unknown';
                }
            })()
        ),
        // Git branch name
        __GIT_BRANCH__: JSON.stringify(
            (() => {
                try {
                    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
                } catch (e) {
                    return 'unknown';
                }
            })()
        ),
        // Build timestamp
        __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    }
});