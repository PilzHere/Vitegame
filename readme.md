# Three.js + cannon-es Game Starter

A Vite-based game starter template using Three.js for 3D rendering and cannon-es for physics simulation. Features FPS camera controls, custom shaders, entity system, and debug visualization tools.

## Prerequisites

- **Node.js** (v16 or higher) - Required for development server and building

## Installation

1. Install dependencies:
```bash
yarn install
```

## Running the Project

### Development Mode
Start the local development server with hot module replacement:
```bash
yarn run dev
```
This will start a dev server (typically at `http://localhost:5173`) where you can see live changes as you edit your code.

### Build for Production
Create an optimized production build:
```bash
yarn run build
```
The built files will be output to the `dist/` directory and ready for deployment.

## Controls

### Camera (FPS Mode)
- **Click** on the canvas to lock the mouse pointer
- **Mouse** - Look around
- **W** - Move forward
- **S** - Move backward
- **A** - Strafe left
- **D** - Strafe right
- **Space** - Move up
- **Shift** - Move down
- **ESC** - Exit pointer lock (release mouse)

### Debug
- **F3** - Toggle performance monitor (FPS, entity count, memory usage)
- **F4** - Toggle debug helpers (frustum culling bounding spheres - see [docs/CULLING_INFO.md](docs/CULLING_INFO.md))

## Project Structure

- `src/` - Source code
  - `core/` - Core game systems
    - `Game.js` - Main game class
    - `Renderer.js` - Three.js renderer setup
    - `SceneManager.js` - Entity and scene management
    - `AssetLoader.js` - Asset loading and management (singleton)
  - `entities/` - Game objects (Ball, Floor, etc.)
  - `controls/` - Input and camera controls
    - `FPSCameraController.js` - First-person camera with WASD movement
    - `OrbitControlsManager.js` - Orbit camera (not currently used)
  - `utils/` - Utility classes
    - `Logger.js` - Logging utility with different log levels
    - `PerformanceMonitor.js` - FPS and performance tracking
    - `DebugHelpers.js` - Visual debugging tools (bounding spheres)
  - `assets/` - Textures, models, shaders, and sounds
  - `main.js` - Application entry point
- `docs/` - Documentation
  - `CULLING_INFO.md` - Guide to frustum culling and bounding spheres
- `index.html` - HTML entry point
- `vite.config.js` - Vite configuration

## Features

### Core Systems
- **Entity System** - Base entity class with UUID, type-based collision detection, and lifecycle management
- **Asset Loading** - Singleton asset loader for textures, models, fonts, sounds, and shaders
- **Physics** - cannon-es integration with customizable materials and contact properties
- **Performance Monitoring** - Real-time FPS, entity count, and memory usage tracking

### Graphics
- **Custom Shaders** - GLSL shader support with texture mapping
- **Debug Visualization** - Bounding sphere helpers for frustum culling
- **Multiple Rendering Modes** - Standard materials, custom shaders, and textured shaders

### Controls
- **FPS Camera** - Full 6DOF movement with mouse look and WASD controls
- **Pointer Lock API** - Seamless mouse capture for immersive camera control

### Development
- **Hot Module Replacement** - Instant updates during development
- **Logging System** - Categorized logging with success, error, warning, info, and debug levels
- **Resource Cleanup** - Proper disposal of geometries, materials, and physics bodies

## Documentation

- [Frustum Culling Guide](docs/CULLING_INFO.md) - Understanding Three.js bounding sphere culling