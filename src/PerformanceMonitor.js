export default class PerformanceMonitor {
    // Public
    renderer;
    sceneManager;

    // Private
    #element;
    #browserInfoElement;
    #frameIndex = 0;
    #frameCount = 0;
    #frames = new Array(60).fill(0);
    #updateInterval = 0.00; // (0.10) Update display 10 times per second
    #timeSinceUpdate = 0;
    #displayStats = true;
    #gpuVendor;
    #gpuRenderer;
    #cpuCores;
    #platform;
    #browserName;
    #browserVersion;
    #api;
    #antialiasEnabled;
    #pixelRatio;
    #hasTouch;
    #startTime;
    #chartCanvas;
    #chartCtx;
    #fpsHistory = [];
    #maxHistoryLength = 300;
    #maxFPSReached = 60;
    #numberFormatter = new Intl.NumberFormat('en-US');
    #MB = 1024 * 1024;

    constructor(renderer, sceneManager) {
        this.renderer = renderer;
        this.sceneManager = sceneManager;
        this.#element = document.getElementById('performance-monitor');
        this.#browserInfoElement = document.getElementById('browser-info');

        // Collect static system info once
        const gl = this.renderer.renderer.getContext();

        // GPU info
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        this.#gpuVendor = 'Unknown';
        this.#gpuRenderer = 'Unknown';
        if (debugInfo) {
            this.#gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            this.#gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }

        // System info
        this.#cpuCores = navigator.hardwareConcurrency || 'Unknown';

        // Platform detection using modern approach (navigator.platform is deprecated)
        this.#platform = this.#detectPlatform();

        // Browser info
        const { name, version } = this.#detectBrowser();
        this.#browserName = name;
        this.#browserVersion = version;

        // Renderer info
        this.#api = this.renderer.renderer.capabilities.isWebGL2 ? 'WebGL2' : 'WebGL1';
        this.#antialiasEnabled = gl.getContextAttributes().antialias;
        this.#pixelRatio = this.renderer.renderer.getPixelRatio();

        // Device info
        this.#hasTouch = navigator.maxTouchPoints > 0 ? 'Yes' : 'No';

        // Track start time for uptime
        this.#startTime = performance.now();

        // FPS Chart setup
        this.#chartCanvas = document.createElement('canvas');
        this.#chartCanvas.width = window.innerWidth;
        this.#chartCanvas.height = 100;

        // Apply styles efficiently with Object.assign
        Object.assign(this.#chartCanvas.style, {
            position: 'absolute',
            bottom: '0px',
            left: '0px',
            width: '100%',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            zIndex: '1001'
        });

        document.body.appendChild(this.#chartCanvas);
        this.#chartCtx = this.#chartCanvas.getContext('2d');

        // Handle window resize for chart canvas
        window.addEventListener('resize', () => {
            this.#chartCanvas.width = window.innerWidth;
        });
    }

    /**
     * Detects browser name and version
     * @returns {{name: string, version: string}}
     */
    #detectBrowser() {
        const ua = navigator.userAgent;

        const browsers = [
            {
                check: () => ua.includes('Edg/'),
                name: 'Edge',
                version: () => {
                    const edgeVersion = ua.match(/Edg\/(\d+\.\d+)/)?.[1];
                    return edgeVersion ? `${edgeVersion} (Chromium)` : '?';
                }
            },
            {
                check: () => ua.includes('OPR/') || ua.includes('Opera/'),
                name: 'Opera',
                version: () => {
                    const operaVersion = ua.match(/(?:OPR|Opera)\/(\d+\.\d+)/)?.[1];
                    const chromiumVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1];
                    return operaVersion && chromiumVersion ? `${operaVersion} (Chromium ${chromiumVersion})` : '?';
                }
            },
            {
                check: () => ua.includes('Vivaldi/'),
                name: 'Vivaldi',
                version: () => {
                    const vivaldiVersion = ua.match(/Vivaldi\/(\d+\.\d+)/)?.[1];
                    const chromiumVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1];
                    return vivaldiVersion && chromiumVersion ? `${vivaldiVersion} (Chromium ${chromiumVersion})` : '?';
                }
            },
            {
                check: () => ua.includes('Brave/') || (navigator.brave && typeof navigator.brave.isBrave === 'function'),
                name: 'Brave',
                version: () => {
                    const chromiumVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1];
                    return chromiumVersion ? `(Chromium ${chromiumVersion})` : '?';
                }
            },
            {
                check: () => ua.includes('Firefox/'),
                name: 'Firefox',
                version: () => ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || '?'
            },
            {
                check: () => ua.includes('Chrome/') && !ua.includes('Chromium/'),
                name: 'Chrome',
                version: () => ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || '?'
            },
            {
                check: () => ua.includes('Chromium/'),
                name: 'Chromium',
                version: () => ua.match(/Chromium\/(\d+\.\d+)/)?.[1] || '?'
            },
            {
                check: () => ua.includes('Safari/'),
                name: 'Safari',
                version: () => ua.match(/Version\/(\d+\.\d+)/)?.[1] || '?'
            }
        ];

        for (const browser of browsers) {
            if (browser.check()) {
                return { name: browser.name, version: browser.version() };
            }
        }

        return { name: 'Unknown', version: 'Unknown' };
    }

    /**
     * Detects platform with architecture (32-bit/64-bit) using User-Agent parsing
     * @returns {string} Platform name with architecture
     */
    #detectPlatform() {
        const ua = navigator.userAgent;

        // Detect architecture
        const is64bit = ua.includes('x64') || ua.includes('x86_64') || ua.includes('Win64') ||
                       ua.includes('WOW64') || ua.includes('amd64') || ua.includes('arm64') ||
                       ua.includes('aarch64') || navigator.maxTouchPoints > 0 && ua.includes('Mac');

        const arch = is64bit ? ' (64-bit)' : ' (32-bit)';

        // Check for specific platforms
        if (ua.includes('Win')) return 'Windows' + arch;
        if (ua.includes('Mac')) {
            // Apple Silicon Macs are always 64-bit
            return ua.includes('arm64') || ua.includes('aarch64') ? 'macOS (ARM64)' : 'macOS' + arch;
        }
        if (ua.includes('Linux')) {
            // Distinguish between different Linux distributions if possible
            if (ua.includes('Android')) return 'Android';
            if (ua.includes('CrOS')) return 'Chrome OS';
            return 'Linux' + arch;
        }
        if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) return 'iOS';
        if (ua.includes('Android')) return 'Android';

        // Fallback to deprecated API only if nothing else matches
        // @ts-ignore - navigator.platform is deprecated but used as last resort
        return navigator.platform || 'Unknown';
    }

    formatNumber(num) {
        return this.#numberFormatter.format(num);
    }

    /**
     * Draws the FPS chart on the canvas
     */
    drawChart() {
        const ctx = this.#chartCtx;
        const width = this.#chartCanvas.width;
        const height = this.#chartCanvas.height;
        const padding = 5;
        const graphHeight = height - (padding * 2);
        const graphWidth = width - (padding * 2);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw background grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Use dynamic max FPS (highest reached so far, with a minimum of 60)
        const maxFPS = Math.max(this.#maxFPSReached, 60);

        // Calculate grid markers: 30, 60, 120, 240, 480
        const fpsMarkers = [30, 60, 120, 240, 480].filter(fps => fps <= maxFPS);

        fpsMarkers.forEach(fps => {
            const y = padding + graphHeight - (fps / maxFPS) * graphHeight;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();

            // Draw FPS label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '10px monospace';
            ctx.fillText(fps.toString(), padding + 2, y - 2);
        });

        if (this.#fpsHistory.length < 2) return;

        // Draw FPS line
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        this.#fpsHistory.forEach((fps, i) => {
            const x = padding + (i / this.#maxHistoryLength) * graphWidth;
            const clampedFPS = Math.min(fps, maxFPS);
            const y = padding + graphHeight - (clampedFPS / maxFPS) * graphHeight;

            // Color based on FPS
            if (fps >= 60) {
                ctx.strokeStyle = '#00ff00'; // Green
            } else if (fps >= 30) {
                ctx.strokeStyle = '#ffff00'; // Yellow
            } else {
                ctx.strokeStyle = '#ff0000'; // Red
            }

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw current FPS text
        const currentFPS = this.#fpsHistory[this.#fpsHistory.length - 1];
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`${currentFPS} FPS`, width - 70, 20);
    }

    /**
     * Updates render statistics display
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        // Store frame times using circular buffer (more efficient than shift/push)
        this.#frames[this.#frameIndex] = dt * 1000;
        this.#frameIndex = (this.#frameIndex + 1) % 60;
        if (this.#frameCount < 60) this.#frameCount++;

        // Update display at interval
        this.#timeSinceUpdate += dt;
        if (this.#timeSinceUpdate >= this.#updateInterval) {
            this.#timeSinceUpdate = 0;

            // Calculate average FPS from circular buffer
            let sum = 0;
            for (let i = 0; i < this.#frameCount; i++) {
                sum += this.#frames[i];
            }
            const averageFrameTime = sum / this.#frameCount;
            const fps = Math.round(1000 / averageFrameTime);

            // Store FPS for chart (always update, even when hidden)
            this.#fpsHistory.push(fps);
            if (this.#fpsHistory.length > this.#maxHistoryLength) {
                this.#fpsHistory.shift();
            }

            // Track max FPS reached
            if (fps > this.#maxFPSReached) {
                this.#maxFPSReached = fps;
            }

            // Clear display if stats are hidden
            if (!this.#displayStats) {
                this.#element.textContent = '';
                // Clear chart canvas when hidden
                this.#chartCtx.clearRect(0, 0, this.#chartCanvas.width, this.#chartCanvas.height);
                return;
            }

            // Draw FPS chart
            this.drawChart();

            // Get dynamic renderer info
            const info = this.renderer.renderer.info;
            const memory = info.memory;
            const render = info.render;
            const canvas = this.renderer.renderer.domElement;
            const camera = this.renderer.camera;

            // Get dynamic memory info (Chrome/Edge only) - use cached MB constant
            let memoryInfo = 'N/A';
            if (performance.memory) {
                const usedMB = (performance.memory.usedJSHeapSize / this.#MB).toFixed(1);
                const limitMB = (performance.memory.jsHeapSizeLimit / this.#MB).toFixed(0);
                const percentage = ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(0);
                memoryInfo = `${usedMB}MB / ${limitMB}MB ${percentage}%`;
            }

            // Calculate uptime
            const uptimeSeconds = Math.floor((performance.now() - this.#startTime) / 1000);
            const uptimeMinutes = Math.floor(uptimeSeconds / 60);
            const uptimeHours = Math.floor(uptimeMinutes / 60);
            let uptime;
            if (uptimeHours > 0) {
                uptime = `${uptimeHours}h ${uptimeMinutes % 60}m`;
            } else if (uptimeMinutes > 0) {
                uptime = `${uptimeMinutes}m ${uptimeSeconds % 60}s`;
            } else {
                uptime = `${uptimeSeconds}s`;
            }

            // Build stats display
            const stats = [
                `${__APP_NAME__.toUpperCase()} v${__APP_VERSION__} ${__APP_STATE__.toUpperCase()}`,
                `${__BUILD_TYPE__} ${__BUILD_NUMBER__} #${__GIT_HASH__}`,
                'RENDERER',
                ` FPS: ${fps}`,
                ` Frame time: ${averageFrameTime.toFixed(2)}ms`,
                ` Drawcalls: ${render.calls}`,
                ` Triangles: ${this.formatNumber(render.triangles)}`,
                ` Shaders: ${info.programs.length}`,
                ` Textures: ${memory.textures}`,
                ` Geometries: ${memory.geometries}`,
                ` Lines: ${this.formatNumber(render.lines)}`,
                ` Points: ${this.formatNumber(render.points)}`,
                '',
                ` Resolution: ${canvas.width}x${canvas.height}`,
                ` Viewport: ${window.innerWidth}x${window.innerHeight}`,
                ` Pixel ratio: ${this.#pixelRatio.toFixed(1)}`,
                ` Frame: ${render.frame}`,
                ` AA: ${this.#antialiasEnabled ? 'On' : 'Off'}`,
                ` API: ${this.#api}`,
                'CAMERA',
                ` Pos: ${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}`,
                ` Rot: ${(camera.rotation.x * 180 / Math.PI).toFixed(1)}°, ${(camera.rotation.y * 180 / Math.PI).toFixed(1)}°, ${(camera.rotation.z * 180 / Math.PI).toFixed(1)}°`,
                'DATA',
                ` Entities: ${this.sceneManager.getEntityCount()}`,
                ` Bodies: ${this.sceneManager.world.bodies.length}`,
                ` Uptime: ${uptime}`,
                '',
                'SYSTEM',
                ` OS: ${this.#platform}`,
                ` CPU Cores: ${this.#cpuCores}`,
                ' GPU',
                `  Renderer: ${this.#gpuRenderer}`,
                `  Vendor: ${this.#gpuVendor}`,
                ` Touch: ${this.#hasTouch}`,
                '',
            ];

            this.#element.textContent = stats.join('\n');

            // Display browser info in upper right
            const browserStats = [
                'BROWSER',
                `${this.#browserName} ${this.#browserVersion}`,
                `Heap: ${memoryInfo}`,
            ];
            this.#browserInfoElement.textContent = browserStats.join('\n');
        }
    }

    toggle() {
        this.#displayStats = !this.#displayStats;
        this.#chartCanvas.style.display = this.#displayStats ? 'block' : 'none';
    }
}