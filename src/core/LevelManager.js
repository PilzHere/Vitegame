export default class LevelManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.levels = new Map();
        this.currentLevel = null;
        this.currentLevelIndex = 0;
    }

    registerLevel(name, levelData) {
        this.levels.set(name, levelData);
    }

    async loadLevel(name) {
        const levelData = this.levels.get(name);
        if (!levelData) {
            console.error(`Level not found: ${name}`);
            return;
        }

        this.unloadCurrentLevel();

        this.currentLevel = name;

        if (levelData.onLoad) {
            await levelData.onLoad(this.sceneManager);
        }

        console.log(`Level loaded: ${name}`);
    }

    unloadCurrentLevel() {
        if (!this.currentLevel) return;

        const levelData = this.levels.get(this.currentLevel);
        if (levelData && levelData.onUnload) {
            levelData.onUnload(this.sceneManager);
        }

        this.sceneManager.clear();
    }

    nextLevel() {
        const levelNames = Array.from(this.levels.keys());
        this.currentLevelIndex = (this.currentLevelIndex + 1) % levelNames.length;
        return this.loadLevel(levelNames[this.currentLevelIndex]);
    }

    restartLevel() {
        if (this.currentLevel) {
            return this.loadLevel(this.currentLevel);
        }
    }
}
