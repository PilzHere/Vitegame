/**
 * Collision groups using bitmasks (powers of 2)
 * Used by Cannon.js for efficient collision filtering at the physics engine level
 *
 * Each group is a power of 2, allowing bitwise OR operations to combine groups:
 * Example: CollisionGroups.BALL | CollisionGroups.FLOOR = 0011 (collides with both)
 */
export const CollisionGroups = {
    NONE: 0,           // 0000 - No collisions
    FLOOR: 1,          // 0001 - Static environment
    BALL: 2,           // 0010 - Dynamic balls
    PLAYER: 4,         // 0100 - Player-controlled entities
    ENEMY: 8,          // 1000 - Enemy entities
    PROJECTILE: 16,    // 10000 - Projectiles (future use)
    TRIGGER: 32,       // 100000 - Trigger zones (future use)
    ALL: 0xFFFFFFFF    // All bits set - collides with everything
};

/**
 * Predefined collision masks for common scenarios
 * Defines WHAT each type of object should collide WITH
 */
export const CollisionMasks = {
    // Floor collides with everything physical (not triggers)
    FLOOR: CollisionGroups.BALL | CollisionGroups.PLAYER | CollisionGroups.ENEMY | CollisionGroups.PROJECTILE,

    // Balls collide with floor, other balls, and enemies
    BALL: CollisionGroups.FLOOR | CollisionGroups.BALL | CollisionGroups.ENEMY,

    // Player collides with floor and enemies
    PLAYER: CollisionGroups.FLOOR | CollisionGroups.ENEMY,

    // Enemies collide with floor, player, and balls
    ENEMY: CollisionGroups.FLOOR | CollisionGroups.PLAYER | CollisionGroups.BALL,

    // Projectiles collide with enemies and floor
    PROJECTILE: CollisionGroups.FLOOR | CollisionGroups.ENEMY,

    // Triggers collide with player only (for trigger zones)
    TRIGGER: CollisionGroups.PLAYER
};
