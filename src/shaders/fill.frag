precision highp float;
uniform vec4 tint;
varying vec4 vColor;

void main() {
  gl_FragColor = vColor * tint;
}
