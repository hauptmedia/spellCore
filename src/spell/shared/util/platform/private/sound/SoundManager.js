define(
	"spell/shared/util/platform/private/sound/SoundManager",
	[
		"spell/shared/components/sound/soundEmitter",

		'spell/functions'
	],
	function(
		soundEmitterConstructor,

		_
		) {
		"use strict"

		var maxAvailableChannels = 8
        var context              = undefined
        var muted                = false

		var checkMaxAvailableChannels = function() {
			if( (/iPhone|iPod|iPad/i).test( navigator.userAgent ) ) {
				maxAvailableChannels = 1

			} else {
				maxAvailableChannels = 8
			}

			return maxAvailableChannels
		}

		var basePath = "sounds"

		var channels = {}

		var getFreeChannel = function( resource, isBackground ) {
			var channel = _.find(
				channels,
				function( channel ) {
					if( channel.resource === resource &&
						!channel.playing &&
						!channel.selected )  {

						if( maxAvailableChannels === 1 ) {
							if(	isBackground ) return true
						} else {
							return true
						}
					}

					return false
				}
			)

			if( !!channel ) {
				channel.selected = true
				channel.playing = false
			}

			return channel
		}

		var remove = function( soundObject ) {
			soundObject.stop     = -1
			soundObject.start    = -1
			soundObject.selected = false
            soundObject.playing  = false
		}

		var audioFormats = {
			ogg: {
				mimeTypes: ['audio/ogg; codecs=vorbis']
			},
			mp3: {
				mimeTypes: ['audio/mpeg; codecs="mp3"', 'audio/mpeg', 'audio/mp3', 'audio/MPA', 'audio/mpa-robust']
			},
			wav: {
				mimeTypes: ['audio/wav; codecs="1"', 'audio/wav', 'audio/wave', 'audio/x-wav']
			}
		}

		var detectExtension = function() {

			var probe = new Audio();

			return _.reduce(
				audioFormats,
				function( memo, format, key ) {
					if( !!memo ) return memo

					var supportedMime = _.find(
						format.mimeTypes,
						function( mimeType ) {
							return probe.canPlayType( mimeType )
						}
					)

					return ( !!supportedMime ) ? key : null
				},
				null
			)
		}

		var createHTML5Audio = function ( config ) {
			var html5Audio = new Audio()

			if( !!config.onloadeddata ) {

				html5Audio.addEventListener(
					"canplaythrough", config.onloadeddata,
					false
				)
			}

			html5Audio.addEventListener( "error", function() {
				throw "Error: Could not load sound resource '"+html5Audio.src+"'"
			}, false )

			html5Audio.id       = config.id
			html5Audio.resource = config.resource
			html5Audio.playing  = false
			html5Audio.selected = false
			html5Audio.src      = basePath + "/" + config.resource + "."+ detectExtension()

			// old WebKit
			html5Audio.autobuffer = "auto"

			// new WebKit
			html5Audio.preload = "auto"
			html5Audio.load()

			return html5Audio
		}

		var cloneHTML5Audio = function( ObjectToClone ) {
			var html5Audioclone = ObjectToClone.cloneNode(true)

			html5Audioclone.resource = ObjectToClone.resource
			html5Audioclone.playing  = false
			html5Audioclone.selected = false

			return html5Audioclone
		}

        var createWebkitHTML5Audio = function ( config ) {
            var request = new XMLHttpRequest();
            request.open('GET', basePath + "/" + config.resource + "."+ detectExtension(), true);
            request.responseType = 'arraybuffer';

            if( !!config.onloadeddata ) {

                // Decode asynchronously
                request.onload = function() {
                  context.decodeAudioData( request.response,
                      function( buffer ) {

                          buffer.id       = config.id
                          buffer.resource = config.resource
                          buffer.playing  = false
                          buffer.selected = false

                          config.onloadeddata( buffer )
                      }

                  );
                }
            }

            request.onError = function() {
                throw "Error: Could not load sound resource '"+ config.resource +"'"
            }

            request.send()

            return request
        }

        var hasWebAudioSupport = function() {
            try{
                context = new webkitAudioContext()
                return true
            }catch( e ) {
                return false
            }
        }

        var toggleMuteSounds = function( muted ) {
            _.each(
                _.keys( channels ),
                function( key) {

                    if( hasWebAudioSupport() ) {
                        channels[key].gain  = ( muted === true ) ? 0 : 1

                    } else {
                        channels[key].muted = muted

                        if( maxAvailableChannels === 1 ) {
                            if( muted === true)
                                channels[ key ].pause()
                            else
                                channels[ key ].play()
                        }
                    }
                }
            )
        }

        var setMuted = function( value ) {
            muted = !!value
            toggleMuteSounds( muted )
        }

        var isMuted = function() {
            return muted
        }

        var SoundManager = function() {

            if( !hasWebAudioSupport() ) {
                this.createAudio = createHTML5Audio
                this.cloneAudio  = cloneHTML5Audio

            }else {
                this.createAudio = createWebkitHTML5Audio
                this.context          = context
            }

        }

        SoundManager.prototype = {
            soundSpriteConfig         : undefined,
            audioFormats              : audioFormats,
            channels                  : channels,
            getFreeChannel            : getFreeChannel,
            checkMaxAvailableChannels : checkMaxAvailableChannels,
            maxAvailableChannels      : maxAvailableChannels,
            remove                    : remove,
            setMuted                  : setMuted,
            isMuted                   : isMuted
        }

        return SoundManager
	}
)
