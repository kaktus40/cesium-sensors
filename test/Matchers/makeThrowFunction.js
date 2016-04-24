define(function() {
	'use strict';

	return function makeThrowFunction(debug, Type, name) {
		if (debug) {
			return function() {
				return {
					compare: function(actual) {
						// based on the built-in Jasmine toThrow matcher
						var result = false;
						var exception;

						if (typeof actual !== 'function') {
							throw new Error('Actual is not a function');
						}

						try {
							actual();
						} catch (e) {
							exception = e;
						}

						if (exception) {
							result = exception instanceof Type;
						}

						var message;
						if (result) {
							message = ['Expected function not to throw ' + name + ' , but it threw', exception.message || exception].join(' ');
						} else {
							message = 'Expected function to throw ' + name + '.';
						}

						return {
							pass: result,
							message: message
						};
					}
				};
			};
		}

		return function() {
			return {
				compare: function() {
					return { pass: true };
				},
				negativeCompare: function() {
					return { pass: true };
				}
			};
		};
	};
});
