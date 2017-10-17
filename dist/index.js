(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('gl-matrix')) :
	typeof define === 'function' && define.amd ? define(['exports', 'gl-matrix'], factory) :
	(factory((global.REGLLineBuilder = {}),global.glMatrix));
}(this, (function (exports,glMatrix) { 'use strict';

function setRGB (out, color) {
  var hexString = parseInt(color.replace(/^#/, ''), 16);
  var hex = Math.floor(hexString);
  out[0] = (hex >> 16 & 255) / 255;
  out[1] = (hex >> 8 & 255) / 255;
  out[2] = (hex & 255) / 255;
}

function ctor (Ctor) {
  return function () {
    var instance = Object.create(Ctor.prototype);
    Ctor.apply(instance, arguments);
    return instance
  }
}

function inherit (ParentCtor, Ctor, proto) {
  Ctor.create = ctor(Ctor);
  if (ParentCtor) Ctor.prototype = Object.create(ParentCtor.prototype);
  Ctor.prototype.constructor = Ctor;
  Object.assign(Ctor.prototype, proto);
}

function warnOnce (message) {
  var didWarn = false;
  return function () {
    if (didWarn) return
    didWarn = true;
    console.warn(message);
  }
}

var frag = "precision highp float;\n#define GLSLIFY 1\nuniform vec4 tint;\nvarying vec4 vColor;\nvarying vec2 vUD;\n\nvoid main() {\n  gl_FragColor = vColor * tint;\n}\n";

var vert = "// Based on WebGL lines demo\n// (c) 2015 Matt DesLauriers. MIT License\n// https://github.com/mattdesl/webgl-lines/\n\nprecision highp float;\n#define GLSLIFY 1\n\n// TODO: Maybe make separate package to make reuse with custom shaders easier?\n// TODO: Maybe use struct to pass some of this data?\nvec2 computeMiterNormal (\n  float aspect_0,\n  float thickness_0,\n  float miterLimit_0,\n  vec4 prevProjected_0,\n  vec4 currProjected_0,\n  vec4 nextProjected_0\n) {\n  vec2 aspectVec = vec2(aspect_0, 1.0);\n\n  // get 2D screen space with W divide and aspect correction\n  vec2 prevScreen = prevProjected_0.xy / prevProjected_0.w * aspectVec;\n  vec2 currScreen = currProjected_0.xy / currProjected_0.w * aspectVec;\n  vec2 nextScreen = nextProjected_0.xy / nextProjected_0.w * aspectVec;\n\n  vec2 dir = vec2(0.0);\n  float len = thickness_0;\n\n  // starting point uses (next - current)\n  if (currScreen == prevScreen) {\n    dir = normalize(nextScreen - currScreen);\n  }\n  // ending point uses (current - previous)\n  else if (currScreen == nextScreen) {\n    dir = normalize(currScreen - prevScreen);\n  }\n  // somewhere in middle, needs a join\n  else {\n    // get directions from (C - B) and (B - A)\n    vec2 dirA = normalize((currScreen - prevScreen));\n    if (int(miterLimit_0) == -1) {\n      dir = dirA;\n    } else {\n      vec2 dirB = normalize((nextScreen - currScreen));\n      // now compute the miter join normal and length\n      vec2 tangent = normalize(dirA + dirB);\n      vec2 perp = vec2(-dirA.y, dirA.x);\n      vec2 miter = vec2(-tangent.y, tangent.x);\n      dir = tangent;\n      len /= dot(miter, perp);\n    }\n  }\n\n  return vec2(-dir.y, dir.x) *\n    clamp(len, 0.0, max(thickness_0, miterLimit_0)) / aspectVec;\n}\n\nuniform mat4 projection;\nuniform mat4 model;\nuniform mat4 view;\nuniform float aspect;\n\nuniform float thickness;\nuniform float miterLimit;\n\n// TODO: Enable compiling for 2 or 3 dimensional lines\nattribute vec2 prevPosition;\nattribute vec2 currPosition;\nattribute vec2 nextPosition;\n\nattribute float offset;\nattribute vec4 color;\nattribute vec2 ud;\n\nvarying vec4 vColor;\nvarying vec2 vUD;\n\nvoid main() {\n  mat4 projViewModel = projection * view * model;\n\n  vec4 prevProjected = projViewModel * vec4(prevPosition, 0.0, 1.0);\n  vec4 currProjected = projViewModel * vec4(currPosition, 0.0, 1.0);\n  vec4 nextProjected = projViewModel * vec4(nextPosition, 0.0, 1.0);\n\n  vec2 normal = computeMiterNormal(\n    aspect, thickness, miterLimit,\n    prevProjected, currProjected, nextProjected);\n\n  vColor = color;\n  vUD = ud;\n\n  gl_Position = currProjected + vec4(normal * offset, 0.0, 1.0);\n}\n";

var line = {
  frag: frag,
  vert: vert
};

var FLOAT_BYTES = Float32Array.BYTES_PER_ELEMENT;
var CONTEXT_METHODS = [
  'beginPath',
  'moveTo',
  'lineTo',
  'arc',
  'closePath',
  'stroke',
  'strokeRect',
  'setLineDash',
  'setTransform',
  'translate',
  'scale',
  'rotate',
  'save',
  'restore'
];
var CONTEXT_ACCESSORS = [
  'globalAlpha',
  'lineDashOffset',
  'lineWidth',
  'strokeStyle'
];

var scratchVec2 = glMatrix.vec2.create();

function LineBuilder (regl, opts) {
  this.context = this.createContext(regl);
  this.state = this.createState(opts);
  this.resources = this.createResources();
  this.attributes = this.createAttributes();
  this.draw = this.createDrawCommand(opts);
}

inherit(null, LineBuilder, {
  createContext: function (regl) {
    return {
      regl: regl
    }
  },

  createState: function (opts) {
    var cursor = {
      vertex: 0,
      element: 0,
      quad: 0,
      stride: opts.stride || 2,
      max: opts.bufferSize || 1024
    };
    var sync = {
      vertex: 0
    };
    var style = {
      color: [0, 0, 0, 1],
      lineWidth: 1,
      strokeStyle: '#000000'
    };
    var transform = {
      isIdentity: true,
      matrix: glMatrix.mat2d.create()
    };
    return {
      cursor: cursor,
      sync: sync,
      style: style,
      transform: transform,
      activePath: null,
      prevPosition: glMatrix.vec2.create(),
      paths: [],
      saveStack: []
    }
  },

  createResources: function () {
    var regl = this.context.regl;
    var cursor = this.state.cursor;

    var views = this.createResourceViews(cursor.max, cursor.stride);
    var positionBuffer = regl.buffer({
      usage: 'dynamic',
      type: 'float',
      data: views.position
    });
    var offsetBuffer = regl.buffer({
      usage: 'dynamic',
      type: 'float',
      data: views.offset
    });
    var colorBuffer = regl.buffer({
      usage: 'dynamic',
      type: 'float',
      data: views.color
    });
    var udBuffer = regl.buffer({
      usage: 'dynamic',
      type: 'float',
      data: views.ud
    });
    var elementsBuffer = regl.elements({
      usage: 'dynamic',
      type: 'uint16',
      primitive: 'triangles',
      data: views.elements
    });

    return {
      position: {
        view: views.position,
        buffer: positionBuffer
      },
      offset: {
        view: views.offset,
        buffer: offsetBuffer
      },
      color: {
        view: views.color,
        buffer: colorBuffer
      },
      ud: {
        view: views.ud,
        buffer: udBuffer
      },
      elements: {
        view: views.elements,
        buffer: elementsBuffer
      }
    }
  },

  createResourceViews: function (size, stride) {
    return {
      position: new Float32Array(size * stride * 2),
      offset: new Float32Array(size * 2),
      color: new Float32Array(size * 4 * 2),
      ud: new Float32Array(size * 2 * 3),
      elements: new Uint16Array(size * 4)
    }
  },

  createAttributes: function () {
    var resources = this.resources;
    var stride = this.state.cursor.stride;
    var position = resources.position;
    var color = resources.color;
    var ud = resources.ud;
    var offset = resources.offset;

    return {
      prevPosition: {
        buffer: position.buffer,
        offset: 0,
        stride: FLOAT_BYTES * stride
      },
      currPosition: {
        buffer: position.buffer,
        offset: FLOAT_BYTES * stride * 2,
        stride: FLOAT_BYTES * stride
      },
      nextPosition: {
        buffer: position.buffer,
        offset: FLOAT_BYTES * stride * 4,
        stride: FLOAT_BYTES * stride
      },
      offset: offset.buffer,
      ud: ud.buffer,
      color: color.buffer
    }
  },

  combineDrawArgs: function (defaultArgs, userArgs) {
    var args = Object.assign({}, defaultArgs);
    Object.keys(userArgs).forEach(function (key) {
      if (key === 'uniforms' || key === 'attributes') {
        args[key] = Object.assign({}, defaultArgs[key], userArgs[key]);
      } else {
        args[key] = userArgs[key];
      }
    });
    return args
  },

  createDrawCommand: function (opts) {
    var attributes = this.attributes;
    var regl = this.context.regl;
    var resources = this.resources;
    var state = this.state;

    var uniforms = {
      aspect: function (params, context) {
        return params.viewportWidth / params.viewportHeight
      },

      thickness: function (params, context) {
        return context.thickness /
          (200 * params.viewportHeight / params.viewportWidth)
      },
      miterLimit: function (params, context) {
        return context.miterLimit /
          (200 * params.viewportHeight / params.viewportWidth)
      },
      model: regl.prop('model'),
      tint: regl.prop('tint')
    };
    var count = function () {
      return state.cursor.quad * 6
    };

    var defaultDrawArgs = {
      vert: line.vert,
      frag: line.frag,
      uniforms: uniforms,
      attributes: attributes,
      elements: resources.elements.buffer,
      count: count,
      depth: { enable: false },
      blend: {
        enable: true,
        equation: 'add',
        func: {
          src: 'src alpha',
          dst: 'one minus src alpha'
        }
      }
    };
    var drawArgs = opts.drawArgs
      ? this.combineDrawArgs(defaultDrawArgs, opts.drawArgs)
      : defaultDrawArgs;

    var drawCommand = regl(drawArgs);

    return function (params) {
      if (state.sync.vertex < state.cursor.vertex) {
        this.syncResourceBuffers();
        state.sync.vertex = state.cursor.vertex;
      }
      return drawCommand(params)
    }.bind(this)
  },

  syncResourceBuffers: function () {
    var resources = this.resources;
    var position = resources.position;
    var offset = resources.offset;
    var color = resources.color;
    var ud = resources.ud;
    var elements = resources.elements;
    var byteOffset = 0;

    position.buffer.subdata(position.view, byteOffset);
    offset.buffer.subdata(offset.view, byteOffset);
    color.buffer.subdata(color.view, byteOffset);
    ud.buffer.subdata(ud.view, byteOffset);
    elements.buffer.subdata(elements.view, byteOffset);
  },

  getContext: function () {
    var that = this;
    var state = this.state;
    var map = {};
    CONTEXT_METHODS.forEach(function (key) {
      map[key] = that[key].bind(that);
    });
    CONTEXT_ACCESSORS.forEach(function (key) {
      var accessor = that[key];
      Object.defineProperty(map, key, accessor(state));
    });
    return map
  },

  resize: function (size) {
    var cursor = this.state.cursor;
    var resources = this.resources;
    var nextViews = this.createResourceViews(size, cursor.stride);

    cursor.max = size;
    resources.position.view = nextViews.position;
    resources.position.buffer({
      data: nextViews.position });
    resources.offset.view = nextViews.offset;
    resources.offset.buffer({
      data: nextViews.offset });
    resources.color.view = nextViews.color;
    resources.color.buffer({
      data: nextViews.color });
    resources.ud.view = nextViews.ud;
    resources.ud.buffer({
      data: nextViews.ud });
    resources.elements.view = nextViews.elements;
    resources.elements.buffer({
      data: nextViews.elements });
  },

  reset: function () {
    var state = this.state;
    var cursor = state.cursor;
    var sync = state.sync;
    var style = state.style;
    var transform = state.transform;

    cursor.quad = 0;
    cursor.element = 0;
    cursor.vertex = 0;
    sync.vertex = 0;

    style.lineWidth = 1;
    style.color[0] = 0;
    style.color[1] = 0;
    style.color[2] = 0;
    style.color[3] = 1;

    transform.isIdentity = true;
    glMatrix.mat2d.identity(transform.matrix);

    state.activePath = null;
    state.paths.length = 0;
  },

  save: function () {
    var state = this.state;
    var style = state.style;
    var transform = state.transform;

    state.saveStack.push({
      style: {
        lineWidth: style.lineWidth,
        color: style.color.slice()
      },
      transform: {
        isIdentity: transform.isIdentity,
        matrix: glMatrix.mat2d.clone(transform.matrix)
      }
    });
  },

  restore: function () {
    var state = this.state;
    var style = state.style;
    var transform = state.transform;
    var prevState = state.saveStack.pop();
    var prevStyle = prevState.style;
    var prevTransform = prevState.transform;

    style.lineWidth = prevStyle.lineWidth;
    style.color = prevStyle.color;
    transform.isIdentity = prevTransform.isIdentity;
    transform.matrix = prevTransform.matrix;
  },

  beginPath: function () {
    var state = this.state;
    var activePath = state.activePath;
    var offset = !activePath ? 0
      : activePath.offset + activePath.count;

    var nextPath = {
      offset: offset,
      count: 0,
      totalLength: 0,
      isClosed: false
    };

    state.activePath = nextPath;
    state.paths.push(nextPath);
  },

  moveTo: function (x, y) {
    var state = this.state;
    var activePath = state.activePath;
    var prevPosition = state.prevPosition;

    var cursor = state.cursor;
    var stride = cursor.stride;
    var color = state.style.color;
    var lineWidth = state.style.lineWidth * 0.5;

    var resources = this.resources;
    var positionView = resources.position.view;
    var offsetView = resources.offset.view;
    var udView = resources.ud.view;
    var colorView = resources.color.view;

    var pos = this.transformInput(x, y);

    var aix = cursor.vertex * stride * 2;
    var aiy = aix + 1;
    var bix = (cursor.vertex + 1) * stride * 2;
    var biy = bix + 1;
    positionView[aix] = positionView[aix + stride] = pos[0];
    positionView[aiy] = positionView[aiy + stride] = pos[1];
    positionView[bix] = positionView[bix + stride] = pos[0];
    positionView[biy] = positionView[biy + stride] = pos[1];

    var ais = cursor.vertex * 2;
    var bis = (cursor.vertex + 1) * 2;
    offsetView[ais + 0] = lineWidth;
    offsetView[ais + 1] = -lineWidth;
    offsetView[bis + 0] = lineWidth;
    offsetView[bis + 1] = -lineWidth;

    var aiu = cursor.vertex * 2 * 2;
    var aid = aiu + 1;
    var biu = (cursor.vertex + 1) * 2 * 2;
    var bid = biu + 1;
    udView[aiu] = 1;
    udView[aiu + 2] = -1;
    udView[biu] = 1;
    udView[biu + 2] = -1;
    udView[aid] = udView[aid + 2] = 0;
    udView[bid] = udView[bid + 2] = 0;

    var air = cursor.vertex * 4 * 2;
    var aig = air + 1;
    var aib = air + 2;
    var aia = air + 3;
    var bir = (cursor.vertex + 1) * 4 * 2;
    var big = bir + 1;
    var bib = bir + 2;
    var bia = bir + 3;
    colorView[air] = colorView[air + 4] = color[0];
    colorView[aig] = colorView[aig + 4] = color[1];
    colorView[aib] = colorView[aib + 4] = color[2];
    colorView[aia] = colorView[aia + 4] = color[3];
    colorView[bir] = colorView[bir + 4] = color[0];
    colorView[big] = colorView[big + 4] = color[1];
    colorView[bib] = colorView[bib + 4] = color[2];
    colorView[bia] = colorView[bia + 4] = color[3];

    glMatrix.vec2.copy(prevPosition, pos);
    activePath.count += 1;
    cursor.vertex += 2;
  },

  lineTo: function (x, y) {
    var state = this.state;
    var activePath = state.activePath;
    var prevPosition = state.prevPosition;

    var cursor = state.cursor;
    var stride = cursor.stride;
    var color = state.style.color;
    var lineWidth = state.style.lineWidth * 0.5;

    var resources = this.resources;
    var positionView = resources.position.view;
    var offsetView = resources.offset.view;
    var colorView = resources.color.view;
    var udView = resources.ud.view;
    var elementsView = resources.elements.view;

    var pos = this.transformInput(x, y);
    var segmentLength = glMatrix.vec2.distance(prevPosition, pos);
    var totalLength = activePath.totalLength += segmentLength;

    var aix = cursor.vertex * stride * 2;
    var aiy = aix + 1;
    positionView[aix] = positionView[aix + stride] = pos[0];
    positionView[aiy] = positionView[aiy + stride] = pos[1];

    var ais = cursor.vertex * 2;
    offsetView[ais] = lineWidth;
    offsetView[ais + 1] = -lineWidth;

    var aiu = (cursor.vertex - 1) * 2 * 2;
    var aid = aiu + 1;
    udView[aiu] = 1;
    udView[aiu + 2] = -1;
    udView[aid] = udView[aid + 2] = totalLength;

    var air = cursor.vertex * 4 * 2;
    var aig = air + 1;
    var aib = air + 2;
    var aia = air + 3;
    colorView[air] = colorView[air + 4] = color[0];
    colorView[aig] = colorView[aig + 4] = color[1];
    colorView[aib] = colorView[aib + 4] = color[2];
    colorView[aia] = colorView[aia + 4] = color[3];

    var evi = cursor.quad * 6;
    var aio = cursor.element;
    var bio = aio + 1;
    var cio = aio + 2;
    var dio = aio + 3;
    elementsView[evi + 0] = aio;
    elementsView[evi + 1] = bio;
    elementsView[evi + 2] = cio;
    elementsView[evi + 3] = cio;
    elementsView[evi + 4] = bio;
    elementsView[evi + 5] = dio;

    glMatrix.vec2.copy(prevPosition, pos);
    activePath.count += 1;
    cursor.quad += 1;
    cursor.element += 2;
    cursor.vertex += 1;
  },

  arc: function (x, y, radius, startAngle, endAngle, anticlockwise) {
    var delta = Math.abs(endAngle - startAngle);
    var dir = anticlockwise === true ? -1 : 1;
    var count = Math.ceil(delta / (Math.PI / 10));

    for (var i = 0; i < count; i++) {
      var t = i / (count - 1);
      var angle = startAngle + t * delta * dir;
      var ax = x + Math.cos(angle) * radius;
      var ay = y + Math.sin(angle) * radius;

      if (i === 0) this.moveTo(ax, ay);
      else this.lineTo(ax, ay);
    }
  },

  closePath: function () {
    var state = this.state;
    var activePath = state.activePath;
    var cursor = state.cursor;
    var stride = cursor.stride;

    var resources = this.resources;
    var positionView = resources.position.view;

    var bi = cursor.vertex - activePath.count;
    var bix = bi * stride * 2;
    var biy = bix + 1;

    var x = positionView[bix];
    var y = positionView[biy];

    activePath.isClosed = true;
    this.lineTo(x, y);
  },

  copyPosition: function (ai, bi) {
    var state = this.state;
    var cursor = state.cursor;
    var stride = cursor.stride;

    var resources = this.resources;
    var positionView = resources.position.view;

    var aix = ai * stride * 2;
    var aiy = aix + 1;
    var bix = bi * stride * 2;
    var biy = bix + 1;

    positionView[aix] = positionView[aix + stride] = positionView[bix];
    positionView[aiy] = positionView[aiy + stride] = positionView[biy];
  },

  stroke: function () {
    var state = this.state;
    var activePath = state.activePath;
    var cursor = state.cursor;
    var stride = cursor.stride;

    var resources = this.resources;
    var positionView = resources.position.view;
    var offsetView = resources.offset.view;
    var udView = resources.ud.view;
    var colorView = resources.color.view;

    var si = cursor.vertex - activePath.count;
    var bi = cursor.vertex - 1;
    var ai = cursor.vertex;

    var bix = bi * stride * 2;
    var biy = bix + 1;
    var aix = ai * stride * 2;
    var aiy = aix + 1;
    positionView[aix] = positionView[aix + stride] = positionView[bix];
    positionView[aiy] = positionView[aiy + stride] = positionView[biy];

    var bis = bi * 2;
    var ais = ai * 2;
    offsetView[ais] = offsetView[bis];
    offsetView[ais + 1] = offsetView[bis + 1];

    var biu = bi * 2 * 2;
    var bid = biu + 1;
    var aiu = ai * 2 * 2;
    var aid = aiu + 1;
    udView[aiu] = 1;
    udView[aiu + 2] = -1;
    udView[aid] = udView[aid + 2] = udView[bid];

    var bir = bi * 4 * 2;
    var big = bir + 1;
    var bib = bir + 2;
    var bia = bir + 3;
    var air = ai * 4 * 2;
    var aig = air + 1;
    var aib = air + 2;
    var aia = air + 3;
    colorView[air] = colorView[air + 4] = colorView[bir];
    colorView[aig] = colorView[aig + 4] = colorView[big];
    colorView[aib] = colorView[aib + 4] = colorView[bib];
    colorView[aia] = colorView[aia + 4] = colorView[bia];

    cursor.element += 6;
    cursor.vertex += 1;

    if (activePath.isClosed) {
      this.copyPosition(si - 1, bi - 1);
      this.copyPosition(ai, si + 1);
    }
  },

  strokeRect: function (x, y, width, height) {
    this.beginPath();
    this.moveTo(x, y);
    this.lineTo(x + width, y);
    this.lineTo(x + width, y + height);
    this.lineTo(x, y + height);
    this.closePath();
    this.stroke();
  },

  lineWidth: function (state) {
    return {
      get: function () {
        return state.style.lineWidth
      },
      set: function (lineWidth) {
        state.style.lineWidth = lineWidth;
        return lineWidth
      }
    }
  },

  globalAlpha: function (state) {
    return {
      get: function () {
        return state.style.color[3]
      },
      set: function (globalAlpha) {
        state.style.color[3] = globalAlpha;
        return globalAlpha
      }
    }
  },

  strokeStyle: function (state) {
    return {
      get: function () {
        return state.style.strokeStyle
      },
      set: function (strokeStyle) {
        var color = state.style.color;
        setRGB(color, strokeStyle);
        state.style.strokeStyle = strokeStyle;
        return strokeStyle
      }
    }
  },

  lineDashOffset: function () {
    return {
      get: warnOnce('lineDashOffset not implemented'),
      set: warnOnce('lineDashOffset not implemented')
    }
  },

  setLineDash: warnOnce('setLineDash not implemented'),

  setTransform: function (a, b, c, d, dx, dy) {
    var transform = this.state.transform;
    glMatrix.mat2d.set(transform.matrix, a, b, c, d, dx, dy);
    transform.isIdentity = false;
  },

  translate: function (x, y) {
    var transform = this.state.transform;
    var translation = glMatrix.vec2.set(scratchVec2, x, y);
    glMatrix.mat2d.translate(transform.matrix, transform.matrix, translation);
    transform.isIdentity = false;
  },

  scale: function (x, y) {
    var transform = this.state.transform;
    var scale = glMatrix.vec2.set(scratchVec2, x, y);
    glMatrix.mat2d.scale(transform.matrix, transform.matrix, scale);
    transform.isIdentity = false;
  },

  rotate: function (angle) {
    var transform = this.state.transform;
    glMatrix.mat2d.rotate(transform.matrix, transform.matrix, angle);
    transform.isIdentity = false;
  },

  transformInput: function (x, y) {
    var activePath = this.state.activePath;
    var transform = this.state.transform;
    var pos = glMatrix.vec2.set(scratchVec2, x, y);

    if (!transform.isIdentity && !activePath.isClosed) {
      glMatrix.vec2.transformMat2d(pos, pos, transform.matrix);
    }
    return pos
  }
});

exports.LineBuilder = LineBuilder;
exports.line = line;

Object.defineProperty(exports, '__esModule', { value: true });

})));
