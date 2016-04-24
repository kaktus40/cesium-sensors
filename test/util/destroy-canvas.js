/* eslint-env browser */
define(function() {
	'use strict';

	return function destroyCanvas(canvas) {
		if (canvas) {
			document.body.removeChild(canvas);
		}
	};
});
