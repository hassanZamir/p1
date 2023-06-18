#version 300 es
precision mediump float;

layout (location = 0) in vec3 a_position;
layout (location = 1) in vec3 a_normal;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat3 u_normalMatrix;

out vec3 v_normal;
out vec3 v_position;

void main() {
  vec4 position = u_modelViewMatrix * vec4(a_position, 1.0);
  v_position = position.xyz;
  v_normal = u_normalMatrix * a_normal;
  gl_Position = u_projectionMatrix * position;
}