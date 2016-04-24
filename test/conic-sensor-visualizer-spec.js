/* eslint-disable max-nested-callbacks */
define([
	'conic-sensor-graphics',
	'conic-sensor-visualizer',
	'Cesium/Core/Cartesian3',
	'Cesium/Core/Color',
	'Cesium/Core/JulianDate',
	'Cesium/Core/Math',
	'Cesium/Core/Matrix3',
	'Cesium/Core/Matrix4',
	'Cesium/Core/Quaternion',
	'Cesium/DataSources/ColorMaterialProperty',
	'Cesium/DataSources/ConstantProperty',
	'Cesium/DataSources/EntityCollection',
	'./util/create-scene',
	'./matchers/add-to-throw-developer-error-matcher'
], function(
	ConicSensorGraphics,
	ConicSensorVisualizer,
	Cartesian3,
	Color,
	JulianDate,
	CesiumMath,
	Matrix3,
	Matrix4,
	Quaternion,
	ColorMaterialProperty,
	ConstantProperty,
	EntityCollection,
	createScene,
	addToThrowDeveloperErrorMatcher
) {
	'use strict';

	/* global describe, it, beforeAll, afterAll, beforeEach, afterEach, expect */

	describe('conic sensor visualizer', function() {
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
					return new ConicSensorVisualizer();
				}).toThrowDeveloperError();
			});
		});

		describe('update', function() {
			it('should throw if no time specified', function() {
				var entityCollection = new EntityCollection();
				visualizer = new ConicSensorVisualizer(scene, entityCollection);
				expect(function() {
					visualizer.update();
				}).toThrowDeveloperError();
			});
		});

		describe('isDestroy', function() {
			it('should return false until destroyed', function() {
				var entityCollection = new EntityCollection();
				visualizer = new ConicSensorVisualizer(scene, entityCollection);
				expect(visualizer.isDestroyed()).toEqual(false);
				visualizer.destroy();
				expect(visualizer.isDestroyed()).toEqual(true);
				visualizer = undefined;
			});
		});

		it('should not create a primitive from an object with no conicSensor', function() {
			var entityCollection = new EntityCollection();
			visualizer = new ConicSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
			visualizer.update(JulianDate.now());
			expect(scene.primitives.length).toEqual(0);
		});

		it('should not create a primitive from an object with no position', function() {
			var entityCollection = new EntityCollection();
			visualizer = new ConicSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('conicSensor');
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
			var conicSensor = testObject.conicSensor = new ConicSensorGraphics();
			conicSensor.maximumClockAngle = new ConstantProperty(1);
			conicSensor.outerHalfAngle = new ConstantProperty(1);
			visualizer.update(JulianDate.now());
			expect(scene.primitives.length).toEqual(0);
		});

		it('should not create a primitive from an object with no orientation', function() {
			var entityCollection = new EntityCollection();
			visualizer = new ConicSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('conicSensor');
			testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
			var conicSensor = testObject.conicSensor = new ConicSensorGraphics();
			conicSensor.maximumClockAngle = new ConstantProperty(1);
			conicSensor.outerHalfAngle = new ConstantProperty(1);
			visualizer.update(JulianDate.now());
			expect(scene.primitives.length).toEqual(0);
		});

		it('should cause a ComplexConicSensor to be created and updated', function() {
			var time = JulianDate.now();
			var entityCollection = new EntityCollection();
			visualizer = new ConicSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('conicSensor');
			testObject.show = true;
			testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, Math.sin(CesiumMath.PI_OVER_FOUR), Math.cos(CesiumMath.PI_OVER_FOUR)));

			var conicSensor = testObject.conicSensor = new ConicSensorGraphics();
			conicSensor.minimumClockAngle = new ConstantProperty(0.1);
			conicSensor.maximumClockAngle = new ConstantProperty(0.2);
			conicSensor.innerHalfAngle = new ConstantProperty(0.3);
			conicSensor.outerHalfAngle = new ConstantProperty(0.4);
			conicSensor.intersectionColor = new ConstantProperty(new Color(0.1, 0.2, 0.3, 0.4));
			conicSensor.intersectionWidth = new ConstantProperty(0.5);
			conicSensor.showIntersection = new ConstantProperty(true);
			conicSensor.radius = new ConstantProperty(123.5);
			conicSensor.show = new ConstantProperty(true);
			conicSensor.lateralSurfaceMaterial = new ColorMaterialProperty(Color.WHITE);

			visualizer.update(time);
			expect(scene.primitives.length).toEqual(1);

			var c = scene.primitives.get(0);
			expect(c.directions.length).toBeGreaterThan(0);
			expect(c.intersectionColor).toEqual(testObject.conicSensor.intersectionColor.getValue(time));
			expect(c.intersectionWidth).toEqual(testObject.conicSensor.intersectionWidth.getValue(time));
			expect(c.showIntersection).toEqual(testObject.conicSensor.showIntersection.getValue(time));
			expect(c.radius).toEqual(testObject.conicSensor.radius.getValue(time));
			expect(c.modelMatrix).toEqual(Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(testObject.orientation.getValue(time)), testObject.position.getValue(time)));
			expect(c.show).toEqual(testObject.conicSensor.show.getValue(time));
			expect(c.lateralSurfaceMaterial.uniforms).toEqual(testObject.conicSensor.lateralSurfaceMaterial.getValue(time));

			testObject.show = false;
			visualizer.update(time);
			expect(c.show).toBe(false);

			testObject.show = true;
			visualizer.update(time);
			expect(c.show).toBe(true);

			conicSensor.show.setValue(false);
			visualizer.update(time);
			expect(c.show).toBe(false);
		});

		it('should set IntersectionColor correctly with multiple conicSensors', function() {
			var time = JulianDate.now();
			var entityCollection = new EntityCollection();
			visualizer = new ConicSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('conicSensor');
			testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));

			var testObject2 = entityCollection.getOrCreateEntity('test2');
			testObject2.addProperty('conicSensor');
			testObject2.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
			testObject2.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));

			var conicSensor = testObject.conicSensor = new ConicSensorGraphics();
			conicSensor.intersectionColor = new ConstantProperty(new Color(0.1, 0.2, 0.3, 0.4));

			var conicSensor2 = testObject2.conicSensor = new ConicSensorGraphics();
			conicSensor2.intersectionColor = new ConstantProperty(new Color(0.4, 0.3, 0.2, 0.1));

			visualizer.update(time);

			expect(scene.primitives.length).toEqual(2);
			var c = scene.primitives.get(0);
			expect(c.intersectionColor).toEqual(testObject.conicSensor.intersectionColor.getValue(time));

			c = scene.primitives.get(1);
			expect(c.intersectionColor).toEqual(testObject2.conicSensor.intersectionColor.getValue(time));
		});

		it('should create a ComplexConicSensor with CZML defaults from an empty conicSensor', function() {
			var time = JulianDate.now();
			var entityCollection = new EntityCollection();
			visualizer = new ConicSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('conicSensor');
			testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));

			testObject.conicSensor = new ConicSensorGraphics();
			visualizer.update(time);

			expect(scene.primitives.length).toEqual(1);
			var c = scene.primitives.get(0);
			expect(c.directions.length).toBeGreaterThan(0);
			expect(isFinite(c.radius)).toEqual(false);
			expect(c.show).toEqual(true);
		});

		it('should remove primitives', function() {
			var entityCollection = new EntityCollection();
			visualizer = new ConicSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('conicSensor');
			testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
			var conicSensor = testObject.conicSensor = new ConicSensorGraphics();
			conicSensor.maximumClockAngle = new ConstantProperty(1);
			conicSensor.outerHalfAngle = new ConstantProperty(1);

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
			visualizer = new ConicSensorVisualizer(scene, entityCollection);

			var testObject = entityCollection.getOrCreateEntity('test');
			testObject.addProperty('conicSensor');
			testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
			testObject.orientation = new ConstantProperty(new Quaternion(0, 0, 0, 1));
			var conicSensor = testObject.conicSensor = new ConicSensorGraphics();
			conicSensor.maximumClockAngle = new ConstantProperty(1);
			conicSensor.outerHalfAngle = new ConstantProperty(1);

			var time = JulianDate.now();
			visualizer.update(time);
			expect(scene.primitives.get(0).id).toEqual(testObject);
		});
	});
});
