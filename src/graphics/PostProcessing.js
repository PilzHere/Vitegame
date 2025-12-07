import * as THREE from 'three';

export default class PostProcessing {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.passes = [];
        this.enabled = false;

        this.renderTarget = new THREE.WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat
            }
        );

        this.#setupResizeHandler();
    }

    #setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.renderTarget.setSize(window.innerWidth, window.innerHeight);
        });
    }

    addPass(pass) {
        this.passes.push(pass);
    }

    removePass(pass) {
        const index = this.passes.indexOf(pass);
        if (index !== -1) {
            this.passes.splice(index, 1);
        }
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    render() {
        if (!this.enabled || this.passes.length === 0) {
            this.renderer.render(this.scene, this.camera);
            return;
        }

        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.camera);

        let currentTarget = this.renderTarget;

        for (let i = 0; i < this.passes.length; i++) {
            const pass = this.passes[i];
            const isLastPass = i === this.passes.length - 1;

            if (isLastPass) {
                this.renderer.setRenderTarget(null);
            }

            if (pass.render) {
                pass.render(this.renderer, currentTarget);
            }
        }
    }

    dispose() {
        this.renderTarget.dispose();
        this.passes.forEach(pass => {
            if (pass.dispose) {
                pass.dispose();
            }
        });
        this.passes = [];
    }
}

export class BloomPass {
    constructor() {
        this.strength = 1.5;
        this.radius = 0.5;
        this.threshold = 0.85;
    }

    render(renderer, inputTarget) {
        console.log('Bloom pass rendering (placeholder)');
    }

    dispose() {
    }
}

export class VignettePass {
    constructor() {
        this.darkness = 1.0;
        this.offset = 1.0;

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                darkness: { value: this.darkness },
                offset: { value: this.offset }
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
        });

        this.quad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            this.material
        );
        this.scene = new THREE.Scene();
        this.scene.add(this.quad);
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }

    render(renderer, inputTarget) {
        this.material.uniforms.tDiffuse.value = inputTarget.texture;
        renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.material.dispose();
        this.quad.geometry.dispose();
    }
}
