// Basic Vertex Shader
out vec2 vUv;
out vec3 vNormal;
out vec3 vPosition;

void main() {
    // Pass UV coordinates to fragment shader
    vUv = uv;

    // Pass normal to fragment shader (in view space)
    vNormal = normalize(normalMatrix * normal);

    // Pass position to fragment shader (in view space)
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;

    // Calculate final position
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
