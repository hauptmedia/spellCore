define("spell/script/editor/entityMover",
	[
		'spell/math/vec2',
		'spell/math/mat3',
		'spell/functions'
	],
	function(
		vec2,
		mat3,
		_
		) {
		"use strict";
		var isPointInRect = function( point, rectOrigin, rectWidth, rectHeight, rectRotation ) {
			var tmp     = -rectRotation, /** Math.PI / 180,*/
					c       = Math.cos( tmp ),
				s       = Math.sin( tmp),
				leftX   = rectOrigin[ 0 ] - rectWidth / 2,
				rightX  = rectOrigin[ 0 ] + rectWidth / 2,
				topY    = rectOrigin[ 1 ] - rectHeight / 2,
				bottomY = rectOrigin[ 1 ] + rectHeight / 2

			// Unrotate the point depending on the rotation of the rectangle
			var rotatedX = rectOrigin[ 0 ] + c * ( point[ 0 ] - rectOrigin[ 0 ] ) - s * ( point[ 1 ] - rectOrigin[1] ),
				rotatedY = rectOrigin[ 1 ] + s * ( point[ 0 ] - rectOrigin[ 0 ] ) + c * ( point[ 1 ] - rectOrigin[1] )

			return leftX <= rotatedX && rotatedX <= rightX && topY <= rotatedY && rotatedY <= bottomY
		}



		var calculateOutlineBoxDimensions = function( entityId ) {
			var width = 0,
				height = 0

			if ( this.appearances[ entityId ] &&
				this.appearances[ entityId ].asset &&
				this.appearances[ entityId ].asset.resource &&
				this.appearances[ entityId ].asset.resource.dimensions ) {

				//entity has a static appearance
				width = this.appearances[ entityId ].asset.resource.dimensions[ 0 ]
				height = this.appearances[ entityId ].asset.resource.dimensions[ 1 ]



			} else if ( this.animatedAppearances[ entityId ] &&
				this.animatedAppearances[ entityId ].asset &&
				this.animatedAppearances[ entityId ].asset.frameDimensions ) {

				//entity has an animated appearance
				width = this.animatedAppearances[ entityId ].asset.frameDimensions[ 0 ],
					height = this.animatedAppearances[ entityId ].asset.frameDimensions[ 1 ]

			}

			//camera, physics only entites?

			//apply scale factor
			if ( this.transforms[ entityId ] ) {
				width *= Math.abs( this.transforms[ entityId ].worldScale[ 0 ] )
				height *= Math.abs( this.transforms[ entityId ].worldScale[ 1 ] )
			}

			return [ width, height ]
		}

		var isPointWithinEntity = function ( worldPosition, entityId ) {
			var isOverlayEntity = _.contains(
				_.values( this.overlayEntityMap ),
				entityId
			)

			if (isOverlayEntity) {
				//no further processing for overlay entites
				return false
			}

			var transform = this.transforms[ entityId ],
			    entityDimensions = calculateOutlineBoxDimensions.call( this, entityId )

			return isPointInRect( worldPosition, transform.worldTranslation, entityDimensions[ 0 ], entityDimensions[ 1 ], transform.worldRotation )

		}

		var syncOverlayEntitesWithMatchedEntites = function ( overlayEntityMap, matchedEntites ) {
			var entityManager = this.spell.entityManager

			for ( var i= 0,length=matchedEntites.length; i<length; i++) {

				var entityId            = matchedEntites[ i ],
					transform           = this.transforms[ entityId ],
					name                = this.names[ entityId ],
					entityDimensions    = calculateOutlineBoxDimensions.call( this, entityId),
					overlayEntityId     = overlayEntityMap[ entityId ]

				if ( overlayEntityId  ) {
					//overlay for entity already exists, so update it

					//bypass updateComponent mechanic for updating the transform component on purpose
					//don't to this within normal systems
					var transformOverlay = this.transforms[ overlayEntityId ]
					vec2.set( transform.worldTranslation, transformOverlay.translation )
					transformOverlay.rotation = transform.worldRotation

					var text, color

					if( this.selectedEntity == entityId ) {
						text    = (name) ? name.value : entityId
						color   = [1, 0, 0]
					} else {
						text    = ''
						color   = [1, 0 ,1]
					}


					entityManager.updateComponent( overlayEntityMap[ entityId ], 'spell.component.2d.graphics.debug.box', {
						'color': color,
						'height': entityDimensions[ 1 ],
						'width': entityDimensions[ 0 ]
					})


					entityManager.updateComponent( overlayEntityMap[ entityId ], 'spell.component.2d.graphics.textAppearance', {
						'text': text
					})
				}
				else {

					var overlayEntityId = entityManager.createEntity({
						'config': {
							'spell.component.2d.transform': {
								'translation': transform.worldTranslation
							},
							'spell.component.2d.graphics.textAppearance': {
								'text': ''
							},
							'spell.component.visualObject': {
								'layer': 99999999
							},
							'spell.component.2d.graphics.debug.box': {
								'color': [1, 0, 1],
								'height': entityDimensions[ 1 ],
								'width': entityDimensions[ 0 ]
							}
						}
					})

					overlayEntityMap[ entityId ] = overlayEntityId
				}

			}

			//now remove all overlay entites that are not needed anymore
			var currentlyOverlayedEntites   = _.keys( overlayEntityMap),
				overlaysThatNeedRemovalList = _.difference( currentlyOverlayedEntites, matchedEntites )

			for ( var i= 0,length=overlaysThatNeedRemovalList.length; i<length; i++) {
				var entityId = overlaysThatNeedRemovalList[ i ]

				entityManager.removeEntity( overlayEntityMap[ entityId ] )
				delete overlayEntityMap[ entityId ]

				if ( entityId == this.selectedEntity && !this.isDragging ) {
					//if we removed the selectedEntity and we're not dragging it, deselect it
					this.selectedEntity = null
				}
			}

			return overlayEntityMap
		}

		var highlightEntitiesAtPosition = function( worldPosition ) {

			if ( this.isDragging ) {
				//Don't highlight entites while dragging
				this.matchedEntities.length = 0
			} else {
				//find all entities that match with the current cursor position
				this.matchedEntities = _.filter(
					_.keys( this.transforms ),
					_.bind (
						isPointWithinEntity,
						this,
						worldPosition
					)
				)
			}

			//highlight the found entities with overlays
			syncOverlayEntitesWithMatchedEntites.call(
				this,
				this.overlayEntityMap,
				this.matchedEntities
			)
		}

		var sendTransformToSpellEd = function( entityId ) {
			this.spell.entityManager.updateWorldTransform( entityId )
			this.isDirty = false

			this.spell.sendMessageToEditor(
				'spelled.entity.update', {
				id: entityId,
				componentId: 'spell.component.2d.transform',
				config: {
					translation: this.transforms[ entityId ].translation
				}
			})
		}

		var startDragging = function( entityId, cursorPosition ) {
			this.isDragging = true

			var transform = this.transforms[ entityId ]

			if (!this.dragCursorOffset) {
				this.dragCursorOffset = vec2.create()
				vec2.set(this.currentWorldPosition, this.dragCursorOffset)
			}

			if (!this.dragEntityOffset && transform) {
				this.dragEntityOffset = vec2.create()
				vec2.set(transform.translation, this.dragEntityOffset)
			}
		}

		var stopDragging = function( entityId, cursorPosition ) {
			this.isDragging = false
			this.dragCursorOffset = null
			this.dragEntityOffset = null

			if(this.isDirty) {
				sendTransformToSpellEd.call( this, this.selectedEntity )
				this.selectedEntity = null
			}
		}

		var cancelSelection = function() {
			this.selectedEntity = null
			this.matchedEntities.length = 0

			syncOverlayEntitesWithMatchedEntites.call( this, this.overlayEntityMap, this.matchedEntities)
		}

		var updateEntityByWorldPosition = function( entityId, cursorPosition ) {

			var transform        = this.transforms[ entityId ],
				distance         = vec2.create( ),
				worldPosition    = transform.translation

			vec2.subtract(this.dragCursorOffset, cursorPosition, distance )
			vec2.subtract(this.dragEntityOffset, distance, worldPosition)

			updateEntity.call( this, entityId, worldPosition )
		}

		var updateEntityByRelativeOffset = function( entityId, offset ) {
			var transform           = this.transforms[ entityId ],
				currentTranslation  = transform.translation

			vec2.add(currentTranslation, offset, currentTranslation)

			updateEntity.call(this, entityId, currentTranslation)
			sendTransformToSpellEd.call( this, entityId )
		}

		var updateEntity = function( entityId, newTranslation ) {
			this.isDirty = true

			var transform           = this.transforms[ entityId ],
				currentTranslation  = transform.translation,
				overlayEntityId     = this.overlayEntityMap[ entityId ]

			vec2.set(currentTranslation, newTranslation)

			if( overlayEntityId && this.transforms[ overlayEntityId ]) {
				vec2.set(currentTranslation, this.transforms[ overlayEntityId ].translation)
			}

		}

		var toggleThroughMatchedEntites = function( matchedEntites, activeEntityId ) {
			var index = _.indexOf( matchedEntites, activeEntityId )

			if(index === -1) {
				index = 0
			} else {
				index = (index + 1) % matchedEntites.length
			}

			this.selectedEntity = matchedEntites[ index ]
		}


		var entityMover = function(spell, editorSystem) {

			this.currentWorldPosition   = null

			/**
			 * Map entity => corresponding overlay entity
			 * @type {Object}
			 */
			this.overlayEntityMap         = {}

			/**
			 * id of the currently selected entity
			 * @type {string}
			 */
			this.selectedEntity           = null

			/**
			 * Is corrently a drag going on?
			 * @type {null}
			 */
			this.isDragging               = false

			/**
			 * Do we have unsaved data?
			 * @type {Boolean}
			 */
			this.isDirty                  = false

			/**
			 * List of entities which match for the current cursor (through all layers)
			 * @type {Array}
			 */
			this.matchedEntities          = []

			/**
			 * While an entity is dragged, we remember the offset from the dragstart
			 * @type {null}
			 */
			this.dragCursorOffset         = null

			/**
			 * Remember the origin of the entity
			 * @type {null}
			 */
			this.dragEntityOffset         = null


		}

		entityMover.prototype = {

			init: function( spell, editorSystem ) {
				this.spell                  = spell
				this.transforms             = editorSystem.transforms
				this.appearances            = editorSystem.appearances
				this.animatedAppearances    = editorSystem.animatedAppearances
				this.names                  = editorSystem.names
			},

			activate: function( spell, editorSystem, event ) {

			},

			deactivate: function( spell, editorSystem ) {
				//remove all overlay entities
				for ( var entityId in this.overlayEntityMap ) {
					spell.entityManager.removeEntity( this.overlayEntityMap[ entityId ] )
					delete this.overlayEntityMap[ entityId ]
				}
			},

			process: function( spell, editorSystem, timeInMs, deltaTimeInMs) {
				if( this.currentWorldPosition ) {
					highlightEntitiesAtPosition.call( this, this.currentWorldPosition )
				}
			},

			onMouseDown: function( spell, editorSystem, event ) {
				if( event.button != 0 ) {
					return
				}

				if(!this.selectedEntity && this.matchedEntities.length > 0 ) {
					//if no entity is selected and a drag is going on
					this.selectedEntity = this.matchedEntities[ this.matchedEntities.length - 1 ]
				}

				if( this.selectedEntity ) {
					startDragging.call( this, this.selectedEntity, event.position )
				}
			},

			onMouseUp: function( spell, editorSystem, event ) {
				if( event.button == 0 && this.isDragging ) {
					stopDragging.call( this, this.selectedEntity, event.position )
				}
			},

			onMouseMove: function( spell, editorSystem, event ) {
				this.currentWorldPosition = spell.renderingContext.transformScreenToWorld( event.position )

				if( this.selectedEntity && this.isDragging ) {
					updateEntityByWorldPosition.call( this, this.selectedEntity, this.currentWorldPosition )
				}
			},

			onKeyDown: function( spell, editorSystem, event ) {
				if(event.keyCode == 27 && this.selectedEntity ) {
					//ESC cancels selection
					cancelSelection.call( this )

				} else if( event.keyCode == 9 && this.matchedEntities.length > 0) {
					//TAB toggles through selected entity
					toggleThroughMatchedEntites.call(this, this.matchedEntities, this.selectedEntity )

				} else if( event.keyCode == 37 && this.selectedEntity ) {
					//Left arrow moves the selected entity one pixel to the left
					updateEntityByRelativeOffset.call( this, this.selectedEntity, [-1, 0])

				} else if( event.keyCode == 38 && this.selectedEntity ) {
					//top arrow moves the selected entity one pixel up
					updateEntityByRelativeOffset.call( this, this.selectedEntity, [0, 1])

				} else if( event.keyCode == 39 && this.selectedEntity ) {
					//right arrow moves the selected entity one pixel to the right
					updateEntityByRelativeOffset.call( this, this.selectedEntity, [1, 0])

				} else if( event.keyCode == 40 && this.selectedEntity ) {
					//down arrow moves the selected entity one pixel down
					updateEntityByRelativeOffset.call( this, this.selectedEntity, [0, -1])

				}
			},

			onKeyUp: function( spell, editorSystem, event ) {

			}
		}

		return entityMover


})