/**
 * Utility class which implements (high speed) math functions
 * @singleton
 * @class spell.math.util
 */

define("spell/math/util",
	["spell/shared/util/platform/Types"],

	function (Types) {
		"use strict";


		var mathUtil = {};

		var createFloatArray = Types.createFloatArray;

		// Tweak to your liking
		var FLOAT_EPSILON = 0.000001;

		if (Types.hasFloatArraySupport()) {
			var y = Types.createFloatArray(1);
			var i = Types.createIntegerArray(y.buffer);

			/**
			 * Fast way to calculate the inverse square root,
			 * see [this page](http://jsperf.com/inverse-square-root/5)
			 *
			 * If typed arrays are not available, a slower
			 * implementation will be used.
			 *
			 * @param {Number} number the number
			 * @returns {Number} Inverse square root
			 */
			mathUtil.invsqrt = function (number) {
				var x2 = number * 0.5;
				y[0] = number;
				var threehalfs = 1.5;

				i[0] = 0x5f3759df - (i[0] >> 1);

				var number2 = y[0];

				return number2 * (threehalfs - (x2 * number2 * number2));
			};
		} else {
			mathUtil.invsqrt = function (number) {
				return 1.0 / Math.sqrt(number);
			}
		}

		return mathUtil;
	}

);