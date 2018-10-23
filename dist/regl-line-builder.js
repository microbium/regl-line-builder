(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('gl-matrix'), require('earcut')) :
  typeof define === 'function' && define.amd ? define(['exports', 'gl-matrix', 'earcut'], factory) :
  (factory((global.REGLLineBuilder = {}),{vec2:global.vec2,vec3:global.vec3,mat2d:global.mat2d,mat4:global.mat4},global.earcut));
}(this, (function (exports,glMatrix,triangulate) { 'use strict';

  triangulate = triangulate && triangulate.hasOwnProperty('default') ? triangulate['default'] : triangulate;

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
        nextPoint = dimensions === 2 ? glMatrix.vec2.create() : glMatrix.vec3.create();
        points.push(nextPoint);
      }

      if (dimensions === 2) {
        glMatrix.vec2.copy(nextPoint, pos);
      } else {
        glMatrix.vec3.copy(nextPoint, pos);
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

  var vert = "precision highp float;\n#define GLSLIFY 1\n\n// Based on WebGL lines demo\n// (c) 2015 Matt DesLauriers. MIT License\n// https://github.com/mattdesl/webgl-lines/\n\n// TODO: Maybe make separate package to make reuse with custom shaders easier?\n// TODO: Maybe use struct to pass some of this data?\nvec2 computeMiterOffset (\n  mat4 projection_0,\n  int adjustProjectedThickness_0,\n  float aspect_0,\n  float thickness_0,\n  float miterLimit_0,\n  vec4 prevProjected_0,\n  vec4 currProjected_0,\n  vec4 nextProjected_0\n) {\n  vec2 aspectVec = vec2(aspect_0, 1.0);\n\n  // get 2D screen space with W divide and aspect correction\n  vec2 prevScreen = prevProjected_0.xy / prevProjected_0.w * aspectVec;\n  vec2 currScreen = currProjected_0.xy / currProjected_0.w * aspectVec;\n  vec2 nextScreen = nextProjected_0.xy / nextProjected_0.w * aspectVec;\n\n  float thicknessScale = 1.0;\n  if (adjustProjectedThickness_0 == 1) {\n    vec4 singlePixelProjected = projection_0 * vec4(2.0, 0.0, 0.0, 1.0);\n    vec2 singlePixel = singlePixelProjected.xy / singlePixelProjected.w * aspectVec;\n    thicknessScale = singlePixel.x;\n  }\n\n  vec2 dir = vec2(0.0);\n  float len = thickness_0 * thicknessScale;\n\n  // OPTIM: Improve equality checks\n  // starting point uses (next - current)\n  if (currScreen == prevScreen) {\n    dir = normalize(nextScreen - currScreen);\n  }\n  // ending point uses (current - previous)\n  else if (currScreen == nextScreen) {\n    dir = normalize(currScreen - prevScreen);\n  }\n  // somewhere in middle, needs a join\n  else {\n    // get directions from (C - B) and (B - A)\n    vec2 dirA = normalize((currScreen - prevScreen));\n    if (int(miterLimit_0) == -1) {\n      dir = dirA;\n    } else {\n      vec2 dirB = normalize((nextScreen - currScreen));\n      // now compute the miter join normal and length\n      vec2 tangent = normalize(dirA + dirB);\n      vec2 perp = vec2(-dirA.y, dirA.x);\n      vec2 miter = vec2(-tangent.y, tangent.x);\n      dir = tangent;\n      len /= dot(miter, perp);\n    }\n  }\n\n  return vec2(-dir.y, dir.x) *\n    clamp(len, 0.0, miterLimit_0 * thicknessScale) / aspectVec;\n}\n\nuniform mat4 projection;\nuniform mat4 model;\nuniform mat4 view;\nuniform float aspect;\nuniform int adjustProjectedThickness;\n\nuniform float thickness;\nuniform float miterLimit;\n\n#ifdef DIMENSIONS_3\nattribute vec3 prevPosition;\nattribute vec3 currPosition;\nattribute vec3 nextPosition;\n#else\nattribute vec2 prevPosition;\nattribute vec2 currPosition;\nattribute vec2 nextPosition;\n#endif\n\nattribute float offset;\nattribute vec4 color;\nattribute vec2 ud;\n\nvarying vec4 vColor;\nvarying vec2 vUD;\n\nvoid main() {\n  mat4 projViewModel = projection * view * model;\n\n#ifdef DIMENSIONS_3\n  vec4 prevProjected = projViewModel * vec4(prevPosition, 1.0);\n  vec4 currProjected = projViewModel * vec4(currPosition, 1.0);\n  vec4 nextProjected = projViewModel * vec4(nextPosition, 1.0);\n#else\n  vec4 prevProjected = projViewModel * vec4(prevPosition, 0.0, 1.0);\n  vec4 currProjected = projViewModel * vec4(currPosition, 0.0, 1.0);\n  vec4 nextProjected = projViewModel * vec4(nextPosition, 0.0, 1.0);\n#endif\n\n  vec2 miterOffset = computeMiterOffset(\n    projection, adjustProjectedThickness,\n    aspect, thickness, miterLimit,\n    prevProjected, currProjected, nextProjected);\n\n  vColor = color;\n  vUD = ud;\n\n  gl_Position = currProjected + vec4(miterOffset * offset, 0.0, 1.0);\n}\n";

  var line = {
    frag: frag,
    vert: vert
  };

  var frag$1 = "precision highp float;\n#define GLSLIFY 1\nuniform vec4 tint;\nvarying vec4 vColor;\n\nvoid main() {\n  gl_FragColor = vColor * tint;\n}\n";

  var vert$1 = "precision highp float;\n#define GLSLIFY 1\n\nuniform mat4 projection;\nuniform mat4 model;\nuniform mat4 view;\n\n// #ifdef DIMENSIONS_3\n// attribute vec3 position;\n// #else\nattribute vec2 position;\n// #endif\n\nattribute vec4 color;\n\nvarying vec4 vColor;\n\nvoid main() {\n  mat4 projViewModel = projection * view * model;\n  vec4 posProjected = projViewModel * vec4(position, 0.0, 1.0);\n\n  vColor = color;\n\n  gl_Position = posProjected * vec4(0.5, 0.5, 0.0, 1.0);\n}\n";

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

  var scratchVec = glMatrix.vec3.create();

  function LineBuilder (regl, opts_) {
    var opts = opts_ || {};
    opts.dimensions = clamp(opts.dimensions || 2, 2, 3);
    opts.bufferSize = opts.bufferSize || 1024;

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
        matrix: is3d ? glMatrix.mat4.create() : glMatrix.mat2d.create()
      };
      return {
        is3d: is3d,
        cursor: cursor,
        sync: sync,
        style: style,
        transform: transform,
        activePath: null,
        prevPosition: glMatrix.vec3.create(),
        saveStack: [],
        scratchPath: LinePath.create({
          dimensions: opts.dimensions
        })
      }
    },

    createResources: function () {
      var regl = this.context.regl;
      var cursor = this.state.cursor;

      var views = this.createResourceViews(cursor.max, cursor.dimensions);

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
        primitive: 'triangles',
        data: views.elements
      });

      var fillPositionBuffer = regl.buffer({
        usage: 'dynamic',
        type: 'float',
        data: views.fillPosition
      });
      var fillColorBuffer = regl.buffer({
        usage: 'dynamic',
        type: 'float',
        data: views.fillColor
      });
      var fillElementsBuffer = regl.elements({
        usage: 'dynamic',
        primitive: 'triangles',
        data: views.fillElements
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
        },
        fillPosition: {
          view: views.fillPosition,
          buffer: fillPositionBuffer
        },
        fillColor: {
          view: views.fillColor,
          buffer: fillColorBuffer
        },
        fillElements: {
          view: views.fillElements,
          buffer: fillElementsBuffer
        }
      }
    },

    createResourceViews: function (size, dimensions) {
      var ElementsArrayCtor = this.getElementsCtor(size);
      return {
        position: new Float32Array(size * dimensions * 2),
        offset: new Float32Array(size * 2),
        color: new Float32Array(size * 4 * 2),
        ud: new Float32Array(size * 2 * 3),
        elements: new ElementsArrayCtor(size * 4),
        fillPosition: new Float32Array(size * dimensions),
        fillColor: new Float32Array(size * 4),
        fillElements: new ElementsArrayCtor(size * 3)
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

      var position = resources.position;
      var color = resources.color;
      var ud = resources.ud;
      var offset = resources.offset;

      var fillPosition = resources.fillPosition;
      var fillColor = resources.fillColor;

      return {
        line: {
          prevPosition: {
            buffer: position.buffer,
            offset: 0,
            stride: FLOAT_BYTES * dimensions
          },
          currPosition: {
            buffer: position.buffer,
            offset: FLOAT_BYTES * dimensions * 2,
            stride: FLOAT_BYTES * dimensions
          },
          nextPosition: {
            buffer: position.buffer,
            offset: FLOAT_BYTES * dimensions * 4,
            stride: FLOAT_BYTES * dimensions
          },
          offset: offset.buffer,
          ud: ud.buffer,
          color: color.buffer
        },
        fill: {
          position: fillPosition.buffer,
          color: fillColor.buffer
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
          aspect: function (params, context) {
            return params.viewportWidth / params.viewportHeight
          },
          thickness: regl.prop('thickness'),
          miterLimit: regl.prop('miterLimit'),
          adjustProjectedThickness: function (params, context) {
            return context.adjustProjectedThickness === true ? 1 : 0
          }
        },
        fill: {}
      };

      var depth = {
        enable: false
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

      var drawArgs = {
        uniforms: {
          model: regl.prop('model'),
          tint: regl.prop('tint')
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
        cull: cull,
        blend: blend
      };
      var drawFillArgs = opts.drawFillArgs
        ? this.combineDrawArgs(defaultFillDrawArgs, opts.drawFillArgs)
        : defaultFillDrawArgs;

      if (state.is3d) {
        var define3d = '#define DIMENSIONS_3\n';
        drawLineArgs.vert = define3d + drawLineArgs.vert;
        drawLineArgs.frag = define3d + drawLineArgs.frag;
      }

      var drawCommand = regl(drawArgs);
      var drawLineCommand = regl(drawLineArgs);
      var drawFillCommand = regl(drawFillArgs);

      return function (params) {
        if (state.sync.vertex < state.cursor.vertex) {
          this.syncResourceBuffers();
          state.sync.vertex = state.cursor.vertex;
        }
        return drawCommand(params, function () {
          drawFillCommand(params);
          drawLineCommand(params);
        })
      }.bind(this)
    },

    syncResourceBuffers: function () {
      var resources = this.resources;

      var position = resources.position;
      var offset = resources.offset;
      var color = resources.color;
      var ud = resources.ud;
      var elements = resources.elements;

      var fillPosition = resources.fillPosition;
      var fillColor = resources.fillColor;
      var fillElements = resources.fillElements;

      position.buffer.subdata(position.view);
      offset.buffer.subdata(offset.view);
      color.buffer.subdata(color.view);
      ud.buffer.subdata(ud.view);
      elements.buffer.subdata(elements.view);

      fillPosition.buffer.subdata(fillPosition.view);
      fillColor.buffer.subdata(fillColor.view);
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
      var cursor = this.state.cursor;
      var resources = this.resources;
      var nextViews = this.createResourceViews(size, cursor.dimensions);

      cursor.max = size;
      Object.keys(nextViews).forEach(function (key) {
        resources[key].view = nextViews[key];
        resources[key].buffer({
          data: nextViews[key] });
      });
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
      if (is3d) glMatrix.mat4.identity(transform.matrix);
      else glMatrix.mat2d.identity(transform.matrix);

      state.activePath = null;
      state.saveStack.length = 0;
    },

    destroy: function () {
      var resources = this.resources;
      resources.position.buffer.destroy();
      resources.offset.buffer.destroy();
      resources.color.buffer.destroy();
      resources.ud.buffer.destroy();
      resources.elements.buffer.destroy();
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
            ? glMatrix.mat4.clone(transform.matrix)
            : glMatrix.mat2d.clone(transform.matrix)
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
      var color = state.style.color;
      var lineWidth = state.style.lineWidth * 0.5;

      var resources = this.resources;
      var positionView = resources.position.view;
      var offsetView = resources.offset.view;
      var udView = resources.ud.view;
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
      var color = state.style.color;
      var lineWidth = state.style.lineWidth * 0.5;

      var resources = this.resources;
      var positionView = resources.position.view;
      var offsetView = resources.offset.view;
      var colorView = resources.color.view;
      var udView = resources.ud.view;
      var elementsView = resources.elements.view;

      var pos = this.transformInput(x, y, z);
      var segmentLength = glMatrix.vec2.distance(prevPosition, pos);
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

        if (i === 0) this.moveTo(ax, ay);
        else this.lineTo(ax, ay);
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

      var resources = this.resources;
      var positionView = resources.position.view;
      var offsetView = resources.offset.view;
      var udView = resources.ud.view;
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
      var cursor = state.cursor;
      var activePath = state.activePath;
      var color = state.style.fillColor;

      var resources = this.resources;
      var fillPositionView = resources.fillPosition.view;
      var fillColorView = resources.fillColor.view;
      var fillElementsView = resources.fillElements.view;

      var points = activePath.points;
      var pointCount = activePath.count + (activePath.isClosed ? -1 : 0);
      var flatPoints = new Float32Array(pointCount * 2);

      var fvi = cursor.fillVertex;
      var fvi2 = fvi * 2;
      var fvi4 = fvi * 4;
      var fti = cursor.fillTri * 3;

      for (var i = 0; i < pointCount; i++) {
        var point = points[i];

        var ix = i * 2;
        var iy = ix + 1;
        fillPositionView[fvi2 + ix] = flatPoints[ix] = point[0];
        fillPositionView[fvi2 + iy] = flatPoints[iy] = point[1];

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
        glMatrix.mat2d.set(transform.matrix, a, b, c, d, dx, dy);
        transform.isIdentity = false;
      },

      translate: function (x, y) {
        var transform = this.state.transform;
        var translation = glMatrix.vec2.set(scratchVec, x, y);
        glMatrix.mat2d.translate(transform.matrix, transform.matrix, translation);
        transform.isIdentity = false;
      },

      scale: function (x, y) {
        var transform = this.state.transform;
        var scale = glMatrix.vec2.set(scratchVec, x, y);
        glMatrix.mat2d.scale(transform.matrix, transform.matrix, scale);
        transform.isIdentity = false;
      },

      rotate: function (angle) {
        var transform = this.state.transform;
        glMatrix.mat2d.rotate(transform.matrix, transform.matrix, angle);
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
        glMatrix.mat4.set(transform.matrix,
          m00, m01, m02, m03,
          m10, m11, m12, m13,
          m20, m21, m22, m23,
          m30, m31, m32, m33);
        transform.isIdentity = false;
      },

      translate: function (x, y, z) {
        var transform = this.state.transform;
        var translation = glMatrix.vec3.set(scratchVec, x, y, z);
        glMatrix.mat4.translate(transform.matrix, transform.matrix, translation);
        transform.isIdentity = false;
      },

      scale: function (x, y, z) {
        var transform = this.state.transform;
        var scale = glMatrix.vec3.set(scratchVec, x, y, z);
        glMatrix.mat4.scale(transform.matrix, transform.matrix, scale);
        transform.isIdentity = false;
      },

      rotate: function (angle, axis) {
        var transform = this.state.transform;
        switch (axis) {
          case 'x':
            glMatrix.mat4.rotateX(transform.matrix, transform.matrix, angle);
            break
          case 'y':
            glMatrix.mat4.rotateY(transform.matrix, transform.matrix, angle);
            break
          case 'z':
            glMatrix.mat4.rotateZ(transform.matrix, transform.matrix, angle);
            break
          default:
            glMatrix.mat4.rotate(transform.matrix, transform.matrix, angle, axis);
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
        pos = glMatrix.vec3.set(scratchVec, x, y, z);
        if (!transform.isIdentity && !activePath.isClosed) {
          glMatrix.vec3.transformMat4(pos, pos, transform.matrix);
        }
      } else {
        pos = glMatrix.vec2.set(scratchVec, x, y);
        if (!transform.isIdentity && !activePath.isClosed) {
          glMatrix.vec2.transformMat2d(pos, pos, transform.matrix);
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
    }
  });

  exports.LineBuilder = LineBuilder;
  exports.line = line;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
