// Entity type constants for efficient collision detection
export const EntityTypes = Object.freeze({
    UNKNOWN: 0,
    BALL: 1,
    FLOOR: 2,
    PLAYER: 3,
    ENEMY: 4,
    COLLECTIBLE: 5,
    PROJECTILE: 6,
    OBSTACLE: 7,
    POWERUP: 8
});

// Optional: Helper to get string name from type
export function getEntityTypeName(type) {
    return Object.keys(EntityTypes).find(key => EntityTypes[key] === type) || 'UNKNOWN';
}
