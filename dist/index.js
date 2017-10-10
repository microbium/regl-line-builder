(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.REGLLineBuilder = {})));
}(this, (function (exports) { 'use strict';

let ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;

function create$1() {
  let out = new ARRAY_TYPE(6);
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = 0;
  out[5] = 0;
  return out;
}

function clone$1(a) {
  let out = new ARRAY_TYPE(6);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  return out;
}

function identity$1(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = 0;
  out[5] = 0;
  return out;
}

function set$1(out, a, b, c, d, tx, ty) {
  out[0] = a;
  out[1] = b;
  out[2] = c;
  out[3] = d;
  out[4] = tx;
  out[5] = ty;
  return out;
}

function rotate$1(out, a, rad) {
  let a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
  let s = Math.sin(rad);
  let c = Math.cos(rad);
  out[0] = a0 *  c + a2 * s;
  out[1] = a1 *  c + a3 * s;
  out[2] = a0 * -s + a2 * c;
  out[3] = a1 * -s + a3 * c;
  out[4] = a4;
  out[5] = a5;
  return out;
}

function scale$1(out, a, v) {
  let a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
  let v0 = v[0], v1 = v[1];
  out[0] = a0 * v0;
  out[1] = a1 * v0;
  out[2] = a2 * v1;
  out[3] = a3 * v1;
  out[4] = a4;
  out[5] = a5;
  return out;
}

function translate(out, a, v) {
  let a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
  let v0 = v[0], v1 = v[1];
  out[0] = a0;
  out[1] = a1;
  out[2] = a2;
  out[3] = a3;
  out[4] = a0 * v0 + a2 * v1 + a4;
  out[5] = a1 * v0 + a3 * v1 + a5;
  return out;
}

function create$2() {
  let out = new ARRAY_TYPE(9);
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 1;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}

function create$5() {
  let out = new ARRAY_TYPE(3);
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  return out;
}

function length$1(a) {
  let x = a[0];
  let y = a[1];
  let z = a[2];
  return Math.sqrt(x*x + y*y + z*z);
}

function fromValues$5(x, y, z) {
  let out = new ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

function normalize$1(out, a) {
  let x = a[0];
  let y = a[1];
  let z = a[2];
  let len = x*x + y*y + z*z;
  if (len > 0) {

    len = 1 / Math.sqrt(len);
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
  }
  return out;
}

function dot$1(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(out, a, b) {
  let ax = a[0], ay = a[1], az = a[2];
  let bx = b[0], by = b[1], bz = b[2];

  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}

const len$1 = length$1;

const forEach = (function() {
  let vec = create$5();

  return function(a, stride, offset, count, fn, arg) {
    let i, l;
    if(!stride) {
      stride = 3;
    }

    if(!offset) {
      offset = 0;
    }

    if(count) {
      l = Math.min((count * stride) + offset, a.length);
    } else {
      l = a.length;
    }

    for(i = offset; i < l; i += stride) {
      vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2];
      fn(vec, vec, arg);
      a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2];
    }

    return a;
  };
})();

function create$6() {
  let out = new ARRAY_TYPE(4);
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  return out;
}

function normalize$2(out, a) {
  let x = a[0];
  let y = a[1];
  let z = a[2];
  let w = a[3];
  let len = x*x + y*y + z*z + w*w;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
    out[0] = x * len;
    out[1] = y * len;
    out[2] = z * len;
    out[3] = w * len;
  }
  return out;
}

const forEach$1 = (function() {
  let vec = create$6();

  return function(a, stride, offset, count, fn, arg) {
    let i, l;
    if(!stride) {
      stride = 4;
    }

    if(!offset) {
      offset = 0;
    }

    if(count) {
      l = Math.min((count * stride) + offset, a.length);
    } else {
      l = a.length;
    }

    for(i = offset; i < l; i += stride) {
      vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2]; vec[3] = a[i+3];
      fn(vec, vec, arg);
      a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2]; a[i+3] = vec[3];
    }

    return a;
  };
})();

function create$4() {
  let out = new ARRAY_TYPE(4);
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}

function setAxisAngle(out, axis, rad) {
  rad = rad * 0.5;
  let s = Math.sin(rad);
  out[0] = s * axis[0];
  out[1] = s * axis[1];
  out[2] = s * axis[2];
  out[3] = Math.cos(rad);
  return out;
}

function slerp(out, a, b, t) {

  let ax = a[0], ay = a[1], az = a[2], aw = a[3];
  let bx = b[0], by = b[1], bz = b[2], bw = b[3];

  let omega, cosom, sinom, scale0, scale1;

  cosom = ax * bx + ay * by + az * bz + aw * bw;

  if ( cosom < 0.0 ) {
    cosom = -cosom;
    bx = - bx;
    by = - by;
    bz = - bz;
    bw = - bw;
  }

  if ( (1.0 - cosom) > 0.000001 ) {

    omega  = Math.acos(cosom);
    sinom  = Math.sin(omega);
    scale0 = Math.sin((1.0 - t) * omega) / sinom;
    scale1 = Math.sin(t * omega) / sinom;
  } else {

    scale0 = 1.0 - t;
    scale1 = t;
  }

  out[0] = scale0 * ax + scale1 * bx;
  out[1] = scale0 * ay + scale1 * by;
  out[2] = scale0 * az + scale1 * bz;
  out[3] = scale0 * aw + scale1 * bw;

  return out;
}

