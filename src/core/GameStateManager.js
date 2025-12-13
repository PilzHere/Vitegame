import Logger from '../utils/Logger.js';

export default class GameStateManager {
    static #instance = null;

    static States = {
        LOADING: 'loading',
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'gameover'
    };

    #currentState = GameStateManager.States.LOADING;
    #previousState = null;
    #stateHandlers = new Map();

    constructor() {
        if (GameStateManager.#instance) {
            return GameStateManager.#instance;
        }

        GameStateManager.#instance = this;
    }

    static getInstance() {
        if (!GameStateManager.#instance) {
            GameStateManager.#instance = new GameStateManager();
        }
        return GameStateManager.#instance;
    }

    registerState(state, handlers = {}) {
        this.#stateHandlers.set(state, {
            onEnter: handlers.onEnter || (() => {}),
            onExit: handlers.onExit || (() => {}),
            onUpdate: handlers.onUpdate || (() => {})
        });
    }

    changeState(newState) {
        if (this.#currentState === newState) return;

        const currentHandlers = this.#stateHandlers.get(this.#currentState);
        if (currentHandlers) {
            currentHandlers.onExit();
        }

        this.#previousState = this.#currentState;
        this.#currentState = newState;

        const newHandlers = this.#stateHandlers.get(newState);
        if (newHandlers) {
            newHandlers.onEnter();
        }

        Logger.info(`State changed: ${this.#previousState} -> ${this.#currentState}`);
    }

    update(deltaTime) {
        const handlers = this.#stateHandlers.get(this.#currentState);
        if (handlers && handlers.onUpdate) {
            handlers.onUpdate(deltaTime);
        }
    }

    get currentState() {
        return this.#currentState;
    }

    get previousState() {
        return this.#previousState;
    }

    isState(state) {
        return this.#currentState === state;
    }
}
