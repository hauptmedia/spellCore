define(
	'spellTest/LibraryManager',
	[
		'chai',
		'spell/LibraryManager'
	],
	function(
		chai,
		LibraryManager
	) {
		'use strict'


		var testLibrary = {
			'library/test/component4.json': {
				"type": "component",
				"readonly": true,
				"engineInternal": true,
				"title": "Test",
				"doc": "test",
				"attributes": [
					{
						"name": "test",
						"doc": "ids of the children entities",
						"default": [],
						"type": "list"
					}
				],
				"version": 1
			},

			'library/test/component3.json': {
				"type": "component",
				"readonly": true,
				"engineInternal": true,
				"title": "Test",
				"doc": "test",
				"attributes": [
					{
						"name": "test",
						"doc": "ids of the children entities",
						"default": [],
						"type": "list"
					}
				],
				"version": 1
			},

			'library/test/component2.json': {
				"type": "component",
				"readonly": true,
				"engineInternal": true,
				"title": "Test",
				"doc": "test",
				"attributes": [
					{
						"name": "test",
						"doc": "ids of the children entities",
						"default": [],
						"type": "list"
					}
				],
				"version": 1
			},

			'library/test/component1.json': {
				"type": "component",
				"readonly": true,
				"engineInternal": true,
				"title": "Test",
				"doc": "test",
				"attributes": [
					{
						"name": "test",
						"doc": "ids of the children entities",
						"default": [],
						"type": "list"
					}
				],
				"version": 1
			},

			'library/test/entityTemplate.json': {
				"type": "entityTemplate",
				"config": {
						"test.component3": {}
				},
				"children": [],
				"version": 1
			},

			'library/test/update/system.json': {
				"version": 1,
				"type": "system",
				"input": [
					{
						"name": "testInput",
						"componentId": "test.component1"
					}
				],
				"config": [
					{
						"name": "active",
						"type": "boolean",
						"default": true,
						"doc": "if active is false the system will be skipped during processing"
					}
				]
			},

			'library/test/render/system.json': {
				"version": 1,
				"type": "system",
				"input": [
					{
						"name": "testInput",
						"componentId": "test.component2"
					}
				],
				"config": [
					{
						"name": "active",
						"type": "boolean",
						"default": true,
						"doc": "if active is false the system will be skipped during processing"
					}
				]
			},

			'library/test/Scene.json': {
				"version": 1,
				"type": "scene",
				"systems": {
					"update": [
						{
							"id": "test.update.system",
							"config": {
								"active": true
							}
						}
					],
					"render": [
						{
							"id": "test.render.system",
							"config": {
								"active": true
							}
						}
					]
				},
				"dependencies": [],
				"entities": [
					{
						"name": "camera",
						"entityTemplateId": "test.entityTemplate",
						"config": {
							"test.component4": {
								"active": true
							}
						}
					}
				]
			}
		}


		return function( describe, it ) {
			var expect = chai.expect

			var requestManagerMock = {
                get : function( url, callback, forceType ) {
	                var result = null

	                if( testLibrary[ url ] ) {
		                callback( null, testLibrary[ url ] )

	                } else {
		                callback( 'Could not load ' + url, null )
	                }
                }
            }

			var libraryManager = new LibraryManager(
                requestManagerMock
            )

			describe( 'LibraryManager', function( ) {
                it( 'loadRecords should load a scene and it\'s dependencies', function( done ) {
                    libraryManager.loadRecords( 'test.Scene', function( err, data ) {
	                    expect( err ).to.not.exist
						expect( data ).to.exists

                        expect( data ).to.have.property( 'test.Scene' )
	                    expect( data ).to.have.property( 'test.component1' )
	                    expect( data ).to.have.property( 'test.component2' )
	                    expect( data ).to.have.property( 'test.component3' )
	                    expect( data ).to.have.property( 'test.component4' )
	                    expect( data ).to.have.property( 'test.entityTemplate' )
	                    expect( data ).to.have.property( 'test.render.system' )
	                    expect( data ).to.have.property( 'test.update.system' )

                        done()
                    } )
                })

				it( 'loadRecords should fail on a unresolvable libraryId', function( done ) {
					libraryManager.loadRecords( ['test.not.existent', 'test.not.existent2'], function( err, data ) {
						expect( err ).to.exist

						done()
					} )
				})

		})

	}
})