function fromMat3(out, m) {

  let fTrace = m[0] + m[4] + m[8];
  let fRoot;

  if ( fTrace > 0.0 ) {

    fRoot = Math.sqrt(fTrace + 1.0);
    out[3] = 0.5 * fRoot;
    fRoot = 0.5/fRoot;
    out[0] = (m[5]-m[7])*fRoot;
    out[1] = (m[6]-m[2])*fRoot;
    out[2] = (m[1]-m[3])*fRoot;
  } else {

    let i = 0;
    if ( m[4] > m[0] )
      i = 1;
    if ( m[8] > m[i*3+i] )
      i = 2;
    let j = (i+1)%3;
    let k = (i+2)%3;

    fRoot = Math.sqrt(m[i*3+i]-m[j*3+j]-m[k*3+k] + 1.0);
    out[i] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot;
    out[3] = (m[j*3+k] - m[k*3+j]) * fRoot;
    out[j] = (m[j*3+i] + m[i*3+j]) * fRoot;
    out[k] = (m[k*3+i] + m[i*3+k]) * fRoot;
  }

  return out;
}

const normalize = normalize$2;

const rotationTo = (function() {
  let tmpvec3 = create$5();
  let xUnitVec3 = fromValues$5(1,0,0);
  let yUnitVec3 = fromValues$5(0,1,0);

  return function(out, a, b) {
    let dot = dot$1(a, b);
    if (dot < -0.999999) {
      cross(tmpvec3, xUnitVec3, a);
      if (len$1(tmpvec3) < 0.000001)
        cross(tmpvec3, yUnitVec3, a);
      normalize$1(tmpvec3, tmpvec3);
      setAxisAngle(out, tmpvec3, Math.PI);
      return out;
    } else if (dot > 0.999999) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      return out;
    } else {
      cross(tmpvec3, a, b);
      out[0] = tmpvec3[0];
      out[1] = tmpvec3[1];
      out[2] = tmpvec3[2];
      out[3] = 1 + dot;
      return normalize(out, out);
    }
  };
})();

const sqlerp = (function () {
  let temp1 = create$4();
  let temp2 = create$4();

  return function (out, a, b, c, d, t) {
    slerp(temp1, a, d, t);
    slerp(temp2, b, c, t);
    slerp(out, temp1, temp2, 2 * t * (1 - t));

    return out;
  };
}());

const setAxes = (function() {
  let matr = create$2();

  return function(out, view, right, up) {
    matr[0] = right[0];
    matr[3] = right[1];
    matr[6] = right[2];

    matr[1] = up[0];
    matr[4] = up[1];
    matr[7] = up[2];

    matr[2] = -view[0];
    matr[5] = -view[1];
    matr[8] = -view[2];

    return normalize(out, fromMat3(out, matr));
  };
})();

function create$7() {
  let out = new ARRAY_TYPE(2);
  out[0] = 0;
  out[1] = 0;
  return out;
}

function copy$7(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  return out;
}

function set$7(out, x, y) {
  out[0] = x;
  out[1] = y;
  return out;
}

function distance$2(a, b) {
  var x = b[0] - a[0],
    y = b[1] - a[1];
  return Math.sqrt(x*x + y*y);
}

function transformMat2d(out, a, m) {
  var x = a[0],
    y = a[1];
  out[0] = m[0] * x + m[2] * y + m[4];
  out[1] = m[1] * x + m[3] * y + m[5];
  return out;
}

const forEach$2 = (function() {
  let vec = create$7();

  return function(a, stride, offset, count, fn, arg) {
    let i, l;
    if(!stride) {
      stride = 2;
    }

    if(!offset) {
      offset = 0;
    }

    if(count) {
      l = Math.min((count * stride) + offset, a.length);
    } else {
      l = a.length;
    }

    for(i = offset; i < l; i += stride) {
      vec[0] = a[i]; vec[1] = a[i+1];
      fn(vec, vec, arg);
      a[i] = vec[0]; a[i+1] = vec[1];
    }

    return a;
  };
})();

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

