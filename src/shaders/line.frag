precision highp float;
uniform vec4 tint;
varying vec4 vColor;
varying vec2 vUD;

void main() {
  gl_FragColor = vColor * tint;
}
