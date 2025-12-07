precision highp float;

// Textured Fragment Shader
uniform sampler2D uTexture;
uniform float uTime;

in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;

out vec4 fragColor;

void main() {
    // Sample the texture
    vec4 texColor = texture(uTexture, vUv);

    // Simple lighting calculation
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
    float lightIntensity = max(dot(vNormal, lightDirection), 0.0);

    // Ambient light
    float ambientStrength = 0.3;
    vec3 ambient = ambientStrength * texColor.rgb;

    // Diffuse light
    vec3 diffuse = lightIntensity * texColor.rgb;

    // Combine lighting
    vec3 finalColor = ambient + diffuse;

    fragColor = vec4(finalColor, texColor.a);
}
