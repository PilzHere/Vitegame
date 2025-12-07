import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import Logger from '../utils/Logger.js';

class AssetLoader {
    static #instance = null;

    #textureLoader = new THREE.TextureLoader();
    #gltfLoader = new GLTFLoader();
    #fbxLoader = new FBXLoader();
    #fontLoader = new FontLoader();
    #audioContext;

    #textures = new Map();
    #models = new Map();
    #fonts = new Map();
    #sounds = new Map();
    #music = new Map();
    #shaders = new Map();

    #loadingProgress = 0;
    #totalAssets = 0;
    #loadedAssets = 0;

    constructor() {
        if (AssetLoader.#instance) {
            Logger.warn('AssetLoader instance already exists. Returning existing instance.');
            return AssetLoader.#instance;
        }

        const AudioContextClass = window.AudioContext || (window.webkitAudioContext || window.AudioContext);
        this.#audioContext = new AudioContextClass();

        AssetLoader.#instance = this;
        Logger.info('AssetLoader singleton instance created');
    }

    static getInstance() {
        if (!AssetLoader.#instance) {
            AssetLoader.#instance = new AssetLoader();
        }
        return AssetLoader.#instance;
    }

    static resetInstance() {
        if (AssetLoader.#instance) {
            AssetLoader.#instance.unloadAll();
            AssetLoader.#instance = null;
            Logger.info('AssetLoader instance reset');
        }
    }

