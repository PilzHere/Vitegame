precision highp float;

// Basic Fragment Shader
uniform vec3 uColor;
uniform float uTime;

in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;

out vec4 fragColor;

void main() {
    // Simple lighting calculation
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
    float lightIntensity = max(dot(vNormal, lightDirection), 0.0);

    // Ambient light
    float ambientStrength = 0.3;
    vec3 ambient = ambientStrength * uColor;

    // Diffuse light
    vec3 diffuse = lightIntensity * uColor;

    // Combine lighting
    vec3 finalColor = ambient + diffuse;

    fragColor = vec4(finalColor, 1.0);
}