var vert = "// Based on WebGL lines demo\n// (c) 2015 Matt DesLauriers. MIT License\n// https://github.com/mattdesl/webgl-lines/\n\nprecision highp float;\n#define GLSLIFY 1\n\nuniform mat4 projection;\nuniform mat4 model;\nuniform mat4 view;\nuniform float aspect;\n\nuniform float thickness;\nuniform float miterLimit;\n\n// TODO: Enable compiling for 2 or 3 dimensional lines\nattribute vec2 prevPosition;\nattribute vec2 currPosition;\nattribute vec2 nextPosition;\n// attribute vec3 prevPosition;\n// attribute vec3 currPosition;\n// attribute vec3 nextPosition;\n\nattribute float offset;\nattribute vec4 color;\nattribute vec2 ud;\n\nvarying vec4 vColor;\nvarying vec2 vUD;\n\nvoid main() {\n  vec2 aspectVec = vec2(aspect, 1.0);\n  mat4 projViewModel = projection * view * model;\n\n  // TODO: Refactor to import/export as standalone function\n  vec4 prevProjected = projViewModel * vec4(prevPosition, 0.0, 1.0);\n  vec4 currProjected = projViewModel * vec4(currPosition, 0.0, 1.0);\n  vec4 nextProjected = projViewModel * vec4(nextPosition, 0.0, 1.0);\n\n  // get 2D screen space with W divide and aspect correction\n  vec2 prevScreen = prevProjected.xy / prevProjected.w * aspectVec;\n  vec2 currScreen = currProjected.xy / currProjected.w * aspectVec;\n  vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;\n\n  vec2 dir = vec2(0.0);\n  float len = thickness;\n\n  // starting point uses (next - current)\n  if (currScreen == prevScreen) {\n    dir = normalize(nextScreen - currScreen);\n  }\n  // ending point uses (current - previous)\n  else if (currScreen == nextScreen) {\n    dir = normalize(currScreen - prevScreen);\n  }\n  // somewhere in middle, needs a join\n  else {\n    // get directions from (C - B) and (B - A)\n    vec2 dirA = normalize((currScreen - prevScreen));\n    if (int(miterLimit) == -1) {\n      dir = dirA;\n    } else {\n      vec2 dirB = normalize((nextScreen - currScreen));\n      // now compute the miter join normal and length\n      vec2 tangent = normalize(dirA + dirB);\n      vec2 perp = vec2(-dirA.y, dirA.x);\n      vec2 miter = vec2(-tangent.y, tangent.x);\n      dir = tangent;\n      len /= dot(miter, perp);\n    }\n  }\n\n  vec2 normal = vec2(-dir.y, dir.x) *\n    clamp(len, 0.0, max(thickness, miterLimit)) / aspectVec;\n\n  vColor = color;\n  vUD = ud;\n\n  gl_Position = currProjected + vec4(normal * offset, 0.0, 1.0);\n}\n";

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

var scratchVec2 = create$7();

function LineBuilder (regl, opts) {
  this.context = this.createContext(regl);
  this.state = this.createState(opts);
  this.resources = this.createResources();
  this.attributes = this.createAttributes();
  this.draw = this.createDrawCommand();
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
      matrix: create$1()
    };
    return {
      cursor: cursor,
      sync: sync,
      style: style,
      transform: transform,
      activePath: null,
      prevPosition: create$7(),
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

  createDrawCommand: function () {
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

    var drawCommand = regl({
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
    });

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
    identity$1(transform.matrix);

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
        matrix: clone$1(transform.matrix)
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
    udView[aiu] = 0;
    udView[aiu + 2] = 1;
    udView[biu] = 0;
    udView[biu + 2] = 1;
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

    copy$7(prevPosition, pos);
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
    var segmentLength = distance$2(prevPosition, pos);
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
    udView[aiu] = 0;
    udView[aiu + 2] = 1;
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

    copy$7(prevPosition, pos);
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
      var angle$$1 = startAngle + t * delta * dir;
      var ax = x + Math.cos(angle$$1) * radius;
      var ay = y + Math.sin(angle$$1) * radius;

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
    udView[aiu] = 0;
    udView[aiu + 2] = 1;
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
    set$1(transform.matrix, a, b, c, d, dx, dy);
    transform.isIdentity = false;
  },

  translate: function (x, y) {
    var transform = this.state.transform;
    var translation = set$7(scratchVec2, x, y);
    translate(transform.matrix, transform.matrix, translation);
    transform.isIdentity = false;
  },

  scale: function (x, y) {
    var transform = this.state.transform;
    var scale$$1 = set$7(scratchVec2, x, y);
    scale$1(transform.matrix, transform.matrix, scale$$1);
    transform.isIdentity = false;
  },

  rotate: function (angle$$1) {
    var transform = this.state.transform;
    rotate$1(transform.matrix, transform.matrix, angle$$1);
    transform.isIdentity = false;
  },

  transformInput: function (x, y) {
    var activePath = this.state.activePath;
    var transform = this.state.transform;
    var pos = set$7(scratchVec2, x, y);

    if (!transform.isIdentity && !activePath.isClosed) {
      transformMat2d(pos, pos, transform.matrix);
    }
    return pos
  }
});

exports.LineBuilder = LineBuilder;
exports.line = line;

Object.defineProperty(exports, '__esModule', { value: true });

})));
