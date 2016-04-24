/* eslint-env browser */
define(function() {
	'use strict';

	function destroyCanvas(canvas) {
		if (canvas) {
			document.body.removeChild(canvas);
		}
	}

	return destroyCanvas;
});
