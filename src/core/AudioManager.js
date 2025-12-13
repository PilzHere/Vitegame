export default class AudioManager {
    static #instance = null;

    #assetLoader = null;
    #music = null;
    #masterVolume = 1.0;
    #sfxVolume = 1.0;
    #musicVolume = 0.5;
    #listener = null;

    constructor(assetLoader = null) {
        if (AudioManager.#instance) {
            return AudioManager.#instance;
        }

        this.#assetLoader = assetLoader;
        this.#listener = new (window.AudioContext || window.webkitAudioContext)();

        AudioManager.#instance = this;
    }

    static getInstance(assetLoader = null) {
        if (!AudioManager.#instance) {
            AudioManager.#instance = new AudioManager(assetLoader);
        } else if (assetLoader) {
            // Allow setting assetLoader after construction via setter
            AudioManager.#instance.setAssetLoader(assetLoader);
        }
        return AudioManager.#instance;
    }

    setAssetLoader(assetLoader) {
        if (!this.#assetLoader && assetLoader) {
            this.#assetLoader = assetLoader;
        }
    }

    playSound(name, volume = 1.0) {
        if (!this.#assetLoader) {
            console.warn('AudioManager: AssetLoader not set');
            return;
        }

        const buffer = this.#assetLoader.getSound(name);
        if (!buffer) {
            console.warn(`Sound not found in AssetLoader: ${name}`);
            return;
        }

        const source = this.#listener.createBufferSource();
        const gainNode = this.#listener.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.#listener.destination);
        gainNode.gain.value = volume * this.#sfxVolume * this.#masterVolume;

        source.start(0);
        return source;
    }

    get masterVolume() {
        return this.#masterVolume;
    }

    set masterVolume(volume) {
        this.#masterVolume = Math.max(0, Math.min(1, volume));
        // Update current music volume if playing
        if (this.#music) {
            this.#music.volume = this.#musicVolume * this.#masterVolume;
        }
    }

    get sfxVolume() {
        return this.#sfxVolume;
    }

    set sfxVolume(volume) {
        this.#sfxVolume = Math.max(0, Math.min(1, volume));
    }

    get musicVolume() {
        return this.#musicVolume;
    }

    set musicVolume(volume) {
        this.#musicVolume = Math.max(0, Math.min(1, volume));
        if (this.#music) {
            this.#music.volume = this.#musicVolume * this.#masterVolume;
        }
    }

    async resume() {
        if (this.#listener.state === 'suspended') {
            await this.#listener.resume();
        }
    }
}
