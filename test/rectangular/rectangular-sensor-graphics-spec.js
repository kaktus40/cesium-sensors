/* eslint-disable max-nested-callbacks */
define([
	'rectangular/rectangular-sensor-graphics',
	'Cesium/Core/Color',
	'Cesium/DataSources/ColorMaterialProperty',
	'Cesium/DataSources/ConstantProperty',
	'../matchers/add-to-throw-developer-error-matcher'
], function(
	RectangularSensorGraphics,
	Color,
	ColorMaterialProperty,
	ConstantProperty,
	addToThrowDeveloperErrorMatcher
) {
	'use strict';

	/* global describe, it, beforeEach, expect */

	describe('rectangular sensor graphics', function() {
		describe('merge', function() {
			beforeEach(addToThrowDeveloperErrorMatcher);

			it('should assign unassigned properties', function() {
				var source = new RectangularSensorGraphics();
				source.lateralSurfaceMaterial = new ColorMaterialProperty();
				source.xHalfAngle = new ConstantProperty();
				source.yHalfAngle = new ConstantProperty();
				source.intersectionColor = new ConstantProperty();
				source.radius = new ConstantProperty();
				source.show = new ConstantProperty();
				source.showIntersection = new ConstantProperty();
				source.intersectionWidth = new ConstantProperty();

				var target = new RectangularSensorGraphics();
				target.merge(source);

				expect(target.lateralSurfaceMaterial).toBe(source.lateralSurfaceMaterial);
				expect(target.xHalfAngle).toBe(source.xHalfAngle);
				expect(target.yHalfAngle).toBe(source.yHalfAngle);
				expect(target.intersectionColor).toBe(source.intersectionColor);
				expect(target.radius).toBe(source.radius);
				expect(target.show).toBe(source.show);
				expect(target.showIntersection).toBe(source.showIntersection);
				expect(target.intersectionWidth).toBe(source.intersectionWidth);
			});

			it('should not assign assigned properties', function() {
				var source = new RectangularSensorGraphics();
				source.lateralSurfaceMaterial = new ColorMaterialProperty();
				source.xHalfAngle = new ConstantProperty();
				source.yHalfAngle = new ConstantProperty();
				source.intersectionColor = new ConstantProperty();
				source.radius = new ConstantProperty();
				source.show = new ConstantProperty();
				source.showIntersection = new ConstantProperty();
				source.intersectionWidth = new ConstantProperty();

				var lateralSurfaceMaterial = new ColorMaterialProperty();
				var xHalfAngle = new ConstantProperty();
				var yHalfAngle = new ConstantProperty();
				var intersectionColor = new ConstantProperty();
				var radius = new ConstantProperty();
				var show = new ConstantProperty();
				var showIntersection = new ConstantProperty();
				var intersectionWidth = new ConstantProperty();

				var target = new RectangularSensorGraphics();
				target.lateralSurfaceMaterial = lateralSurfaceMaterial;
				target.xHalfAngle = xHalfAngle;
				target.yHalfAngle = yHalfAngle;
				target.intersectionColor = intersectionColor;
				target.radius = radius;
				target.show = show;
				target.showIntersection = showIntersection;
				target.intersectionWidth = intersectionWidth;

				target.merge(source);

				expect(target.lateralSurfaceMaterial).toBe(lateralSurfaceMaterial);
				expect(target.xHalfAngle).toBe(xHalfAngle);
				expect(target.yHalfAngle).toBe(yHalfAngle);
				expect(target.intersectionColor).toBe(intersectionColor);
				expect(target.radius).toBe(radius);
				expect(target.show).toBe(show);
				expect(target.showIntersection).toBe(showIntersection);
				expect(target.intersectionWidth).toBe(intersectionWidth);
			});

			it('should throws if source undefined', function() {
				var target = new RectangularSensorGraphics();
				expect(function() {
					target.merge(undefined);
				}).toThrowDeveloperError();
			});
		});

		it('should clone', function() {
			var source = new RectangularSensorGraphics();
			source.lateralSurfaceMaterial = new ColorMaterialProperty();
			source.xHalfAngle = new ConstantProperty();
			source.yHalfAngle = new ConstantProperty();
			source.intersectionColor = new ConstantProperty();
			source.radius = new ConstantProperty();
			source.show = new ConstantProperty();
			source.showIntersection = new ConstantProperty();
			source.intersectionWidth = new ConstantProperty();

			var result = source.clone();
			expect(result.lateralSurfaceMaterial).toBe(source.lateralSurfaceMaterial);
			expect(result.xHalfAngle).toBe(source.xHalfAngle);
			expect(result.yHalfAngle).toBe(source.yHalfAngle);
			expect(result.intersectionColor).toBe(source.intersectionColor);
			expect(result.radius).toBe(source.radius);
			expect(result.show).toBe(source.show);
			expect(result.showIntersection).toBe(source.showIntersection);
			expect(result.intersectionWidth).toBe(source.intersectionWidth);
		});
	});
});
