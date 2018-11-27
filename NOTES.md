## TODO `1.0`

- [ ] Add docs for API and supported Canvas2D features.
- [x] Add overloaded context methods for 3D space (adding `z` parameter to `moveTo`, `lineTo`, `translate` ...).
- [x] Add example for 3D space and perspective projection.
- [x] Use Uint32Array for elements if buffer size exceeds 16 bit limit and extension is enabled.
- [x] Add method to destroy/release all resource buffers.
- [x] Fix viewport relative `thickness`.
- [x] Allow custom vertex and fragment shader input (as well as other draw command parameters).
- [x] Export vertex transform GLSL method for custom vertex shaders.
- [x] Add example for custom shaders.
- [x] Add support for `fill` in 2d mode (will require separate resources and shader).
- [x] Allow intermediate `lineWidth` changes (divergent from Canvas2D behavior, but a nice feature).

## TODO future

- [ ] Investigate memory optimizations for line start / end position duplication.
- [ ] Add parameter for configuring segment precision (for `arc`).
- [ ] Fix UV coordinates for skewed/mitered edges.
