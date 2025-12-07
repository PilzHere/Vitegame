export default class GameStateManager {
    static States = {
        LOADING: 'loading',
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'gameover'
    };

    constructor() {
        this.currentState = GameStateManager.States.LOADING;
        this.previousState = null;
        this.stateHandlers = new Map();
    }

    registerState(state, handlers = {}) {
        this.stateHandlers.set(state, {
            onEnter: handlers.onEnter || (() => {}),
            onExit: handlers.onExit || (() => {}),
            onUpdate: handlers.onUpdate || (() => {})
        });
    }

    changeState(newState) {
        if (this.currentState === newState) return;

        const currentHandlers = this.stateHandlers.get(this.currentState);
        if (currentHandlers) {
            currentHandlers.onExit();
        }

        this.previousState = this.currentState;
        this.currentState = newState;

        const newHandlers = this.stateHandlers.get(newState);
        if (newHandlers) {
            newHandlers.onEnter();
        }

        console.log(`State changed: ${this.previousState} -> ${this.currentState}`);
    }

    update(deltaTime) {
        const handlers = this.stateHandlers.get(this.currentState);
        if (handlers && handlers.onUpdate) {
            handlers.onUpdate(deltaTime);
        }
    }

    getCurrentState() {
        return this.currentState;
    }

    isState(state) {
        return this.currentState === state;
    }
}
