define(
	'spell/shared/util/platform/private/getAvailableScreenSize',
	function() {
		'use strict'


		var getOffset = function( element ) {
			var box = element.getBoundingClientRect()

			var body    = document.body
			var docElem = document.documentElement

			var scrollTop  = window.pageYOffset || docElem.scrollTop || body.scrollTop
			var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft

			var clientTop  = docElem.clientTop || body.clientTop || 0
			var clientLeft = docElem.clientLeft || body.clientLeft || 0

			var top  = box.top + scrollTop - clientTop
			var left = box.left + scrollLeft - clientLeft

			return [ Math.round( left ), Math.round( top ) ]
		}

		return function( id ) {
			if( !id ) {
				throw 'Missing container id argument. Please call the function with the spell container id.'
			}

			var offset = getOffset( document.getElementById( id ) ),
				width  = window.innerWidth - offset[ 0 ],
				height = window.innerHeight - offset[ 1 ]

			return [ width, height ]
		}
	}
)
