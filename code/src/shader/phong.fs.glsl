#version 300 es
precision mediump float;

in vec3 v_normal;
in vec3 v_position;

uniform vec3 u_ambientColor;
uniform vec3 u_diffuseColor;
uniform vec3 u_specularColor;
uniform float u_shininess;

uniform vec3 u_lightPosition;
uniform vec3 u_lightColor;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(v_normal);
  vec3 lightDirection = normalize(u_lightPosition - v_position);
  vec3 viewDirection = normalize(-v_position);

  float lambertian = max(dot(lightDirection, normal), 0.0);
  float specularFactor = 0.0;

  if (lambertian > 0.0) {
    vec3 reflectDirection = reflect(-lightDirection, normal);
    float specAngle = max(dot(reflectDirection, viewDirection), 0.0);
    specularFactor = pow(specAngle, u_shininess);
  }

  vec3 ambient = u_ambientColor;
  vec3 diffuse = u_diffuseColor * lambertian;
  vec3 specular = u_specularColor * specularFactor;

  vec3 color = u_lightColor * (ambient + diffuse + specular);
  fragColor = vec4(color, 1.0);
}