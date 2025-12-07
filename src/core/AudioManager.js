export default class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.music = null;
        this.masterVolume = 1.0;
        this.sfxVolume = 1.0;
        this.musicVolume = 0.5;
        this.listener = new (window.AudioContext || window.webkitAudioContext)();
    }

    async loadSound(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.listener.decodeAudioData(arrayBuffer);
            this.sounds.set(name, audioBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Failed to load sound: ${name}`, error);
        }
    }

    playSound(name, volume = 1.0) {
        const buffer = this.sounds.get(name);
        if (!buffer) {
            console.warn(`Sound not found: ${name}`);
            return;
        }

        const source = this.listener.createBufferSource();
        const gainNode = this.listener.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.listener.destination);
        gainNode.gain.value = volume * this.sfxVolume * this.masterVolume;

        source.start(0);
        return source;
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.music) {
            this.music.volume = this.musicVolume * this.masterVolume;
        }
    }
}
