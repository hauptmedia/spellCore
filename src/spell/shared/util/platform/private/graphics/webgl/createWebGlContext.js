define(
	'spell/shared/util/platform/private/graphics/webgl/createWebGlContext',
	[
		'spell/shared/util/platform/private/graphics/StateStack',
		'spell/shared/util/platform/private/graphics/webgl/createContext',
		'spell/shared/util/platform/private/graphics/webgl/shaders',

		'spell/shared/util/color',
		'spell/shared/util/math',
		'spell/shared/util/platform/private/createNativeFloatArray',

		'glmatrix/vec3',
		'glmatrix/mat3',
		'glmatrix/mat4'
	],
	function(
		StateStack,
		createContext,
		shaders,

		color,
		math,
		createNativeFloatArray,

		vec3,
		mat3,
		mat4
	) {
		'use strict'


		/**
		 * private
		 */

		var gl
		var stateStack   = new StateStack( 32 )
		var currentState = stateStack.getTop()

		var screenSpaceShimMatrix = mat4.create()
		var shaderProgram

		// view space to screen space transformation matrix
		var viewToScreen = mat4.create()
		mat4.identity( viewToScreen )

		// world space to view space transformation matrix
		var worldToView = mat4.create()
		mat4.identity( worldToView )

		// accumulated transformation world space to screen space transformation matrix
		var worldToScreen = mat4.create()
		mat4.identity( worldToScreen )

		var tmpMatrix     = mat4.create(),
			textureMatrix = mat3.create()


		/**
		 * Creates a projection matrix that normalizes the transformation behaviour to that of the normalized canvas-2d (that is origin is in bottom left,
		 * positive x-axis to the right, positive y-axis up, screen space coordinates as input. The matrix transforms from screen space to clip space.
		 *
		 * @param width
		 * @param height
		 * @param resultMatrix
		 */
		var createScreenSpaceShimMatrix = function( width, height, resultMatrix ) {
			mat4.identity( resultMatrix )

			mat4.ortho(
				0,
				width,
				0,
				height,
				0,
				1000,
				resultMatrix
			)
		}

		var createViewToScreenMatrix = function( width, height, resultMatrix ) {
			mat4.identity( resultMatrix )

			resultMatrix[ 0 ] = width * 0.5
			resultMatrix[ 5 ] = height * 0.5
			resultMatrix[ 12 ] = 0 + width * 0.5
			resultMatrix[ 13 ] = 0 + height * 0.5

			return resultMatrix
		}

		var initWrapperContext = function() {
			viewport( 0, 0, gl.canvas.width, gl.canvas.height )

			// gl initialization
			gl.clearColor( 0.0, 0.0, 0.0, 1.0 )
			gl.clear( gl.COLOR_BUFFER_BIT )

			// setting up blending
			gl.enable( gl.BLEND )
			gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA )

			gl.disable( gl.DEPTH_TEST )

			gl.activeTexture( gl.TEXTURE0 )

			setupShader()
		}

		/**
		 * Creates a wrapper context for the backend context.
		 */
		var createWrapperContext = function() {
			initWrapperContext()

			return {
				clear             : clear,
				createTexture     : createWebGlTexture,
				drawTexture       : drawTexture,
				drawSubTexture    : drawSubTexture,
				fillRect          : fillRect,
				getConfiguration  : getConfiguration,
				resizeColorBuffer : resizeColorBuffer,
				restore           : restore,
				rotate            : rotate,
				save              : save,
				scale             : scale,
				setClearColor     : setClearColor,
				setFillStyleColor : setFillStyleColor,
				setGlobalAlpha    : setGlobalAlpha,
				setTransform      : setTransform,
				setViewMatrix     : setViewMatrix,
				transform         : transform,
				translate         : translate,
				viewport          : viewport
			}
		}

		/**
		 * Returns a rendering context. Once a context has been created additional calls to this method return the same context instance.
		 *
		 * @param canvas - the canvas dom element
		 */
		var createWebGlContext = function( canvas ) {
			if( canvas === undefined ) throw 'Missing first argument.'

			if( gl !== undefined ) return gl


			gl = createContext( canvas )

			if( gl === null ) return null


			return createWrapperContext()
		}

		var setupShader = function() {
			shaderProgram = gl.createProgram()

			var vertexShader = gl.createShader( gl.VERTEX_SHADER )
			gl.shaderSource( vertexShader, shaders.vertex )
			gl.compileShader (vertexShader )
			gl.attachShader( shaderProgram, vertexShader )

			var fragmentShader = gl.createShader( gl.FRAGMENT_SHADER )
			gl.shaderSource( fragmentShader, shaders.fragment )
			gl.compileShader( fragmentShader )
			gl.attachShader( shaderProgram, fragmentShader )

			gl.linkProgram( shaderProgram )
			gl.useProgram( shaderProgram )


			// setting up vertices
			var vertices = createNativeFloatArray( 12 )
			vertices[ 0 ]  = 0.0
			vertices[ 1 ]  = 0.0
			vertices[ 2 ]  = 0.0
			vertices[ 3 ]  = 1.0
			vertices[ 4 ]  = 0.0
			vertices[ 5 ]  = 0.0
			vertices[ 6 ]  = 0.0
			vertices[ 7 ]  = 1.0
			vertices[ 8 ]  = 0.0
			vertices[ 9 ]  = 1.0
			vertices[ 10 ] = 1.0
			vertices[ 11 ] = 0.0


			var vertexPositionBuffer = gl.createBuffer()
			gl.bindBuffer( gl.ARRAY_BUFFER, vertexPositionBuffer )
			gl.bufferData( gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW )


			var attributeLocation = gl.getAttribLocation( shaderProgram, 'aVertexPosition' )
			gl.vertexAttribPointer( attributeLocation, 3, gl.FLOAT, false, 0, 0 )
			gl.enableVertexAttribArray( attributeLocation )


			// setting up texture coordinates
			var textureCoordinates = createNativeFloatArray( 8 )
			textureCoordinates[ 0 ] = 0.0
			textureCoordinates[ 1 ] = 0.0
			textureCoordinates[ 2 ] = 1.0
			textureCoordinates[ 3 ] = 0.0
			textureCoordinates[ 4 ] = 0.0
			textureCoordinates[ 5 ] = 1.0
			textureCoordinates[ 6 ] = 1.0
			textureCoordinates[ 7 ] = 1.0


			var textureCoordinateBuffer = gl.createBuffer()
			gl.bindBuffer( gl.ARRAY_BUFFER, textureCoordinateBuffer )
			gl.bufferData( gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW )

			attributeLocation = gl.getAttribLocation( shaderProgram, 'aTextureCoord' )
			gl.vertexAttribPointer( attributeLocation, 2, gl.FLOAT, false, 0, 0 )
			gl.enableVertexAttribArray( attributeLocation )


			// setting up screen space shim matrix
			var uniformLocation = gl.getUniformLocation( shaderProgram, 'uScreenSpaceShimMatrix' )
			gl.uniformMatrix4fv( uniformLocation, false, screenSpaceShimMatrix )


			// setting up texture matrix
			resetTextureMatrix( textureMatrix )
		}


		var isTextureMatrixIdentity = false

		var resetTextureMatrix = function( matrix ) {
			if( isTextureMatrixIdentity ) return


			matrix[ 0 ] = 1.0
			matrix[ 4 ] = 1.0
			matrix[ 6 ] = 0.0
			matrix[ 7 ] = 0.0

			gl.uniformMatrix3fv( gl.getUniformLocation( shaderProgram, 'uTextureMatrix' ), false, matrix )
		}

		var updateTextureMatrix = function( ss, st, tt, ts, matrix ) {
			isTextureMatrixIdentity = false

			matrix[ 0 ] = ss
			matrix[ 4 ] = st
			matrix[ 6 ] = tt
			matrix[ 7 ] = ts

			gl.uniformMatrix3fv( gl.getUniformLocation( shaderProgram, 'uTextureMatrix' ), false, matrix )
		}


		/**
		 * public
		 */

		var save = function() {
			stateStack.pushState()
			currentState = stateStack.getTop()
		}

		var restore = function() {
			stateStack.popState()
			currentState = stateStack.getTop()
		}

		var setFillStyleColor = function( vec ) {
			currentState.color = color.createRgba( vec )
		}

		var setGlobalAlpha = function( u ) {
			currentState.opacity = u
		}

		var setClearColor = function( vec ) {
			gl.clearColor( vec[ 0 ], vec[ 1 ], vec[ 2 ], 1.0 )
		}

		var scale = function( vec ) {
			mat4.scale( currentState.matrix, vec )
		}

		var translate = function( vec ) {
			mat4.translate( currentState.matrix, vec )
		}

		var rotate = function( u ) {
			mat4.rotateZ( currentState.matrix, -u )
		}

		/**
		 * Clears the color buffer with the clear color
		 */
		var clear = function() {
			gl.clear( gl.COLOR_BUFFER_BIT )
		}

		var drawTexture = function( texture, dx, dy, dw, dh ) {
			if( texture === undefined ) throw 'Texture is undefined'


			if( !dw ) dw = 1.0
			if( !dh ) dh = 1.0

			// setting up fillRect mode
			var uniformLocation = gl.getUniformLocation( shaderProgram, 'uFillRect' )
			gl.uniform1i( uniformLocation, 0 )

			// setting up global alpha
			gl.uniform1f( gl.getUniformLocation( shaderProgram, 'uGlobalAlpha' ), currentState.opacity )

			// setting up global color
			gl.uniform4fv( gl.getUniformLocation( shaderProgram, 'uGlobalColor' ), currentState.color )

			// setting up texture
			gl.bindTexture( gl.TEXTURE_2D, texture.privateGlTextureResource )
			uniformLocation = gl.getUniformLocation( shaderProgram, 'uTexture0' )
			gl.uniform1i( uniformLocation, 0 )

			// setting up transformation
			mat4.multiply( worldToScreen, currentState.matrix, tmpMatrix )

			// rotating the image so that it is not upside down
			mat4.translate( tmpMatrix, [ dx, dy, 0 ] )
			mat4.rotateZ( tmpMatrix, Math.PI )
			mat4.scale( tmpMatrix, [ -dw, dh, 0 ] )
			mat4.translate( tmpMatrix, [ 0, -1, 0 ] )

			gl.uniformMatrix4fv( gl.getUniformLocation( shaderProgram, 'uModelViewMatrix' ), false, tmpMatrix )

			// setting up the texture matrix
			resetTextureMatrix( textureMatrix )

			// drawing
			gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 )
		}

		var drawSubTexture = function( texture, sx, sy, sw, sh, dx, dy, dw, dh ) {
			if( texture === undefined ) throw 'Texture is undefined'


			if( !dw ) dw = 1.0
			if( !dh ) dh = 1.0

			// setting up fillRect mode
			var uniformLocation = gl.getUniformLocation( shaderProgram, 'uFillRect' )
			gl.uniform1i( uniformLocation, 0 )

			// setting up global alpha
			gl.uniform1f( gl.getUniformLocation( shaderProgram, 'uGlobalAlpha' ), currentState.opacity )

			// setting up global color
			gl.uniform4fv( gl.getUniformLocation( shaderProgram, 'uGlobalColor' ), currentState.color )

			// setting up texture
			gl.bindTexture( gl.TEXTURE_2D, texture.privateGlTextureResource )
			uniformLocation = gl.getUniformLocation( shaderProgram, 'uTexture0' )
			gl.uniform1i( uniformLocation, 0 )

			// setting up transformation
			mat4.multiply( worldToScreen, currentState.matrix, tmpMatrix )

			// rotating the image so that it is not upside down
			mat4.translate( tmpMatrix, [ dx, dy, 0 ] )
			mat4.rotateZ( tmpMatrix, Math.PI )
			mat4.scale( tmpMatrix, [ -dw, dh, 0 ] )
			mat4.translate( tmpMatrix, [ 0, -1, 0 ] )

			gl.uniformMatrix4fv( gl.getUniformLocation( shaderProgram, 'uModelViewMatrix' ), false, tmpMatrix )

			// setting up the texture matrix
			var tw = texture.width,
				th = texture.height

			updateTextureMatrix(
				sw / tw,
				sh / th,
				sx / tw,
				sy / th,
				textureMatrix
			)

			// drawing
			gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 )
		}

		var fillRect = function( dx, dy, dw, dh ) {
			// setting up fillRect mode
			var uniformLocation = gl.getUniformLocation( shaderProgram, 'uFillRect' )
			gl.uniform1i( uniformLocation, 1 )

			// setting up global alpha
			gl.uniform1f( gl.getUniformLocation( shaderProgram, 'uGlobalAlpha' ), currentState.opacity )

			// setting up global color
			gl.uniform4fv( gl.getUniformLocation( shaderProgram, 'uGlobalColor' ), currentState.color )

			// setting up transformation
			mat4.multiply( worldToScreen, currentState.matrix, tmpMatrix )

			// correcting position
			mat4.translate( tmpMatrix, [ dx, dy, 0 ] )
			mat4.scale( tmpMatrix, [ dw, dh, 0 ] )

			gl.uniformMatrix4fv( gl.getUniformLocation( shaderProgram, 'uModelViewMatrix' ), false, tmpMatrix )

			// drawing
			gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 )
		}

		var resizeColorBuffer = function( width, height ) {
			gl.canvas.width  = width
			gl.canvas.height = height

			createViewToScreenMatrix( width, height, viewToScreen )
			mat4.multiply( viewToScreen, worldToView, worldToScreen )
		}

		var transform = function( matrix ) {
			mat4.multiply( currentState.matrix, matrix )
		}

		var setTransform = function( matrix ) {
			mat4.set( matrix, currentState.matrix )
		}

		var setViewMatrix = function( matrix ) {
			mat4.set( matrix, worldToView )
			createViewToScreenMatrix( gl.canvas.width, gl.canvas.height, viewToScreen )
			mat4.multiply( viewToScreen, worldToView, worldToScreen )
		}

		var viewport = function( x, y, width, height ) {
			gl.viewport( x, y , width, height )

			// reinitialize screen space shim matrix
			createScreenSpaceShimMatrix( width, height, screenSpaceShimMatrix )

			var uniformLocation = gl.getUniformLocation( shaderProgram, 'uScreenSpaceShimMatrix' )
			gl.uniformMatrix4fv( uniformLocation, false, screenSpaceShimMatrix )
		}

		/**
		 * Returns an object describing the current configuration of the rendering backend.
		 */
		var getConfiguration = function() {
			return {
				type   : 'webgl',
				width  : gl.canvas.width,
				height : gl.canvas.height
			}
		}

		/**
		 * Returns instance of texture class
		 *
		 * The public interface of the texture class consists of the two attributes width and height.
		 *
		 * @param image
		 */
		var createWebGlTexture = function( image ) {
			var texture = gl.createTexture()
			gl.bindTexture( gl.TEXTURE_2D, texture )
			gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image )
			gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR )
			gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
			gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
			gl.generateMipmap( gl.TEXTURE_2D )
			gl.bindTexture( gl.TEXTURE_2D, null )


			return {
				/**
				 * Public
				 */
				width  : image.width,
				height : image.height,

				/**
				 * Private
				 *
				 * This is an implementation detail of the class. If you write code that depends on this you better know what you are doing.
				 */
				privateGlTextureResource : texture
			}
		}

		return createWebGlContext
	}
)