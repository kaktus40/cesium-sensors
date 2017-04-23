/* eslint-disable max-nested-callbacks */
define([
	'custom/custom-pattern-sensor-graphics',
	'custom/custom-pattern-sensor-visualizer',
	'Cesium/Core/Cartesian3',
	'Cesium/Core/Color',
	'Cesium/Core/JulianDate',
	'Cesium/Core/Math',
	'Cesium/Core/Matrix3',
	'Cesium/Core/Matrix4',
	'Cesium/Core/Quaternion',
	'Cesium/Core/Spherical',
	'Cesium/DataSources/ColorMaterialProperty',
	'Cesium/DataSources/ConstantProperty',
	'Cesium/DataSources/EntityCollection',
	'../util/create-scene',
	'../matchers/add-to-throw-developer-error-matcher'
], function(
	CustomPatternSensorGraphics,
	CustomPatternSensorVisualizer,
	Cartesian3,
	Color,
	JulianDate,
	CesiumMath,
	Matrix3,
	Matrix4,
	Quaternion,
	Spherical,
	ColorMaterialProperty,
	ConstantProperty,
	EntityCollection,
	createScene,
	addToThrowDeveloperErrorMatcher
) {
	'use strict';

	/* global describe, it, beforeAll, afterAll, beforeEach, afterEach, expect */

	describe('custom pattern sensor visualizer', function() {
		var scene;
		var visualizer;

		beforeAll(function() {
			scene = createScene();
		});

		afterAll(function() {
			scene.destroyForSpecs();
		});

		beforeEach(addToThrowDeveloperErrorMatcher);

		afterEach(function() {
			visualizer = visualizer && visualizer.destroy();
		});

		describe('constructor', function() {
			it('should throw if no scene is passed', function() {
				expect(function() {
					return new CustomPatternSensorVisualizer();
				}).toThrowDeveloperError();
			});
		});

		describe('isDestroy', function() {
			it('should return false until destroyed', function() {
				var entityCollection = new EntityCollection();
				visualizer = new CustomPatternSensorVisualizer(scene, entityCollection);
				expect(visualizer.isDestroyed()).toEqual(false);
				visualizer.destroy();
				expect(visualizer.isDestroyed()).toEqual(true);
				visualizer = undefined;
			});
		});

		describe('update', function() {
			it('should throw if no time specified', function() {
				var entityCollection = new EntityCollection();
				visualizer = new CustomPatternSensorVisualizer(scene, entityCollection);
				expect(function() {
					visualizer.update();
				}).toThrowDeveloperError();
			});
		});

		it('should not create a primitive from an object with no customPatternSensor', function() {
			var entityCollection = new EntityCollection();
			visualizer = new CustomPatternSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
			visualizer.update(JulianDate.now());
			expect(scene.primitives.length).toEqual(0);
		});

		it('should not create a primitive from an object with no position', function() {
			var entityCollection = new EntityCollection();
			visualizer = new CustomPatternSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('customPatternSensor');
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
			var customPatternSensor = new CustomPatternSensorGraphics();
			customPatternSensor.directions = new ConstantProperty([new Spherical(0, 0, 0), new Spherical(1, 0, 0), new Spherical(2, 0, 0), new Spherical(3, 0, 0)]);
			testObject.customPatternSensor = customPatternSensor;
			visualizer.update(JulianDate.now());
			expect(scene.primitives.length).toEqual(0);
		});

		it('should not create a primitive from object with no orientation', function() {
			var entityCollection = new EntityCollection();
			visualizer = new CustomPatternSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('customPatternSensor');
			testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
			var customPatternSensor = new CustomPatternSensorGraphics();
			customPatternSensor.directions = new ConstantProperty([new Spherical(0, 0, 0), new Spherical(1, 0, 0), new Spherical(2, 0, 0), new Spherical(3, 0, 0)]);
			testObject.customPatternSensor = customPatternSensor;
			visualizer.update(JulianDate.now());
			expect(scene.primitives.length).toEqual(0);
		});

		it('should cause a CustomSensor to be created and updated', function() {
			var time = JulianDate.now();
			var entityCollection = new EntityCollection();
			visualizer = new CustomPatternSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('customPatternSensor');
			testObject.show = true;
			testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, Math.sin(CesiumMath.PI_OVER_FOUR), Math.cos(CesiumMath.PI_OVER_FOUR)));

			var customPatternSensor = new CustomPatternSensorGraphics();
			customPatternSensor.directions = new ConstantProperty([new Spherical(0, 0, 0), new Spherical(1, 0, 0), new Spherical(2, 0, 0), new Spherical(3, 0, 0)]);
			customPatternSensor.intersectionColor = new ConstantProperty(new Color(0.1, 0.2, 0.3, 0.4));
			customPatternSensor.intersectionWidth = new ConstantProperty(0.5);
			customPatternSensor.showIntersection = new ConstantProperty(true);
			customPatternSensor.radius = new ConstantProperty(123.5);
			customPatternSensor.show = new ConstantProperty(true);
			customPatternSensor.lateralSurfaceMaterial = new ColorMaterialProperty(Color.WHITE);
			testObject.customPatternSensor = customPatternSensor;
			visualizer.update(time);

			expect(scene.primitives.length).toEqual(1);
			var p = scene.primitives.get(0);
			expect(p.intersectionColor).toEqual(testObject.customPatternSensor.intersectionColor.getValue(time));
			expect(p.intersectionWidth).toEqual(testObject.customPatternSensor.intersectionWidth.getValue(time));
			expect(p.showIntersection).toEqual(testObject.customPatternSensor.showIntersection.getValue(time));
			expect(p.radius).toEqual(testObject.customPatternSensor.radius.getValue(time));
			expect(p.modelMatrix).toEqual(Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(testObject.orientation.getValue(time)), testObject.position.getValue(time)));
			expect(p.show).toEqual(testObject.customPatternSensor.show.getValue(time));
			expect(p.lateralSurfaceMaterial.uniforms).toEqual(testObject.customPatternSensor.lateralSurfaceMaterial.getValue(time));

			testObject.show = false;
			visualizer.update(time);
			expect(p.show).toBe(false);

			testObject.show = true;
			visualizer.update(time);
			expect(p.show).toBe(true);

			customPatternSensor.show.setValue(false);
			visualizer.update(time);
			expect(p.show).toBe(false);
		});

		it('should remove primitives', function() {
			var entityCollection = new EntityCollection();
			visualizer = new CustomPatternSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('customPatternSensor');
			testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
			var customPatternSensor = new CustomPatternSensorGraphics();
			customPatternSensor.directions = new ConstantProperty([new Spherical(0, 0, 0), new Spherical(1, 0, 0), new Spherical(2, 0, 0), new Spherical(3, 0, 0)]);
			testObject.customPatternSensor = customPatternSensor;

			var time = JulianDate.now();
			expect(scene.primitives.length).toEqual(0);
			visualizer.update(time);
			expect(scene.primitives.length).toEqual(1);
			expect(scene.primitives.get(0).show).toEqual(true);
			entityCollection.removeAll();
			visualizer.update(time);
			expect(scene.primitives.length).toEqual(0);
		});

		it('should set entity property', function() {
			var entityCollection = new EntityCollection();
			visualizer = new CustomPatternSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('customPatternSensor');
			testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
			var customPatternSensor = new CustomPatternSensorGraphics();
			customPatternSensor.directions = new ConstantProperty([new Spherical(0, 0, 0), new Spherical(1, 0, 0), new Spherical(2, 0, 0), new Spherical(3, 0, 0)]);
			testObject.customPatternSensor = customPatternSensor;

			var time = JulianDate.now();
			visualizer.update(time);
			expect(scene.primitives.get(0).id).toEqual(testObject);
		});
	});
});
