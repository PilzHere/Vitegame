import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * Post-processing manager using Three.js EffectComposer
 * Provides vignette and bloom effects
 */
export default class PostProcessing {
    #composer;
    #renderPass;
    #outputPass;
    #vignettePass;
    #bloomPass;
    #enabled = false;
    #sceneRenderInfo = null; // Stores render info from actual scene (before post-processing)

    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        // Create composer
        this.#composer = new EffectComposer(renderer);
        this.#composer.setSize(window.innerWidth, window.innerHeight);

        // Add render pass (renders the scene)
        this.#renderPass = new RenderPass(scene, camera);
        this.#composer.addPass(this.#renderPass);

        // Add output pass at the end to handle color space conversion
        // This MUST be added last (after all other effects)
        this.#outputPass = new OutputPass();
        this.#composer.addPass(this.#outputPass);

        // Setup resize handler
        this.#setupResizeHandler();
    }

    #setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.#composer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    /**
     * Add vignette effect (darkened edges)
     * @param {number} darkness - Darkness intensity (0-2, default: 1.0)
     * @param {number} offset - Offset from center (0-2, default: 1.0)
     */
    addVignette(darkness = 1.0, offset = 1.0) {
        const VignetteShader = {
            uniforms: {
                tDiffuse: { value: null },
                darkness: { value: darkness },
                offset: { value: offset }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float darkness;
                uniform float offset;
                varying vec2 vUv;

                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
                    gl_FragColor = vec4(mix(texel.rgb, vec3(0.0), dot(uv, uv) * darkness), texel.a);
                }
            `
        };

        this.#vignettePass = new ShaderPass(VignetteShader);
        // Insert vignette before output pass
        const passes = this.#composer.passes;
        passes.splice(passes.length - 1, 0, this.#vignettePass);

        return this.#vignettePass;
    }

    /**
     * Add bloom effect (glow for bright areas)
     * @param {number} strength - Bloom strength (0-3, default: 1.5)
     * @param {number} radius - Bloom radius (0-1, default: 0.4)
     * @param {number} threshold - Brightness threshold (0-1, default: 0.85)
     */
    addBloom(strength = 1.5, radius = 0.4, threshold = 0.85) {
        this.#bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            strength,
            radius,
            threshold
        );
        // Insert bloom before output pass
        const passes = this.#composer.passes;
        passes.splice(passes.length - 1, 0, this.#bloomPass);

        return this.#bloomPass;
    }

    /**
     * Update vignette settings
     */
    setVignette(darkness, offset) {
        if (this.#vignettePass) {
            this.#vignettePass.uniforms.darkness.value = darkness;
            this.#vignettePass.uniforms.offset.value = offset;
        }
    }

    /**
     * Update bloom settings
     */
    setBloom(strength, radius, threshold) {
        if (this.#bloomPass) {
            this.#bloomPass.strength = strength;
            this.#bloomPass.radius = radius;
            this.#bloomPass.threshold = threshold;
        }
    }

    enable() {
        this.#enabled = true;
    }

    disable() {
        this.#enabled = false;
    }

    get enabled() {
        return this.#enabled;
    }

    render() {
        if (this.#enabled) {
            // Hook into RenderPass to capture stats after scene render
            const originalRender = this.#renderPass.render.bind(this.#renderPass);
            this.#renderPass.render = (renderer, writeBuffer, readBuffer, deltaTime, maskActive) => {
                // Reset before rendering scene
                renderer.info.reset();

                // Call original render (draws the scene)
                originalRender(renderer, writeBuffer, readBuffer, deltaTime, maskActive);

                // Capture stats immediately after scene is drawn
                const info = renderer.info;
                this.#sceneRenderInfo = {
                    calls: info.render.calls,
                    triangles: info.render.triangles,
                    points: info.render.points,
                    lines: info.render.lines,
                    frame: info.render.frame
                };

                // Restore original render for next frame
                this.#renderPass.render = originalRender;
            };

            // Render with composer (all passes)
            this.#composer.render();
        } else {
            // When disabled, render directly and capture stats
            this.renderer.info.reset();
            this.renderer.render(this.scene, this.camera);

            // Capture stats after direct render
            const info = this.renderer.info;
            this.#sceneRenderInfo = {
                calls: info.render.calls,
                triangles: info.render.triangles,
                points: info.render.points,
                lines: info.render.lines,
                frame: info.render.frame
            };
        }
    }

    /**
     * Get render info from the actual scene (not post-processing overhead)
     * Returns accurate stats even when post-processing is enabled
     */
    getSceneRenderInfo() {
        return this.#sceneRenderInfo || this.renderer.info.render;
    }

    dispose() {
        this.#composer.dispose();
    }
}
