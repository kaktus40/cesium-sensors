/* eslint-disable max-nested-callbacks */
define([
	'Cesium/DataSources/CzmlDataSource',
	'Cesium/DataSources/DataSourceCollection',
	'Cesium/DataSources/DataSourceDisplay',
	'initialize',
	'./util/create-scene'
], function(
	CzmlDataSource,
	DataSourceCollection,
	DataSourceDisplay,
	initialize,
	createScene
) {
	'use strict';

	/* global describe, it, beforeAll, afterAll */

	describe('initialize', function() {
		var scene;

		beforeAll(function() {
			scene = createScene();
		});

		afterAll(function() {
			scene.destroyForSpecs();
		});

		it('should create a data source collection', function() {
			initialize();

			var dataSourceCollection = new DataSourceCollection();

			// eslint-disable-next-line no-new
			new DataSourceDisplay({
				scene: scene,
				dataSourceCollection: dataSourceCollection
			});

			dataSourceCollection.add(new CzmlDataSource());
		});
	});
});