    async loadTexture(name, url) {
        // Check if already loaded
        if (this.#textures.has(name)) {
            Logger.warn(`Texture '${name}' already loaded. Skipping.`);
            return this.#textures.get(name);
        }

        return new Promise((resolve, reject) => {
            this.#textureLoader.load(
                url,
                (texture) => {
                    this.#textures.set(name, texture);
                    this.#updateProgress();
                    Logger.success(`Texture loaded: ${name}`);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    Logger.error(`Failed to load texture: ${name}`, error);
                    this.#updateProgress();
                    reject(error);
                }
            );
        });
    }

    async loadModel(name, url, format = 'gltf') {
        // Check if already loaded
        if (this.#models.has(name)) {
            Logger.warn(`Model '${name}' already loaded. Skipping.`);
            return this.#models.get(name);
        }

        return new Promise((resolve, reject) => {
            const loader = format === 'fbx' ? this.#fbxLoader : this.#gltfLoader;

            loader.load(
                url,
                (model) => {
                    const processedModel = format === 'gltf' ? model.scene : model;
                    this.#models.set(name, { model: processedModel, animations: model.animations || [] });
                    this.#updateProgress();
                    Logger.success(`Model loaded: ${name}`);
                    resolve(model);
                },
                undefined,
                (error) => {
                    Logger.error(`Failed to load model: ${name}`, error);
                    this.#updateProgress();
                    reject(error);
                }
            );
        });
    }

    async loadFont(name, url) {
        // Check if already loaded
        if (this.#fonts.has(name)) {
            Logger.warn(`Font '${name}' already loaded. Skipping.`);
            return this.#fonts.get(name);
        }

        return new Promise((resolve, reject) => {
            this.#fontLoader.load(
                url,
                (font) => {
                    this.#fonts.set(name, font);
                    this.#updateProgress();
                    Logger.success(`Font loaded: ${name}`);
                    resolve(font);
                },
                undefined,
                (error) => {
                    Logger.error(`Failed to load font: ${name}`, error);
                    this.#updateProgress();
                    reject(error);
                }
            );
        });
    }

    async loadSound(name, url) {
        // Check if already loaded
        if (this.#sounds.has(name)) {
            Logger.warn(`Sound '${name}' already loaded. Skipping.`);
            return this.#sounds.get(name);
        }

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.#audioContext.decodeAudioData(arrayBuffer);
            this.#sounds.set(name, audioBuffer);
            this.#updateProgress();
            Logger.success(`Sound loaded: ${name}`);
            return audioBuffer;
        } catch (error) {
            Logger.error(`Failed to load sound: ${name}`, error);
            this.#updateProgress();
            throw error;
        }
    }

    async loadMusic(name, url) {
        // Check if already loaded
        if (this.#music.has(name)) {
            Logger.warn(`Music '${name}' already loaded. Skipping.`);
            return this.#music.get(name);
        }

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.#audioContext.decodeAudioData(arrayBuffer);
            this.#music.set(name, audioBuffer);
            this.#updateProgress();
            Logger.success(`Music loaded: ${name}`);
            return audioBuffer;
        } catch (error) {
            Logger.error(`Failed to load music: ${name}`, error);
            this.#updateProgress();
            throw error;
        }
    }

    async loadShader(name, vertexUrl, fragmentUrl) {
        // Check if already loaded
        if (this.#shaders.has(name)) {
            Logger.warn(`Shader '${name}' already loaded. Skipping.`);
            return this.#shaders.get(name);
        }

        try {
            const [vertexResponse, fragmentResponse] = await Promise.all([
                fetch(vertexUrl),
                fetch(fragmentUrl)
            ]);

            const vertexShader = await vertexResponse.text();
            const fragmentShader = await fragmentResponse.text();

            this.#shaders.set(name, { vertex: vertexShader, fragment: fragmentShader });
            this.#updateProgress();
            Logger.success(`Shader loaded: ${name}`);
            return { vertex: vertexShader, fragment: fragmentShader };
        } catch (error) {
            Logger.error(`Failed to load shader: ${name}`, error);
            this.#updateProgress();
            throw error;
        }
    }

    getTexture(name) {
        return this.#textures.get(name);
    }

    getModel(name) {
        return this.#models.get(name);
    }

    getFont(name) {
        return this.#fonts.get(name);
    }

    getSound(name) {
        return this.#sounds.get(name);
    }

    getMusic(name) {
        return this.#music.get(name);
    }

    getShader(name) {
        return this.#shaders.get(name);
    }

    async loadAssets(assetList) {
        this.#totalAssets = assetList.length;
        this.#loadedAssets = 0;
        this.#loadingProgress = 0;

        const promises = assetList.map(asset => {
            switch (asset.type) {
                case 'texture':
                    return this.loadTexture(asset.name, asset.url);
                case 'model':
                    return this.loadModel(asset.name, asset.url, asset.format);
                case 'font':
                    return this.loadFont(asset.name, asset.url);
                case 'sound':
                    return this.loadSound(asset.name, asset.url);
                case 'music':
                    return this.loadMusic(asset.name, asset.url);
                case 'shader':
                    return this.loadShader(asset.name, asset.vertexUrl, asset.fragmentUrl);
                default:
                    Logger.warn(`Unknown asset type: ${asset.type}`);
                    this.#updateProgress();
                    return Promise.resolve();
            }
        });

        return Promise.all(promises);
    }

    unloadTexture(name) {
        const texture = this.#textures.get(name);
        if (texture) {
            texture.dispose();
            this.#textures.delete(name);
            Logger.info(`Texture unloaded: ${name}`);
        }
    }

    unloadModel(name) {
        const modelData = this.#models.get(name);
        if (modelData) {
            modelData.model.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.#models.delete(name);
            Logger.info(`Model unloaded: ${name}`);
        }
    }

    unloadFont(name) {
        this.#fonts.delete(name);
        Logger.info(`Font unloaded: ${name}`);
    }

    unloadSound(name) {
        this.#sounds.delete(name);
        Logger.info(`Sound unloaded: ${name}`);
    }

    unloadMusic(name) {
        this.#music.delete(name);
        Logger.info(`Music unloaded: ${name}`);
    }

    unloadShader(name) {
        this.#shaders.delete(name);
        Logger.info(`Shader unloaded: ${name}`);
    }

    unloadAll() {
        this.#textures.forEach((_, name) => this.unloadTexture(name));
        this.#models.forEach((__, name) => this.unloadModel(name));
        this.#fonts.clear();
        this.#sounds.clear();
        this.#music.clear();
        this.#shaders.clear();
        Logger.info('All assets unloaded');
    }

    #updateProgress() {
        this.#loadedAssets++;
        this.#loadingProgress = (this.#loadedAssets / this.#totalAssets) * 100;
    }

    getProgress() {
        return this.#loadingProgress;
    }

    getLoadedCount() {
        return this.#loadedAssets;
    }

    getTotalCount() {
        return this.#totalAssets;
    }
}

export default AssetLoader;
