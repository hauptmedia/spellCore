define(
	'spell/shared/util/blueprints/BlueprintManager',
	[
		'spell/shared/util/deepClone',
		'spell/shared/util/blueprints/createLocalComponentName',
		'spell/shared/util/platform/underscore'
	],
	function(
		deepClone,
		createLocalComponentName,
		_
	) {
		'use strict'


		/**
		 * private
		 */

		var blueprintTypes = {
			BLUEPRINT_TYPE_ENTITY    : 'entityBlueprint',
			BLUEPRINT_TYPE_COMPONENT : 'componentBlueprint',
			BLUEPRINT_TYPE_SYSTEM    : 'systemBlueprint'
		}

		var createName = function() {
		    return _.reduce(
		        arguments,
		        function( memo, argument ) {
		            if( argument === '' ) return memo

		            return memo + ( memo !== '' ? '.' : '' )  + argument
		        },
		        ''
		    )
		}

		var isValidComponentBlueprint = function( blueprint ) {
			// check for ambiguous attribute names
			var attributeNameCounts = _.reduce(
				blueprint.attributes,
				function( memo, attributeConfig ) {
					var attributeName = attributeConfig.name

					memo[ attributeName ] = ( _.has( memo, attributeName ) ?
						memo[ attributeName ] += 1 :
						1
					)

					return memo
				},
				{}
			)

			return !_.any(
				attributeNameCounts,
				function( iter ) { return iter > 1 }
			)
		}

		var isValidEntityBlueprint = function( blueprint ) {
			// check for ambiguous local component names
			var componentNameCounts = _.reduce(
				blueprint.components,
				function( memo, componentConfig ) {
					var localComponentName = createLocalComponentName( componentConfig.blueprintId, componentConfig.importName )

					memo[ localComponentName ] = ( _.has( memo, localComponentName ) ?
						memo[ localComponentName ] += 1 :
						1
					)

					return memo
				},
				{}
			)

			return !_.any(
				componentNameCounts,
				function( iter ) { return iter > 1 }
			)
		}

		var isValidDefinition = function( blueprint ) {
			var bluePrintType = blueprint.type

			if( !_.contains( blueprintTypes, bluePrintType ) ) return false


			if( bluePrintType === blueprintTypes.BLUEPRINT_TYPE_COMPONENT ) {
				return isValidComponentBlueprint( blueprint )
			}

			if( bluePrintType === blueprintTypes.BLUEPRINT_TYPE_ENTITY ) {
				return isValidEntityBlueprint( blueprint )
			}

			return true
		}

		var throwCouldNotFindBlueprint = function( blueprintId, blueprintType ) {
			throw 'Error: Could not find a blueprint with id \'' + blueprintId + ( blueprintType ? '\' of type ' + blueprintType : '' ) + '.'
		}

		var createComponentTemplate = function( componentBlueprint, hasSingleAttribute ) {
			if( hasSingleAttribute ) {
				return _.clone( componentBlueprint.attributes[ 0 ][ 'default' ] )
			}

			return _.reduce(
				componentBlueprint.attributes,
				function( memo, attributeConfig ) {
					memo[ attributeConfig.name ] = _.clone( attributeConfig[ 'default' ] )

					return memo
				},
				{}
			)
		}

		var updateComponent = function( component, attributeConfig, hasSingleAttribute ) {
			if( attributeConfig === undefined ) {
				return component

			} else if( hasSingleAttribute ) {
				return  _.clone( attributeConfig )

			} else {
				return _.extend( component, attributeConfig )
			}
		}

		var createEntityTemplate = function( blueprints, entityBlueprint ) {
			return _.reduce(
				entityBlueprint.components,
				function( memo, componentConfig ) {
					var componentBlueprintId = componentConfig.blueprintId,
						componentBlueprint = getBlueprint( blueprints, componentBlueprintId, blueprintTypes.BLUEPRINT_TYPE_COMPONENT )

					if( !componentBlueprint ) throwCouldNotFindBlueprint( componentBlueprintId, blueprintTypes.BLUEPRINT_TYPE_COMPONENT )


					var localComponentName = createLocalComponentName( componentBlueprintId, componentConfig.importName ),
						hasSingleAttribute = isSingleAttributeComponent( componentBlueprint.attributes )

					memo[ localComponentName ] = updateComponent(
						createComponentTemplate( componentBlueprint, hasSingleAttribute ),
						componentConfig.config,
						hasSingleAttribute
					)

					return memo
				},
				{}
			)
		}

		var addBlueprint = function( blueprints, entityPrototype, definition ) {
			var blueprintId = createName( definition.namespace, definition.name )

			if( _.has( blueprints, blueprintId ) ) throw 'Error: Blueprint definition \'' + blueprintId + '\' already exists.'


			blueprints[ blueprintId ] = definition

			if( definition.type === blueprintTypes.BLUEPRINT_TYPE_ENTITY ) {
				entityPrototype[ blueprintId ] = createEntityTemplate( blueprints, definition )
			}
		}

		var getBlueprint = function( blueprints, blueprintId, blueprintType ) {
			var blueprint = blueprints[ blueprintId ]

			return ( !blueprint ?
				false :
				( !blueprintType ?
					blueprint :
					( blueprint.type !== blueprintType ?
						false :
						blueprint
					)
				)
			)
		}

		var isSingleAttributeComponent = function( attributes ) {
			if( attributes === undefined ) throw 'Error: \'attributes\' is of type falsy.'

			return _.isObject( attributes ) &&
				_.size( attributes ) === 1 &&
				attributes[ 0 ].name === 'value'
		}

		var createEntityFromBlueprint = function( blueprints, blueprintId, entity, config ) {
			return _.reduce(
				config,
				function( memo, componentConfig, componentId ) {
					var componentBlueprint = getBlueprint( blueprints, componentId, blueprintTypes.BLUEPRINT_TYPE_COMPONENT )

					if( !_.has( memo, componentId ) ) {
						throw 'Error: Entity template for entity blueprint \'' + blueprintId + '\' is missing component \'' + componentId + '\'.' +
							' Maybe you forgot to add the component to the entity blueprint?'
					}

					memo[ componentId ] = updateComponent(
						memo[ componentId ],
						componentConfig,
						isSingleAttributeComponent( componentBlueprint.attributes )
					)

					return memo
				},
				entity
			)
		}

		var createEntity = function( blueprints, config ) {
			return _.reduce(
				config,
				function( memo, componentConfig, componentId ) {
					var componentBlueprint = getBlueprint( blueprints, componentId, blueprintTypes.BLUEPRINT_TYPE_COMPONENT ),
						hasSingleAttribute = isSingleAttributeComponent( componentBlueprint.attributes )

					memo[ componentId ] = updateComponent(
						createComponentTemplate( componentBlueprint, hasSingleAttribute ),
						componentConfig,
						hasSingleAttribute
					)

					return memo
				},
				{}
			)
		}


		/**
		 * public
		 */

		function BlueprintManager() {
			this.blueprints = {}
			this.entityPrototypes = {}
		}

		BlueprintManager.prototype = {
			add : function( definition ) {
				if( !definition.type ||
					!isValidDefinition( definition ) ) {

					throw 'Error: The format of the supplied blueprint definition is invalid.'
				}

				addBlueprint( this.blueprints, this.entityPrototypes, definition )
			},

			createEntityComponents : function( blueprintId, config ) {
				if( blueprintId ) {
					var entityPrototype = this.entityPrototypes[ blueprintId ]

					if( !entityPrototype ) throw 'Error: Could not find entity prototype for blueprint id \'' + blueprintId + '\'.'

					return createEntityFromBlueprint( this.blueprints, blueprintId, deepClone( entityPrototype ), config )

				} else {
					return createEntity( this.blueprints, config )
				}
			},

			hasBlueprint : function( blueprintId ) {
				return !!getBlueprint( this.blueprints, blueprintId )
			},

			getBlueprint : function( blueprintId ) {
				return getBlueprint( this.blueprints, blueprintId )
			},

			getBlueprintIds : function( blueprintType ) {
				if( !_.contains( blueprintTypes, blueprintType ) ) throw 'Error: Blueprint type \'' + blueprintType + '\' is not supported.'

				return _.reduce(
					this.blueprints,
					function( memo, blueprint, blueprintId ) {
						return blueprint.type === blueprintType ? memo.concat( blueprintId ) : memo
					},
					[]
				)
			},

			/**
			 * Returns true if the component is a single attribute component, false otherwise.
			 *
			 * @param blueprintId - component blueprint id
			 * @return {*}
			 */
			isSingleAttributeComponent : function( blueprintId ) {
				var blueprint = getBlueprint( this.blueprints, blueprintId, blueprintTypes.BLUEPRINT_TYPE_COMPONENT )

				if( !blueprint ) throw 'Error: Could not find component blueprint with id \'' + blueprintId + '\'.'

				return isSingleAttributeComponent( blueprint.attributes )
			}
		}

		return BlueprintManager
	}
)
