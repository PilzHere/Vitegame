/**
 * 2D UI Renderer using Canvas 2D API
 * Renders sprites, text, and GUI elements on top of the 3D scene
 * Provides batching for efficient sprite rendering
 */
export default class UIRenderer {
    #canvas;
    #ctx;
    #width;
    #height;
    #pixelRatio;
    #sprites = [];
    #visible = true;

    constructor() {
        // Create 2D canvas overlay
        this.#canvas = document.createElement('canvas');
        this.#canvas.id = 'ui-canvas';
        this.#canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 100;
        `;
        document.body.appendChild(this.#canvas);

        this.#ctx = this.#canvas.getContext('2d', {
            alpha: true, // Support transparency
            desynchronized: true // Hint for better performance
        });

        // Set initial size
        this.#resize();

        // Handle window resize
        window.addEventListener('resize', () => this.#resize());
    }

    #resize() {
        this.#width = window.innerWidth;
        this.#height = window.innerHeight;
        this.#pixelRatio = window.devicePixelRatio || 1;

        // Set canvas size (accounting for pixel ratio for sharp rendering)
        this.#canvas.width = this.#width * this.#pixelRatio;
        this.#canvas.height = this.#height * this.#pixelRatio;

        // Set display size
        this.#canvas.style.width = `${this.#width}px`;
        this.#canvas.style.height = `${this.#height}px`;

        // Scale context to account for pixel ratio
        this.#ctx.scale(this.#pixelRatio, this.#pixelRatio);

        // Disable image smoothing for pixel-perfect rendering (optional)
        this.#ctx.imageSmoothingEnabled = false;
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.#ctx.clearRect(0, 0, this.#width, this.#height);
    }

    /**
     * Draw a frame from a texture atlas
     * @param {TextureAtlas} atlas - Texture atlas
     * @param {string} frameName - Frame name
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     * @param {number} [width] - Display width (optional, uses frame width)
     * @param {number} [height] - Display height (optional, uses frame height)
     * @param {number} [alpha=1.0] - Opacity (0-1)
     * @param {number} [rotation=0] - Rotation in radians
     * @returns {boolean} True if drawn successfully
     */
    drawAtlasFrame(atlas, frameName, x, y, width = null, height = null, alpha = 1.0, rotation = 0) {
        if (!this.#visible) return false;
        return atlas.drawFrame(this.#ctx, frameName, x, y, width, height, alpha, rotation);
    }

    /**
     * Draw a sprite (batched)
     * @param {HTMLImageElement|HTMLCanvasElement} image - Sprite image or canvas
     * @param {number} sx - Source X (for sprite sheets)
     * @param {number} sy - Source Y (for sprite sheets)
     * @param {number} sw - Source width
     * @param {number} sh - Source height
     * @param {number} dx - Destination X (screen space)
     * @param {number} dy - Destination Y (screen space)
     * @param {number} dw - Destination width
     * @param {number} dh - Destination height
     * @param {number} [alpha=1.0] - Opacity (0-1)
     * @param {number} [rotation=0] - Rotation in radians
     */
    drawSprite(image, sx, sy, sw, sh, dx, dy, dw, dh, alpha = 1.0, rotation = 0) {
        if (!this.#visible) return;

        this.#ctx.save();

        // Set opacity
        if (alpha < 1.0) {
            this.#ctx.globalAlpha = alpha;
        }

        // Apply rotation if needed
        if (rotation !== 0) {
            this.#ctx.translate(dx + dw / 2, dy + dh / 2);
            this.#ctx.rotate(rotation);
            this.#ctx.translate(-(dx + dw / 2), -(dy + dh / 2));
        }

        // Draw sprite from sprite sheet
        this.#ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);

        this.#ctx.restore();
    }

    /**
     * Draw a simple sprite (no sprite sheet)
     * @param {HTMLImageElement|HTMLCanvasElement} image - Sprite image
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     * @param {number} width - Display width
     * @param {number} height - Display height
     * @param {number} [alpha=1.0] - Opacity (0-1)
     * @param {number} [rotation=0] - Rotation in radians
     */
    drawImage(image, x, y, width, height, alpha = 1.0, rotation = 0) {
        this.drawSprite(image, 0, 0, image.width, image.height, x, y, width, height, alpha, rotation);
    }

    /**
     * Draw text
     * @param {string} text - Text to render
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     * @param {string} [font='16px monospace'] - Font string
     * @param {string} [color='white'] - Fill color
     * @param {string} [align='left'] - Text alignment (left, center, right)
     * @param {string} [baseline='top'] - Text baseline (top, middle, bottom, alphabetic)
     * @param {number} [alpha=1.0] - Opacity (0-1)
     */
    drawText(text, x, y, font = '16px monospace', color = 'white', align = 'left', baseline = 'top', alpha = 1.0) {
        if (!this.#visible) return;

        this.#ctx.save();

        if (alpha < 1.0) {
            this.#ctx.globalAlpha = alpha;
        }

        this.#ctx.font = font;
        this.#ctx.fillStyle = color;
        this.#ctx.textAlign = align;
        this.#ctx.textBaseline = baseline;

        this.#ctx.fillText(text, x, y);

        this.#ctx.restore();
    }

    /**
     * Draw outlined text (with stroke)
     * @param {string} text - Text to render
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     * @param {string} [font='16px monospace'] - Font string
     * @param {string} [fillColor='white'] - Fill color
     * @param {string} [strokeColor='black'] - Stroke color
     * @param {number} [strokeWidth=2] - Stroke width
     * @param {string} [align='left'] - Text alignment
     * @param {string} [baseline='top'] - Text baseline
     */
    drawOutlinedText(text, x, y, font = '16px monospace', fillColor = 'white', strokeColor = 'black', strokeWidth = 2, align = 'left', baseline = 'top') {
        if (!this.#visible) return;

        this.#ctx.save();

        this.#ctx.font = font;
        this.#ctx.textAlign = align;
        this.#ctx.textBaseline = baseline;

        // Draw stroke
        this.#ctx.strokeStyle = strokeColor;
        this.#ctx.lineWidth = strokeWidth;
        this.#ctx.strokeText(text, x, y);

        // Draw fill
        this.#ctx.fillStyle = fillColor;
        this.#ctx.fillText(text, x, y);

        this.#ctx.restore();
    }

    /**
     * Draw a rectangle
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {string} [color='white'] - Fill color
     * @param {number} [alpha=1.0] - Opacity (0-1)
     */
    drawRect(x, y, width, height, color = 'white', alpha = 1.0) {
        if (!this.#visible) return;

        this.#ctx.save();

        if (alpha < 1.0) {
            this.#ctx.globalAlpha = alpha;
        }

        this.#ctx.fillStyle = color;
        this.#ctx.fillRect(x, y, width, height);

        this.#ctx.restore();
    }

    /**
     * Draw a rectangle outline
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {string} [color='white'] - Stroke color
     * @param {number} [lineWidth=1] - Line width
     * @param {number} [alpha=1.0] - Opacity (0-1)
     */
    drawRectOutline(x, y, width, height, color = 'white', lineWidth = 1, alpha = 1.0) {
        if (!this.#visible) return;

        this.#ctx.save();

        if (alpha < 1.0) {
            this.#ctx.globalAlpha = alpha;
        }

        this.#ctx.strokeStyle = color;
        this.#ctx.lineWidth = lineWidth;
        this.#ctx.strokeRect(x, y, width, height);

        this.#ctx.restore();
    }

    /**
     * Draw a circle
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} radius - Circle radius
     * @param {string} [color='white'] - Fill color
     * @param {number} [alpha=1.0] - Opacity (0-1)
     */
    drawCircle(x, y, radius, color = 'white', alpha = 1.0) {
        if (!this.#visible) return;

        this.#ctx.save();

        if (alpha < 1.0) {
            this.#ctx.globalAlpha = alpha;
        }

        this.#ctx.fillStyle = color;
        this.#ctx.beginPath();
        this.#ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.#ctx.fill();

        this.#ctx.restore();
    }

    /**
     * Render all UI elements
     * Called every frame from game loop
     */
    render() {
        if (!this.#visible) return;

        // Clear previous frame
        this.clear();

        // Render custom UI here (override in subclass or use callback)
        // This is called every frame, draw your UI elements here
    }

    /**
     * Show the UI canvas
     */
    show() {
        this.#visible = true;
        this.#canvas.style.display = 'block';
    }

    /**
     * Hide the UI canvas
     */
    hide() {
        this.#visible = false;
        this.#canvas.style.display = 'none';
    }

    /**
     * Toggle UI visibility
     */
    toggle() {
        if (this.#visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Get canvas context for custom drawing
     */
    get context() {
        return this.#ctx;
    }

    /**
     * Get canvas element
     */
    get canvas() {
        return this.#canvas;
    }

    /**
     * Get canvas width (logical pixels, not physical)
     */
    get width() {
        return this.#width;
    }

    /**
     * Get canvas height (logical pixels, not physical)
     */
    get height() {
        return this.#height;
    }

    /**
     * Cleanup resources
     */
    dispose() {
        window.removeEventListener('resize', this.#resize);
        this.#canvas.remove();
    }
}
