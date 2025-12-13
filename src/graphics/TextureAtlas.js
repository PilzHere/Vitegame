/**
 * TextureAtlas - Manages sprite sheets and texture atlases
 * Allows efficient rendering of multiple sprites from a single texture
 * Supports JSON atlas definitions (compatible with TexturePacker, Shoebox, etc.)
 */
export default class TextureAtlas {
    #image;
    #frames = new Map(); // Map of frame name -> frame data
    #metadata = null;

    /**
     * Create a texture atlas
     * @param {HTMLImageElement} image - The atlas texture image
     * @param {Object} atlasData - Atlas definition (JSON format)
     */
    constructor(image, atlasData = null) {
        this.#image = image;

        if (atlasData) {
            this.#parseAtlasData(atlasData);
        }
    }

    /**
     * Parse atlas data in JSON format
     * Supports formats from TexturePacker, Shoebox, and custom formats
     */
    #parseAtlasData(data) {
        // Store metadata
        this.#metadata = data.meta || {};

        // Parse frames
        if (data.frames) {
            // Handle array format
            if (Array.isArray(data.frames)) {
                data.frames.forEach(frame => {
                    this.#frames.set(frame.filename || frame.name, {
                        x: frame.frame.x,
                        y: frame.frame.y,
                        w: frame.frame.w,
                        h: frame.frame.h,
                        rotated: frame.rotated || false,
                        trimmed: frame.trimmed || false,
                        spriteSourceSize: frame.spriteSourceSize || { x: 0, y: 0, w: frame.frame.w, h: frame.frame.h },
                        sourceSize: frame.sourceSize || { w: frame.frame.w, h: frame.frame.h }
                    });
                });
            }
            // Handle object format (TexturePacker JSON Hash format)
            else {
                Object.keys(data.frames).forEach(name => {
                    const frame = data.frames[name];
                    this.#frames.set(name, {
                        x: frame.frame.x,
                        y: frame.frame.y,
                        w: frame.frame.w,
                        h: frame.frame.h,
                        rotated: frame.rotated || false,
                        trimmed: frame.trimmed || false,
                        spriteSourceSize: frame.spriteSourceSize || { x: 0, y: 0, w: frame.frame.w, h: frame.frame.h },
                        sourceSize: frame.sourceSize || { w: frame.frame.w, h: frame.frame.h }
                    });
                });
            }
        }
    }

    /**
     * Manually add a sprite frame
     * @param {string} name - Frame name/identifier
     * @param {number} x - X position in atlas
     * @param {number} y - Y position in atlas
     * @param {number} w - Width
     * @param {number} h - Height
     */
    addFrame(name, x, y, w, h) {
        this.#frames.set(name, {
            x, y, w, h,
            rotated: false,
            trimmed: false,
            spriteSourceSize: { x: 0, y: 0, w, h },
            sourceSize: { w, h }
        });
    }

    /**
     * Add frames from a grid layout (sprite sheet)
     * @param {number} frameWidth - Width of each frame
     * @param {number} frameHeight - Height of each frame
     * @param {number} spacing - Spacing between frames (default: 0)
     * @param {number} margin - Margin around the sprite sheet (default: 0)
     * @param {string} namePrefix - Prefix for frame names (default: 'frame')
     */
    addFramesFromGrid(frameWidth, frameHeight, spacing = 0, margin = 0, namePrefix = 'frame') {
        const cols = Math.floor((this.#image.width - margin * 2 + spacing) / (frameWidth + spacing));
        const rows = Math.floor((this.#image.height - margin * 2 + spacing) / (frameHeight + spacing));

        let frameIndex = 0;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = margin + col * (frameWidth + spacing);
                const y = margin + row * (frameHeight + spacing);

                this.addFrame(`${namePrefix}_${frameIndex}`, x, y, frameWidth, frameHeight);
                frameIndex++;
            }
        }

        return frameIndex; // Return total number of frames added
    }

    /**
     * Get frame data by name
     * @param {string} name - Frame name
     * @returns {Object|null} Frame data or null if not found
     */
    getFrame(name) {
        return this.#frames.get(name) || null;
    }

    /**
     * Get all frame names
     * @returns {string[]} Array of frame names
     */
    getFrameNames() {
        return Array.from(this.#frames.keys());
    }

    /**
     * Check if frame exists
     * @param {string} name - Frame name
     * @returns {boolean} True if frame exists
     */
    hasFrame(name) {
        return this.#frames.has(name);
    }

    /**
     * Get the atlas image
     * @returns {HTMLImageElement} The atlas texture
     */
    get image() {
        return this.#image;
    }

    /**
     * Get frame count
     * @returns {number} Number of frames
     */
    get frameCount() {
        return this.#frames.size;
    }

    /**
     * Get metadata
     * @returns {Object|null} Atlas metadata
     */
    get metadata() {
        return this.#metadata;
    }

    /**
     * Draw a frame to a canvas context
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
     * @param {string} frameName - Name of frame to draw
     * @param {number} dx - Destination X
     * @param {number} dy - Destination Y
     * @param {number} [dw] - Destination width (optional, uses frame width if not specified)
     * @param {number} [dh] - Destination height (optional, uses frame height if not specified)
     * @param {number} [alpha=1.0] - Opacity (0-1)
     * @param {number} [rotation=0] - Rotation in radians
     * @returns {boolean} True if drawn successfully
     */
    drawFrame(ctx, frameName, dx, dy, dw = null, dh = null, alpha = 1.0, rotation = 0) {
        const frame = this.getFrame(frameName);
        if (!frame) {
            console.warn(`Frame "${frameName}" not found in atlas`);
            return false;
        }

        // Use frame dimensions if not specified
        const width = dw !== null ? dw : frame.w;
        const height = dh !== null ? dh : frame.h;

        ctx.save();

        // Set opacity
        if (alpha < 1.0) {
            ctx.globalAlpha = alpha;
        }

        // Apply rotation if needed
        if (rotation !== 0) {
            ctx.translate(dx + width / 2, dy + height / 2);
            ctx.rotate(rotation);
            ctx.translate(-(dx + width / 2), -(dy + height / 2));
        }

        // Draw the frame
        ctx.drawImage(
            this.#image,
            frame.x, frame.y, frame.w, frame.h, // Source
            dx, dy, width, height                // Destination
        );

        ctx.restore();
        return true;
    }

    /**
     * Create animation sequence from frame names
     * @param {string} prefix - Frame name prefix (e.g., 'walk_')
     * @param {number} start - Start index
     * @param {number} end - End index
     * @returns {string[]} Array of frame names for animation
     */
    createAnimationSequence(prefix, start, end) {
        const sequence = [];
        for (let i = start; i <= end; i++) {
            const frameName = `${prefix}${i}`;
            if (this.hasFrame(frameName)) {
                sequence.push(frameName);
            }
        }
        return sequence;
    }

    /**
     * Get all frames matching a pattern
     * @param {RegExp|string} pattern - Pattern to match (regex or string prefix)
     * @returns {string[]} Array of matching frame names
     */
    getFramesMatching(pattern) {
        const regex = typeof pattern === 'string' ? new RegExp(`^${pattern}`) : pattern;
        return this.getFrameNames().filter(name => regex.test(name));
    }

    /**
     * Clone this atlas (shares the same image but allows independent frame definitions)
     * @returns {TextureAtlas} New atlas instance
     */
    clone() {
        const atlas = new TextureAtlas(this.#image);
        this.#frames.forEach((frame, name) => {
            atlas.#frames.set(name, { ...frame });
        });
        atlas.#metadata = this.#metadata ? { ...this.#metadata } : null;
        return atlas;
    }

    /**
     * Debug: Draw all frames with labels
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} [scale=1] - Scale factor
     */
    debugDrawAllFrames(ctx, scale = 1) {
        let x = 10;
        let y = 10;
        const maxWidth = 800;

        this.#frames.forEach((frame, name) => {
            const width = frame.w * scale;
            const height = frame.h * scale;

            // Wrap to next row if needed
            if (x + width > maxWidth) {
                x = 10;
                y += 100 * scale;
            }

            // Draw frame
            ctx.drawImage(
                this.#image,
                frame.x, frame.y, frame.w, frame.h,
                x, y, width, height
            );

            // Draw border
            ctx.strokeStyle = 'red';
            ctx.strokeRect(x, y, width, height);

            // Draw label
            ctx.fillStyle = 'white';
            ctx.font = '10px monospace';
            ctx.fillText(name, x, y - 2);

            x += width + 10;
        });
    }
}
