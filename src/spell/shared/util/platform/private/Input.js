define(
	"spell/shared/util/platform/private/Input",
	[
		"spell/shared/util/input/keyCodes",
		"spell/shared/util/math",

		"underscore"
	],
	function(
		keyCodes,
		math,

		_
	) {
		"use strict"


		/**
		 * private
		 */
		var isEventSupported = function( eventName ) {
			return _.has( nativeEventMap, eventName )
		}

		function getScreenOffset() {
			return getOffset( document.getElementById( 'spell-canvas' ) )
		}

		function getOffset( element ) {
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

		var nativeTouchHandler = function( callback, event ) {
			event.stopPropagation()
			event.preventDefault()

			var touch = event.changedTouches[ 0 ]
			var offset = getScreenOffset()
			var screenSize = this.configurationManager.screenSize

			var position = [
				( touch.pageX - offset[ 0 ] ) / screenSize.width,
				( touch.pageY - offset[ 1 ] ) / screenSize.height
			]

			// if the event missed the display it gets ignored
			if( !math.isInInterval( position[ 0 ], 0.0, 1.0 ) ||
				!math.isInInterval( position[ 1 ], 0.0, 1.0 ) ) {

				return
			}

			callback( {
				type     : event.type,
				position : position
			} )
		}

		var nativeKeyHandler = function( callback, event ) {
			if( event.keyCode === keyCodes[ 'space' ] ||
				event.keyCode === keyCodes[ 'left arrow' ] ||
				event.keyCode === keyCodes[ 'up arrow' ] ||
				event.keyCode === keyCodes[ 'right arrow' ] ||
				event.keyCode === keyCodes[ 'down arrow' ] ) {

				event.preventDefault()
			}

			callback( event )
		}

        var nativeMouseHandler = function( callback, event ) {
            event.preventDefault()

			var offset = getScreenOffset()
			var screenSize = this.configurationManager.screenSize

			var position = [
				( event.pageX - offset[ 0 ] ) / screenSize.width,
				( event.pageY - offset[ 1 ] ) / screenSize.height
			]

            // if the event missed the display it gets ignored
            if( !math.isInInterval( position[ 0 ], 0.0, 1.0 ) ||
                !math.isInInterval( position[ 1 ], 0.0, 1.0 ) ) {

                return
            }

            callback( {
                type     : event.type,
                position : position
            } )
        }

		/**
		 * maps the internal event name to to native event name and callback
		 */
		var nativeEventMap = {
            touchstart : {
                eventName : 'touchstart',
                handler   : nativeTouchHandler
            },
            touchend : {
                eventName : 'touchend',
                handler   : nativeTouchHandler
            },
			mousedown : {
				eventName : 'mousedown',
				handler   : nativeMouseHandler
			},
			mouseup : {
				eventName : 'mouseup',
				handler   : nativeMouseHandler
			},
			keydown : {
				eventName : 'keydown',
				handler   : nativeKeyHandler
			},
			keyup : {
				eventName : 'keyup',
				handler   : nativeKeyHandler
			}
		}


		/**
		 * public
		 */

		var Input = function( configurationManager ) {
			this.configurationManager = configurationManager
		}

		var setListener = function( eventName, callback ) {
			if( !isEventSupported( eventName ) ) return

			var nativeEvent = nativeEventMap[ eventName ]

            document.body[ 'on' + nativeEvent.eventName ] = _.bind( nativeEvent.handler, this, callback )
		}

		var removeListener = function( eventName ) {
			if( !isEventSupported( eventName ) ) return

			var nativeEvent = nativeEventMap[ eventName ]

            document.body[ 'on' + nativeEvent.eventName ] = null
		}

		Input.prototype = {
			setInputEventListener    : setListener,
			removeInputEventListener : removeListener
		}

		return Input
	}
)