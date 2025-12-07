# Three.js + cannon-es Offline Starter

A Vite-based game starter template using Three.js for 3D rendering and cannon-es for physics simulation.

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

## Project Structure

- `src/` - Source code
  - `Game.js` - Main game class
  - `Renderer.js` - Three.js renderer setup
  - `SceneManager.js` - Entity and scene management
  - `PerformanceMonitor.js` - FPS and performance tracking
  - `entities/` - Game objects (Ball, Floor, etc.)
  - `controls/` - Input and camera controls
  - `assets/` - Textures, models, shaders, and sounds
- `index.html` - Entry point
- `vite.config.js` - Vite configuration