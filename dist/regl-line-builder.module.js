import { vec2, vec3, mat2d, mat4 } from 'gl-matrix';
import triangulate from 'earcut';

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

function LinePath (opts) {
  this.dimensions = opts.dimensions;
  this.offset = 0;
  this.count = 0;
  this.totalLength = 0;
  this.isClosed = false;
  this.points = [];
}

inherit(null, LinePath, {
  reset: function () {
    this.offset = 0;
    this.count = 0;
    this.totalLength = 0;
    this.isClosed = false;
  },

  addPoint: function (pos) {
    var points = this.points;
    var dimensions = this.dimensions;
    var nextPoint = points[this.count++];

    if (!nextPoint) {
      nextPoint = dimensions === 2 ? vec2.create() : vec3.create();
      points.push(nextPoint);
    }

    if (dimensions === 2) {
      vec2.copy(nextPoint, pos);
    } else {
      vec3.copy(nextPoint, pos);
    }
  }
});

function setRGB (out, color) {
  var hexString = parseInt(color.replace(/^#/, ''), 16);
  var hex = Math.floor(hexString);
  out[0] = (hex >> 16 & 255) / 255;
  out[1] = (hex >> 8 & 255) / 255;
  out[2] = (hex & 255) / 255;
}

function clamp (x, min, max) {
  return Math.max(Math.min(x, max), min)
}

var frag = "precision highp float;\n#define GLSLIFY 1\nuniform vec4 tint;\nvarying vec4 vColor;\nvarying vec2 vUD;\n\nvoid main() {\n  gl_FragColor = vColor * tint;\n}\n";

var vert = "precision highp float;\n#define GLSLIFY 1\n\n// Based on WebGL lines demo\n// (c) 2015 Matt DesLauriers. MIT License\n// https://github.com/mattdesl/webgl-lines/\n\n// TODO: Maybe make separate package to make reuse with custom shaders easier?\n// TODO: Maybe use struct to pass some of this data?\nvec2 computeMiterOffset (\n  mat4 projection_0,\n  int adjustProjectedThickness_0,\n  float aspect_0,\n  float thickness_0,\n  float miterLimit_0,\n  float prevId_0,\n  float currId_0,\n  float nextId_0,\n  vec4 prevProjected_0,\n  vec4 currProjected_0,\n  vec4 nextProjected_0\n) {\n  vec2 aspectVec = vec2(aspect_0, 1.0);\n\n  // get 2D screen space with W divide and aspect correction\n  vec2 prevScreen = prevProjected_0.xy / prevProjected_0.w * aspectVec;\n  vec2 currScreen = currProjected_0.xy / currProjected_0.w * aspectVec;\n  vec2 nextScreen = nextProjected_0.xy / nextProjected_0.w * aspectVec;\n\n  float thicknessScale = 1.0;\n  if (adjustProjectedThickness_0 == 1) {\n    vec4 singlePixelProjected = projection_0 * vec4(2.0, 0.0, 0.0, 1.0);\n    vec2 singlePixel = singlePixelProjected.xy / singlePixelProjected.w * aspectVec;\n    thicknessScale = singlePixel.x;\n  }\n\n  vec2 dir = vec2(0.0);\n  float len = thickness_0 * thicknessScale;\n\n  // starting point uses (next - current)\n  if (currId_0 > prevId_0) {\n    dir = normalize(nextScreen - currScreen);\n  }\n  // ending point uses (current - previous)\n  else if (currId_0 < nextId_0) {\n    dir = normalize(currScreen - prevScreen);\n  }\n  // somewhere in middle, needs a join\n  else {\n    // get directions from (C - B) and (B - A)\n    vec2 dirA = normalize((currScreen - prevScreen));\n    if (int(miterLimit_0) == -1) {\n      dir = dirA;\n    } else {\n      vec2 dirB = normalize((nextScreen - currScreen));\n      // now compute the miter join normal and length\n      vec2 tangent = normalize(dirA + dirB);\n      vec2 perp = vec2(-dirA.y, dirA.x);\n      vec2 miter = vec2(-tangent.y, tangent.x);\n      dir = tangent;\n      len /= dot(miter, perp);\n    }\n  }\n\n  return vec2(-dir.y, dir.x) *\n    clamp(len, 0.0, miterLimit_0 * thicknessScale) / aspectVec;\n}\n\nuniform mat4 projection;\nuniform mat4 model;\nuniform mat4 view;\nuniform float aspect;\nuniform int adjustProjectedThickness;\n\nuniform float thickness;\nuniform float miterLimit;\n\n#ifdef DIMENSIONS_3\nattribute vec3 prevPosition;\nattribute vec3 currPosition;\nattribute vec3 nextPosition;\n#else\nattribute vec2 prevPosition;\nattribute vec2 currPosition;\nattribute vec2 nextPosition;\n#endif\n\nattribute float prevId;\nattribute float currId;\nattribute float nextId;\n\nattribute float offset;\nattribute vec4 color;\nattribute vec2 ud;\n\nvarying vec4 vColor;\nvarying vec2 vUD;\n\nvoid main() {\n  mat4 projViewModel = projection * view * model;\n\n#ifdef DIMENSIONS_3\n  vec4 prevProjected = projViewModel * vec4(prevPosition, 1.0);\n  vec4 currProjected = projViewModel * vec4(currPosition, 1.0);\n  vec4 nextProjected = projViewModel * vec4(nextPosition, 1.0);\n#else\n  vec4 prevProjected = projViewModel * vec4(prevPosition, 0.0, 1.0);\n  vec4 currProjected = projViewModel * vec4(currPosition, 0.0, 1.0);\n  vec4 nextProjected = projViewModel * vec4(nextPosition, 0.0, 1.0);\n#endif\n\n  vec2 miterOffset = computeMiterOffset(\n    projection, adjustProjectedThickness,\n    aspect, thickness, miterLimit,\n    prevId, currId, nextId,\n    prevProjected, currProjected, nextProjected);\n\n  vColor = color;\n  vUD = ud;\n\n  gl_Position = currProjected + vec4(miterOffset * offset, 0.0, 1.0);\n}\n";

var line = {
  frag: frag,
  vert: vert
};

var frag$1 = "precision highp float;\n#define GLSLIFY 1\nuniform vec4 tint;\nvarying vec4 vColor;\n\nvoid main() {\n  gl_FragColor = vColor * tint;\n}\n";

var vert$1 = "precision highp float;\n#define GLSLIFY 1\n\nuniform mat4 projection;\nuniform mat4 model;\nuniform mat4 view;\n\n#ifdef DIMENSIONS_3\n\tattribute vec3 position;\n#else\n\tattribute vec2 position;\n#endif\n\nattribute vec4 color;\nattribute float id;\n\nvarying vec4 vColor;\n\nvoid main() {\n  mat4 projViewModel = projection * view * model;\n\n#ifdef DIMENSIONS_3\n  vec4 posProjected = projViewModel * vec4(position, 1.0);\n#else\n  vec4 posProjected = projViewModel * vec4(position, 0.0, 1.0);\n#endif\n\n  vColor = color;\n\n  gl_Position = posProjected * vec4(0.5, 0.5, 0.0, 1.0);\n}\n";

var fill = {
  frag: frag$1,
  vert: vert$1
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
  'fill',
  'setTransform',
  'translate',
  'scale',
  'rotate',
  'save',
  'restore'
];
var CONTEXT_ACCESSORS = [
  'globalAlpha',
  'lineWidth',
  'strokeStyle',
  'fillStyle'
];
var MAX_UINT16_INT = 65536;

var scratchVec = vec3.create();

function LineBuilder (regl, opts_) {
  var opts = opts_ || {};
  opts.dimensions = clamp(opts.dimensions || 2, 2, 3);
  opts.bufferSize = opts.bufferSize || 1024;

  this.ctorOptions = opts;
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
    var is3d = opts.dimensions === 3;
    var cursor = {
      vertex: 0,
      element: 0,
      quad: 0,
      fillVertex: 0,
      fillElement: 0,
      fillTri: 0,
      dimensions: opts.dimensions,
      max: opts.bufferSize
    };
    var sync = {
      vertex: 0
    };
    var style = {
      color: new Float32Array([0, 0, 0, 1]),
      lineWidth: 1,
      strokeStyle: '#000000',
      fillColor: new Float32Array([0, 0, 0, 1]),
      fillStyle: '#000000'
    };
    var transform = {
      isIdentity: true,
      matrix: is3d ? mat4.create() : mat2d.create()
    };
    return {
      is3d: is3d,
      cursor: cursor,
      sync: sync,
      style: style,
      transform: transform,
      activePath: null,
      prevPosition: vec3.create(),
      saveStack: [],
      pathCount: 0,
      scratchPath: LinePath.create({
        dimensions: opts.dimensions
      })
    }
  },

  createResources: function () {
    var regl = this.context.regl;
    var cursor = this.state.cursor;

    var views = this.createResourceViews(cursor.max, cursor.dimensions);
    var linesViews = views.lines.views;
    var fillsViews = views.fills.views;

    var linesBuffer = regl.buffer({
      usage: 'dynamic',
      type: 'float',
      data: views.lines.dataView
    });
    var fillsBuffer = regl.buffer({
      usage: 'dynamic',
      type: 'float',
      data: views.fills.dataView
    });
    var elementsBuffer = regl.elements({
      usage: 'dynamic',
      primitive: 'triangles',
      data: views.elements
    });
    var fillElementsBuffer = regl.elements({
      usage: 'dynamic',
      primitive: 'triangles',
      data: views.fillElements
    });

    return {
      lines: {
        view: views.lines.dataView,
        locs: views.lines.locs,
        buffer: linesBuffer
      },
      fills: {
        view: views.fills.dataView,
        locs: views.fills.locs,
        buffer: fillsBuffer
      },
      elements: {
        view: views.elements,
        buffer: elementsBuffer
      },
      fillElements: {
        view: views.fillElements,
        buffer: fillElementsBuffer
      },
      position: {
        view: linesViews.position
      },
      offset: {
        view: linesViews.offset
      },
      color: {
        view: linesViews.color
      },
      ud: {
        view: linesViews.ud
      },
      id: {
        view: linesViews.id
      },
      fillPosition: {
        view: fillsViews.fillPosition
      },
      fillColor: {
        view: fillsViews.fillColor
      },
      fillId: {
        view: fillsViews.fillId
      }
    }
  },

  createResourceViews: function (size, dimensions) {
    var ElementsArrayCtor = this.getElementsCtor(size);
    var lines = this.createLinesResourceViews(size, dimensions);
    var fills = this.createFillsResourceViews(size, dimensions);
    return {
      lines: lines,
      fills: fills,
      elements: new ElementsArrayCtor(size * 4),
      fillElements: new ElementsArrayCtor(size * 3)
    }
  },

  createLinesResourceViews: function (size, dimensions) {
    return this.createResourceViewsForSizes([
      ['position', size * 2 * dimensions],
      ['offset', size * 2 * 1],
      ['color', size * 2 * 4],
      ['ud', size * 2 * 2],
      ['id', size * 2 * 1]
    ])
  },

  createFillsResourceViews: function (size, dimensions) {
    return this.createResourceViewsForSizes([
      ['fillPosition', size * dimensions],
      ['fillColor', size * 4],
      ['fillId', size * 1]
    ])
  },

  createResourceViewsForSizes: function (sizes) {
    var locs = sizes.reduce((state, [name, size]) => {
      state.data[name] = {
        offset: state.offset,
        size: size
      };
      state.offset += size;
      return state
    }, { offset: 0, data: {} });

    var data = new ArrayBuffer(locs.offset * FLOAT_BYTES);
    var dataView = new Float32Array(data);
    var views = sizes.reduce((state, [name, size]) => {
      state.data[name] = new Float32Array(data, state.offset * FLOAT_BYTES, size);
      state.offset += size;
      return state
    }, { offset: 0, data: {} });

    return {
      data: data,
      dataView: dataView,
      locs: locs.data,
      views: views.data
    }
  },

  getElementsCtor (size) {
    var isBig = size * 4 * 2 > MAX_UINT16_INT;
    var hasElementIndexExt = this.context.regl.hasExtension('OES_element_index_uint');
    if (isBig && !hasElementIndexExt) {
      throw new Error(
        'bufferSize is too big for Uint16Array, ' +
        'please enable OES_element_index_uint extension.')
    }
    return isBig && hasElementIndexExt
      ? Uint32Array : Uint16Array
  },

  createAttributes: function () {
    var resources = this.resources;
    var dimensions = this.state.cursor.dimensions;
    var lines = resources.lines;
    var fills = resources.fills;

    return {
      line: {
        prevPosition: {
          buffer: lines.buffer,
          offset: 0,
          stride: FLOAT_BYTES * dimensions
        },
        currPosition: {
          buffer: lines.buffer,
          offset: FLOAT_BYTES * dimensions * 2,
          stride: FLOAT_BYTES * dimensions
        },
        nextPosition: {
          buffer: lines.buffer,
          offset: FLOAT_BYTES * dimensions * 4,
          stride: FLOAT_BYTES * dimensions
        },
        prevId: {
          buffer: lines.buffer,
          offset: FLOAT_BYTES * (lines.locs.id.offset + 0),
          stride: FLOAT_BYTES
        },
        currId: {
          buffer: lines.buffer,
          offset: FLOAT_BYTES * (lines.locs.id.offset + 2),
          stride: FLOAT_BYTES
        },
        nextId: {
          buffer: lines.buffer,
          offset: FLOAT_BYTES * (lines.locs.id.offset + 4),
          stride: FLOAT_BYTES
        },
        offset: {
          buffer: lines.buffer,
          offset: FLOAT_BYTES * lines.locs.offset.offset,
          stride: FLOAT_BYTES
        },
        ud: {
          buffer: lines.buffer,
          offset: FLOAT_BYTES * lines.locs.ud.offset,
          stride: FLOAT_BYTES * 2
        },
        color: {
          buffer: lines.buffer,
          offset: FLOAT_BYTES * lines.locs.color.offset,
          stride: FLOAT_BYTES * 4
        }
      },
      fill: {
        position: {
          buffer: fills.buffer,
          offset: FLOAT_BYTES * fills.locs.fillPosition.offset,
          stride: FLOAT_BYTES * dimensions
        },
        color: {
          buffer: fills.buffer,
          offset: FLOAT_BYTES * fills.locs.fillColor.offset,
          stride: FLOAT_BYTES * 4
        },
        id: {
          buffer: fills.buffer,
          offset: FLOAT_BYTES * fills.locs.fillId.offset,
          stride: FLOAT_BYTES * 1
        }
      }
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
      line: {
        model: regl.prop('model'),
        tint: regl.prop('tint'),
        aspect: function (params, context) {
          return params.viewportWidth / params.viewportHeight
        },
        thickness: regl.prop('thickness'),
        miterLimit: regl.prop('miterLimit'),

        adjustProjectedThickness: function (params, context) {
          return context.adjustProjectedThickness === true ? 1 : 0
        }
      },
      fill: {
        model: regl.prop('model'),
        tint: regl.prop('tint')
      }
    };

    var depth = {
      enable: true
    };
    var cull = {
      enable: true,
      face: 'back'
    };
    var blend = {
      enable: true,
      equation: 'add',
      func: {
        src: 'src alpha',
        dst: 'one minus src alpha'
      }
    };

    var defaultLineDrawArgs = {
      vert: line.vert,
      frag: line.frag,
      uniforms: uniforms.line,
      attributes: attributes.line,
      elements: resources.elements.buffer,
      count: function () {
        return state.cursor.quad * 6
      },
      depth: depth,
      cull: cull,
      blend: blend
    };
    var drawLineArgs = opts.drawLineArgs
      ? this.combineDrawArgs(defaultLineDrawArgs, opts.drawLineArgs)
      : defaultLineDrawArgs;

    var defaultFillDrawArgs = {
      vert: fill.vert,
      frag: fill.frag,
      uniforms: uniforms.fill,
      attributes: attributes.fill,
      elements: resources.fillElements.buffer,
      count: function () {
        return state.cursor.fillTri * 3
      },
      depth: depth,
      cull: { enable: false },
      blend: blend
    };
    var drawFillArgs = opts.drawFillArgs
      ? this.combineDrawArgs(defaultFillDrawArgs, opts.drawFillArgs)
      : defaultFillDrawArgs;

    if (state.is3d) {
      var define3d = '#define DIMENSIONS_3\n';
      drawLineArgs.vert = define3d + drawLineArgs.vert;
      drawLineArgs.frag = define3d + drawLineArgs.frag;
      drawFillArgs.vert = define3d + drawFillArgs.vert;
      drawFillArgs.frag = define3d + drawFillArgs.frag;
    }

    var drawLineCommand = regl(drawLineArgs);
    var drawFillCommand = regl(drawFillArgs);

    return function (params) {
      if (state.sync.vertex < state.cursor.vertex) {
        this.syncResourceBuffers();
        state.sync.vertex = state.cursor.vertex;
      }
      if (state.cursor.fillTri > 0) {
        drawFillCommand(params);
      }
      if (state.cursor.quad > 0) {
        drawLineCommand(params);
      }
    }.bind(this)
  },

  syncResourceBuffers: function () {
    var resources = this.resources;
    var lines = resources.lines;
    var elements = resources.elements;
    var fills = resources.fills;
    var fillElements = resources.fillElements;

    lines.buffer.subdata(lines.view);
    elements.buffer.subdata(elements.view);
    fills.buffer.subdata(fills.view);
    fillElements.buffer.subdata(fillElements.view);
  },

  getContext: function (type_) {
    var that = this;
    var state = this.state;
    var context = {};

    var type = type_ || '2d';
    var typeMethods = this['methods' + type];
    var baseMethods = this;
    var accessors = this.accessors;

    CONTEXT_METHODS.forEach(function (key) {
      var method = typeMethods[key] || baseMethods[key];
      if (method) context[key] = method.bind(that);
    });
    CONTEXT_ACCESSORS.forEach(function (key) {
      var accessor = accessors[key];
      Object.defineProperty(context, key, accessor(state));
    });

    return context
  },

  resize: function (size) {
    var opts = this.ctorOptions;
    var cursor = this.state.cursor;
    var resources = this.resources;
    var nextViews = this.createResourceViews(size, cursor.dimensions);

    cursor.max = size;
    Object.keys(nextViews).forEach(function (key) {
      var resource = resources[key];
      var item = nextViews[key];

      if (resource.locs) {
        resource.view = item.dataView;
        resource.locs = item.locs;
        Object.keys(item.views).forEach(function (subViewName) {
          resources[subViewName].view = item.views[subViewName];
        });
      } else {
        resource.view = item;
      }

      if (resource.buffer) {
        resource.buffer({ data: resource.view });
      }
    });

    this.attributes = this.createAttributes();
    this.draw = this.createDrawCommand(opts);
  },

  reset: function () {
    var state = this.state;
    var is3d = state.is3d;
    var cursor = state.cursor;
    var sync = state.sync;
    var style = state.style;
    var transform = state.transform;

    cursor.vertex = 0;
    cursor.element = 0;
    cursor.quad = 0;
    cursor.fillVertex = 0;
    cursor.fillElement = 0;
    cursor.fillTri = 0;
    sync.vertex = 0;

    style.lineWidth = 1;
    style.color[0] = 0;
    style.color[1] = 0;
    style.color[2] = 0;
    style.color[3] = 1;

    transform.isIdentity = true;
    if (is3d) mat4.identity(transform.matrix);
    else mat2d.identity(transform.matrix);

    state.activePath = null;
    state.pathCount = 0;
    state.saveStack.length = 0;
  },

  destroy: function () {
    var resources = this.resources;
    Object.keys(resources).forEach(function (key) {
      var resource = resources[key];
      if (resource.buffer) {
        resource.buffer.destroy();
      }
    });
  },

  save: function () {
    var state = this.state;
    var is3d = state.is3d;
    var style = state.style;
    var transform = state.transform;

    state.saveStack.push({
      style: {
        lineWidth: style.lineWidth,
        color: style.color.slice()
      },
      transform: {
        isIdentity: transform.isIdentity,
        matrix: is3d
          ? mat4.clone(transform.matrix)
          : mat2d.clone(transform.matrix)
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
    var nextPath = state.scratchPath;

    nextPath.reset();
    nextPath.offset = offset;

    state.activePath = nextPath;
  },

  moveTo: function (x, y, z_) {
    var z = z_ || 0;

    var state = this.state;
    var activePath = state.activePath;
    var prevPosition = state.prevPosition;
    var is3d = state.is3d;

    var cursor = state.cursor;
    var dimensions = cursor.dimensions;
    var id = ++state.pathCount;
    var color = state.style.color;
    var lineWidth = state.style.lineWidth * 0.5;

    var resources = this.resources;
    var positionView = resources.position.view;
    var offsetView = resources.offset.view;
    var udView = resources.ud.view;
    var idView = resources.id.view;
    var colorView = resources.color.view;

    var pos = this.transformInput(x, y, z);

    var aix = cursor.vertex * dimensions * 2;
    var aiy = aix + 1;
    var bix = (cursor.vertex + 1) * dimensions * 2;
    var biy = bix + 1;
    positionView[aix] = positionView[aix + dimensions] = pos[0];
    positionView[aiy] = positionView[aiy + dimensions] = pos[1];
    positionView[bix] = positionView[bix + dimensions] = pos[0];
    positionView[biy] = positionView[biy + dimensions] = pos[1];
    if (is3d) {
      var aiz = aix + 2;
      var biz = bix + 2;
      positionView[aiz] = positionView[aiz + dimensions] = pos[2];
      positionView[biz] = positionView[biz + dimensions] = pos[2];
    }

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

    var aii = cursor.vertex * 2;
    var bii = (cursor.vertex + 1) * 2;
    idView[aii] = idView[aii + 1] = id - 1;
    idView[bii] = idView[bii + 1] = id;

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

    vec3.copy(prevPosition, pos);
    activePath.addPoint(pos);

    cursor.vertex += 2;
  },

  lineTo: function (x, y, z_, isClosing_) {
    var z = z_ || 0;

    var state = this.state;
    var activePath = state.activePath;
    var prevPosition = state.prevPosition;
    var is3d = state.is3d;

    var cursor = state.cursor;
    var dimensions = cursor.dimensions;
    var id = state.pathCount;
    var color = state.style.color;
    var lineWidth = state.style.lineWidth * 0.5;

    var resources = this.resources;
    var positionView = resources.position.view;
    var offsetView = resources.offset.view;
    var colorView = resources.color.view;
    var udView = resources.ud.view;
    var idView = resources.id.view;
    var elementsView = resources.elements.view;

    var pos = this.transformInput(x, y, z);
    var segmentLength = vec3.distance(prevPosition, pos);
    var totalLength = activePath.totalLength += segmentLength;

    var aix = cursor.vertex * dimensions * 2;
    var aiy = aix + 1;
    positionView[aix] = positionView[aix + dimensions] = pos[0];
    positionView[aiy] = positionView[aiy + dimensions] = pos[1];
    if (is3d) {
      var aiz = aix + 2;
      positionView[aiz] = positionView[aiz + dimensions] = pos[2];
    }

    var ais = cursor.vertex * 2;
    offsetView[ais] = lineWidth;
    offsetView[ais + 1] = -lineWidth;

    var aiu = (cursor.vertex - 1) * 2 * 2;
    var aid = aiu + 1;
    udView[aiu] = 1;
    udView[aiu + 2] = -1;
    udView[aid] = udView[aid + 2] = totalLength;

    var aii = cursor.vertex * 2;
    idView[aii] = idView[aii + 1] = id;

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

    vec3.copy(prevPosition, pos);
    activePath.addPoint(pos);

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

      if (i === 0) this.moveTo(ax, ay, 0);
      else this.lineTo(ax, ay, 0);
    }
  },

  closePath: function () {
    var state = this.state;
    var activePath = state.activePath;
    var cursor = state.cursor;
    var dimensions = cursor.dimensions;
    var is3d = state.is3d;

    var resources = this.resources;
    var positionView = resources.position.view;

    var bi = cursor.vertex - activePath.count;
    var bix = bi * dimensions * 2;

    var x = positionView[bix];
    var y = positionView[bix + 1];
    var z = is3d ? positionView[bix + 2] : 0;

    activePath.isClosed = true;
    this.lineTo(x, y, z);
  },

  stroke: function () {
    var state = this.state;
    var activePath = state.activePath;
    var is3d = state.is3d;
    var cursor = state.cursor;
    var dimensions = cursor.dimensions;
    var id = state.pathCount;

    var resources = this.resources;
    var positionView = resources.position.view;
    var offsetView = resources.offset.view;
    var udView = resources.ud.view;
    var idView = resources.id.view;
    var colorView = resources.color.view;

    var si = cursor.vertex - activePath.count;
    var bi = cursor.vertex - 1;
    var ai = cursor.vertex;

    var bix = bi * dimensions * 2;
    var biy = bix + 1;
    var aix = ai * dimensions * 2;
    var aiy = aix + 1;
    positionView[aix] = positionView[aix + dimensions] = positionView[bix];
    positionView[aiy] = positionView[aiy + dimensions] = positionView[biy];
    if (is3d) {
      var aiz = aix + 2;
      var biz = bix + 2;
      positionView[aiz] = positionView[aiz + dimensions] = positionView[biz];
    }

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

    var aii = cursor.vertex * 2;
    idView[aii] = idView[aii + 1] = id + 1;

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

  fill: function () {
    var state = this.state;
    var is3d = state.is3d;
    var cursor = state.cursor;
    var dimensions = cursor.dimensions;
    var activePath = state.activePath;
    var id = state.pathCount;
    var color = state.style.fillColor;

    var resources = this.resources;
    var fillPositionView = resources.fillPosition.view;
    var fillColorView = resources.fillColor.view;
    var fillIdView = resources.fillId.view;
    var fillElementsView = resources.fillElements.view;

    var points = activePath.points;
    var pointCount = activePath.count + (activePath.isClosed ? -1 : 0);
    var flatPoints = new Float32Array(pointCount * 2);

    var fvi = cursor.fillVertex;
    var fvi2 = fvi * dimensions;
    var fvi4 = fvi * 4;
    var fti = cursor.fillTri * 3;

    for (var i = 0; i < pointCount; i++) {
      var point = points[i];

      var ix = i * dimensions;
      var iy = ix + 1;
      var ixf = i * 2;
      var iyf = ixf + 1;
      fillPositionView[fvi2 + ix] = flatPoints[ixf] = point[0];
      fillPositionView[fvi2 + iy] = flatPoints[iyf] = point[1];
      if (is3d) {
        var iz = ix + 2;
        fillPositionView[fvi2 + iz] = point[2];
      }

      var ii = i;
      fillIdView[fvi + ii] = id;

      var ir = i * 4;
      var ig = ir + 1;
      var ib = ir + 2;
      var ia = ir + 3;
      fillColorView[fvi4 + ir] = color[0];
      fillColorView[fvi4 + ig] = color[1];
      fillColorView[fvi4 + ib] = color[2];
      fillColorView[fvi4 + ia] = color[3];
    }

    var pointElements = triangulate(flatPoints);
    var pointTris = pointElements.length / 3;

    for (var j = 0; j < pointTris; j++) {
      var evi = j * 3;
      fillElementsView[fti + evi + 0] = fvi + pointElements[evi + 0];
      fillElementsView[fti + evi + 1] = fvi + pointElements[evi + 1];
      fillElementsView[fti + evi + 2] = fvi + pointElements[evi + 2];
    }

    cursor.fillVertex += pointCount;
    cursor.fillTri += pointTris;
  },

  methods2d: {
    setTransform: function (a, b, c, d, dx, dy) {
      var transform = this.state.transform;
      mat2d.set(transform.matrix, a, b, c, d, dx, dy);
      transform.isIdentity = false;
    },

    translate: function (x, y) {
      var transform = this.state.transform;
      var translation = vec2.set(scratchVec, x, y);
      mat2d.translate(transform.matrix, transform.matrix, translation);
      transform.isIdentity = false;
    },

    scale: function (x, y) {
      var transform = this.state.transform;
      var scale = vec2.set(scratchVec, x, y);
      mat2d.scale(transform.matrix, transform.matrix, scale);
      transform.isIdentity = false;
    },

    rotate: function (angle) {
      var transform = this.state.transform;
      mat2d.rotate(transform.matrix, transform.matrix, angle);
      transform.isIdentity = false;
    }
  },

  methods3d: {
    setTransform: function (
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    ) {
      var transform = this.state.transform;
      mat4.set(transform.matrix,
        m00, m01, m02, m03,
        m10, m11, m12, m13,
        m20, m21, m22, m23,
        m30, m31, m32, m33);
      transform.isIdentity = false;
    },

    translate: function (x, y, z) {
      var transform = this.state.transform;
      var translation = vec3.set(scratchVec, x, y, z);
      mat4.translate(transform.matrix, transform.matrix, translation);
      transform.isIdentity = false;
    },

    scale: function (x, y, z) {
      var transform = this.state.transform;
      var scale = vec3.set(scratchVec, x, y, z);
      mat4.scale(transform.matrix, transform.matrix, scale);
      transform.isIdentity = false;
    },

    rotate: function (angle, axis) {
      var transform = this.state.transform;
      switch (axis) {
        case 'x':
          mat4.rotateX(transform.matrix, transform.matrix, angle);
          break
        case 'y':
          mat4.rotateY(transform.matrix, transform.matrix, angle);
          break
        case 'z':
          mat4.rotateZ(transform.matrix, transform.matrix, angle);
          break
        default:
          mat4.rotate(transform.matrix, transform.matrix, angle, axis);
          break
      }
      transform.isIdentity = false;
    }
  },

  accessors: {
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
          state.style.fillColor[3] = globalAlpha;
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

    fillStyle: function (state) {
      return {
        get: function () {
          return state.style.fillStyle
        },
        set: function (fillStyle) {
          var color = state.style.fillColor;
          setRGB(color, fillStyle);
          state.style.fillStyle = fillStyle;
          return fillStyle
        }
      }
    }
  },

  transformInput: function (x, y, z_) {
    var z = z_ || 0;

    var state = this.state;
    var is3d = state.is3d;

    var activePath = state.activePath;
    var transform = state.transform;
    var pos;

    if (is3d) {
      pos = vec3.set(scratchVec, x, y, z);
      if (!transform.isIdentity && !activePath.isClosed) {
        vec3.transformMat4(pos, pos, transform.matrix);
      }
    } else {
      pos = vec2.set(scratchVec, x, y);
      if (!transform.isIdentity && !activePath.isClosed) {
        vec2.transformMat2d(pos, pos, transform.matrix);
      }
    }

    return pos
  },

  copyPosition: function (ai, bi) {
    var state = this.state;
    var is3d = state.is3d;
    var cursor = state.cursor;
    var dimensions = cursor.dimensions;

    var resources = this.resources;
    var positionView = resources.position.view;
    var idView = resources.id.view;

    var aix = ai * dimensions * 2;
    var aiy = aix + 1;
    var bix = bi * dimensions * 2;
    var biy = bix + 1;

    positionView[aix] = positionView[aix + dimensions] = positionView[bix];
    positionView[aiy] = positionView[aiy + dimensions] = positionView[biy];
    if (is3d) {
      var aiz = aix + 2;
      var biz = bix + 2;
      positionView[aiz] = positionView[aiz + dimensions] = positionView[biz];
    }

    var aii = ai * 2;
    var bii = bi * 2;
    idView[aii] = idView[aii + 1] = idView[bii];
  }
});

export { LineBuilder, line };
