# Three.js Frustum Culling - How It Works

## What Three.js Actually Uses

**Three.js uses ONLY the bounding sphere for frustum culling by default.**

Bounding boxes are NOT used for culling unless you manually override the frustum culling behavior.

## How to Verify What's Being Used

You can check in the browser console what gets computed:

```javascript
// In your browser console, after the game loads:
const ball = sceneManager.scene.children.find(c => c.type === 'Mesh' && c.geometry.type === 'SphereGeometry');

// Check what's computed:
console.log('Bounding Sphere:', ball.geometry.boundingSphere); // Will show radius and center
console.log('Bounding Box:', ball.geometry.boundingBox);       // Might be null if not explicitly computed

// Three.js internally uses only boundingSphere for frustum culling
console.log('Frustum Culled:', ball.frustumCulled); // true by default
```

## Debug Helper Visualization

Press **F4** to toggle the bounding sphere visualization (white wireframe spheres).

The debug helpers show:
- **Bounding Sphere** - White wireframe sphere showing the volume used for frustum culling

## For Your Ball (Sphere Mesh)

Since your mesh is a perfect sphere:
- **Bounding Sphere** = Perfect fit (radius 0.5) ✓ Used for culling
- The sphere helper perfectly matches the actual geometry

## Performance Note

Bounding sphere culling is fast because:
- Single distance check: `distance(sphere.center, frustum.plane) > sphere.radius`
- No orientation dependency (spheres look the same from any angle)
- No need to test multiple corners/faces
- Automatic computation - Three.js computes this on first render if not already computed
