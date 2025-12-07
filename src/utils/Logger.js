export default class Logger {
    static #includeDate = false;
    static #enabledLevels = new Set(
        // Automatically disable debug logs in production/release builds
        __BUILD_TYPE__ === 'Development'
            ? ['I', 'E', 'D', 'W', 'S']
            : ['I', 'E', 'W', 'S']
    );

    /**
     * Configure logger settings
     * @param {Object} options - Configuration options
     * @param {boolean} options.includeDate - Whether to include date in timestamps
     * @param {string[]} options.levels - Array of enabled log levels (I, E, D, W, S)
     */
    static configure(options = {}) {
        if (options.includeDate !== undefined) {
            this.#includeDate = options.includeDate;
        }
        if (options.levels !== undefined) {
            this.#enabledLevels = new Set(options.levels);
        }
    }

    /**
     * Format timestamp based on configuration
     * @returns {string} Formatted timestamp
     */
    static #getTimestamp() {
        const now = new Date();

        if (this.#includeDate) {
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const ms = String(now.getMilliseconds()).padStart(3, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
        } else {
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const ms = String(now.getMilliseconds()).padStart(3, '0');
            return `${hours}:${minutes}:${seconds}.${ms}`;
        }
    }

    /**
     * Generic log method
     * @param {string} level - Log level indicator (I, E, D, W, S)
     * @param {string} message - Message to log
     * @param {*} data - Optional data to log
     */
    static #log(level, message, data = null) {
        if (!this.#enabledLevels.has(level)) return;

        const timestamp = this.#getTimestamp();

        // Choose console method and color based on level
        let consoleMethod = console.log;
        let color = 'inherit';

        switch (level) {
            case 'E':
                consoleMethod = console.error;
                color = '#ff4444';
                break;
            case 'W':
                consoleMethod = console.warn;
                color = '#ffaa00';
                break;
            case 'D':
                color = '#888888';
                break;
            case 'S':
                color = '#44ff44';
                break;
            case 'I':
                color = '#4444ff';
                break;
        }

        if (data !== null) {
            consoleMethod(`%c[${level}]%c ${timestamp} ${message}`, `color: ${color}; font-weight: bold`, 'color: inherit', data);
        } else {
            consoleMethod(`%c[${level}]%c ${timestamp} ${message}`, `color: ${color}; font-weight: bold`, 'color: inherit');
        }
    }

    /**
     * Log info message
     * @param {string} message - Message to log
     * @param {*} data - Optional data to log
     */
    static info(message, data = null) {
        this.#log('I', message, data);
    }

    /**
     * Log error message
     * @param {string} message - Message to log
     * @param {*} data - Optional data to log
     */
    static error(message, data = null) {
        this.#log('E', message, data);
    }

    /**
     * Log debug message
     * @param {string} message - Message to log
     * @param {*} data - Optional data to log
     */
    static debug(message, data = null) {
        this.#log('D', message, data);
    }

    /**
     * Log warning message
     * @param {string} message - Message to log
     * @param {*} data - Optional data to log
     */
    static warn(message, data = null) {
        this.#log('W', message, data);
    }

    /**
     * Log success message
     * @param {string} message - Message to log
     * @param {*} data - Optional data to log
     */
    static success(message, data = null) {
        this.#log('S', message, data);
    }
}
