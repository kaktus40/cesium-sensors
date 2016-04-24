define(function(require) {
	'use strict';

	var defined = require('Cesium/Core/defined');

	return function removePrimitive(entity, hash, primitives) {
		var data = hash[entity.id];
		if (defined(data)) {
			var primitive = data.primitive;
			primitives.remove(primitive);
			if (!primitive.isDestroyed()) {
				primitive.destroy();
			}
			delete hash[entity.id];
		}
	};
});
