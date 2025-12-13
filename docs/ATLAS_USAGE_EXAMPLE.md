# TextureAtlas Usage Examples

## Overview
The `TextureAtlas` class allows you to efficiently pack multiple sprites into a single texture and draw specific regions. This reduces drawcalls and improves performance.

## Method 1: Using Grid-Based Sprite Sheet

```javascript
// In Game.js #loadAllStandardAssets()
const spriteSheetImage = new Image();
spriteSheetImage.src = '/path/to/spritesheet.png';
await spriteSheetImage.decode();

// Create atlas from grid (e.g., 16x16 tiles, 8 columns, 4 rows)
const atlas = new TextureAtlas(spriteSheetImage);
atlas.addFramesFromGrid(
    16,      // frame width
    16,      // frame height
    0,       // spacing between frames
    0,       // margin around sheet
    'tile'   // name prefix (generates: tile_0, tile_1, tile_2, etc.)
);

// Load via AssetLoader
await this.assetLoader.loadAtlas('ui-sprites', '/path/to/sprites.png', {
    // Manual frame definitions
    frames: {
        'button': { frame: { x: 0, y: 0, w: 64, h: 32 } },
        'health-icon': { frame: { x: 64, y: 0, w: 32, h: 32 } },
        'coin': { frame: { x: 96, y: 0, w: 16, h: 16 } }
    }
});
```

## Method 2: Using JSON Atlas (TexturePacker format)

```javascript
// Export from TexturePacker as "JSON Hash" format
await this.assetLoader.loadAtlas(
    'game-sprites',
    '/assets/sprites.png',
    '/assets/sprites.json'  // JSON file with frame data
);

// Or provide JSON directly
await this.assetLoader.loadAtlas(
    'game-sprites',
    '/assets/sprites.png',
    {
        frames: {
            'player-idle-0': { frame: { x: 0, y: 0, w: 32, h: 32 } },
            'player-idle-1': { frame: { x: 32, y: 0, w: 32, h: 32 } },
            'player-walk-0': { frame: { x: 0, y: 32, w: 32, h: 32 } },
            'player-walk-1': { frame: { x: 32, y: 32, w: 32, h: 32 } }
        },
        meta: {
            app: "TexturePacker",
            version: "1.0",
            image: "sprites.png",
            size: { w: 256, h: 256 }
        }
    }
);
```

## Method 3: Manual Frame Definitions

```javascript
const atlas = new TextureAtlas(image);

// Add individual frames
atlas.addFrame('button-normal', 0, 0, 64, 32);
atlas.addFrame('button-hover', 0, 32, 64, 32);
atlas.addFrame('button-pressed', 0, 64, 64, 32);
```

## Drawing Atlas Frames

### In UIRenderer

```javascript
#renderUI(dt) {
    this.uiRenderer.clear();

    // Get atlas from AssetLoader
    const atlas = this.assetLoader.getAtlas('ui-sprites');

    if (atlas) {
        // Draw health icon
        this.uiRenderer.drawAtlasFrame(
            atlas,
            'health-icon',  // frame name
            10,             // x position
            10,             // y position
            32,             // width (optional)
            32,             // height (optional)
            1.0,            // alpha (optional)
            0               // rotation (optional)
        );

        // Draw coin with rotation
        this.uiRenderer.drawAtlasFrame(
            atlas,
            'coin',
            100,
            10,
            16,
            16,
            1.0,
            this.coinRotation // animated rotation
        );
    }
}
```

### Direct Canvas Drawing

```javascript
const atlas = this.assetLoader.getAtlas('game-sprites');
const ctx = this.uiRenderer.context;

// Draw frame directly
atlas.drawFrame(ctx, 'player-idle-0', 100, 100);

// Draw with custom size
atlas.drawFrame(ctx, 'player-idle-0', 100, 100, 64, 64);

// Draw with alpha and rotation
atlas.drawFrame(ctx, 'enemy-1', 200, 200, null, null, 0.5, Math.PI / 4);
```

## Creating Animations

```javascript
// Get animation sequence
const walkFrames = atlas.createAnimationSequence('player-walk-', 0, 7);
// Returns: ['player-walk-0', 'player-walk-1', ..., 'player-walk-7']

// Or find frames by pattern
const idleFrames = atlas.getFramesMatching(/^player-idle-/);

// Animate in game loop
class Player {
    constructor(atlas) {
        this.atlas = atlas;
        this.walkFrames = atlas.createAnimationSequence('walk-', 0, 7);
        this.currentFrame = 0;
        this.animationSpeed = 0.1;
        this.animationTimer = 0;
    }

    update(dt) {
        this.animationTimer += dt;
        if (this.animationTimer >= this.animationSpeed) {
            this.currentFrame = (this.currentFrame + 1) % this.walkFrames.length;
            this.animationTimer = 0;
        }
    }

    render(ctx) {
        const frameName = this.walkFrames[this.currentFrame];
        this.atlas.drawFrame(ctx, frameName, this.x, this.y);
    }
}
```

## Complete Example in Game.js

```javascript
// In #loadAllStandardAssets()
async #loadAllStandardAssets() {
    await this.assetLoader.loadAssets([
        // ... existing assets ...
        {
            type: 'atlas',
            name: 'ui',
            imageUrl: '/assets/ui-sprites.png',
            atlasData: '/assets/ui-sprites.json'
        }
    ]);
}

// In #renderUI()
#renderUI(dt) {
    this.uiRenderer.clear();

    const uiAtlas = this.assetLoader.getAtlas('ui');

    if (uiAtlas) {
        // Health bar icon
        this.uiRenderer.drawAtlasFrame(uiAtlas, 'heart-full', 10, 10, 32, 32);

        // Coin counter
        this.uiRenderer.drawAtlasFrame(uiAtlas, 'coin', 10, 50, 24, 24);
        this.uiRenderer.drawText(`x ${this.coins}`, 40, 50);

        // Animated indicator
        const frame = Math.floor(Date.now() / 100) % 4;
        this.uiRenderer.drawAtlasFrame(
            uiAtlas,
            `indicator-${frame}`,
            100,
            100
        );
    }

    // ... crosshair, etc ...
}
```

## Benefits

✅ **Single texture = 1 drawcall** for all sprites (vs. 1 drawcall per sprite)
✅ **Reduced memory** - One texture in GPU memory
✅ **Batch rendering** - All UI sprites drawn efficiently
✅ **Animation support** - Easy frame sequences
✅ **Tool compatibility** - Works with TexturePacker, Shoebox, etc.

## Tools for Creating Atlases

- **TexturePacker** - https://www.codeandweb.com/texturepacker
- **Shoebox** - https://renderhjs.net/shoebox/
- **Free Texture Packer** - http://free-tex-packer.com/

Export as "JSON Hash" format for best compatibility.
