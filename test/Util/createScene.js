/* eslint-env browser */
define(function(require) {
	'use strict';

	var Cartesian2 = require('Cesium/Core/Cartesian2');
	var clone = require('Cesium/Core/clone');
	var defaultValue = require('Cesium/Core/defaultValue');
	var defined = require('Cesium/Core/defined');
	var queryToObject = require('Cesium/Core/queryToObject');
	var Scene = require('Cesium/Scene/Scene');
	var createCanvas = require('./createCanvas');
	var destroyCanvas = require('./destroyCanvas');

	function createScene(options) {
		options = defaultValue(options, {});

		// save the canvas so we don't try to clone an HTMLCanvasElement
		var canvas = defined(options.canvas) ? options.canvas : createCanvas();
		options.canvas = undefined;

		options = clone(options, true);

		options.canvas = canvas;
		options.contextOptions = defaultValue(options.contextOptions, {});

		var contextOptions = options.contextOptions;
		contextOptions.webgl = defaultValue(contextOptions.webgl, {});
		contextOptions.webgl.antialias = defaultValue(contextOptions.webgl.antialias, false);

		var scene = new Scene(options);

		var parameters = queryToObject(window.location.search.substring(1));
		if (defined(parameters.webglValidation)) {
			var context = scene.context;
			context.validateShaderProgram = true;
			context.validateFramebuffer = true;
			context.logShaderCompilation = true;
			context.throwOnWebGLError = true;
		}

		// Add functions for test
		scene.destroyForSpecs = function() {
			var canvas = scene.canvas;
			scene.destroy();
			destroyCanvas(canvas);
		};

		scene.renderForSpecs = function(time) {
			scene.initializeFrame();
			scene.render(time);
			return scene.context.readPixels();
		};

		scene.pickForSpecs = function() {
			return scene.pick(new Cartesian2(0, 0));
		};

		scene.rethrowRenderErrors = defaultValue(options.rethrowRenderErrors, true);

		return scene;
	}

	return createScene;
});
