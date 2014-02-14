// Copyright (c) 2012 Turbulenz Limited



define(
    'spell/physics/2D/Context',
	[
		'spell/physics/2D/Material',
		'spell/physics/2D/Circle'
	],
    function(
	    Physics2DMaterial,
	    Physics2DCircle
	) {

		'use strict'

		var Physics2DContext = function() {
	    }

	    Physics2DContext.prototype.getDefaultMaterial = function () {
	        return Physics2DMaterial.defaultMaterial;
	    };

	    Physics2DContext.prototype.createCircleShape = function (params) {
	        return Physics2DCircle.create(params);
	    };

	    Physics2DContext.prototype.createPolygonShape = function (params) {
	        return Physics2DPolygon.create(params, null);
	    };

	    Physics2DContext.prototype.createRigidBody = function (params) {
	        return Physics2DRigidBody.create(params);
	    };

	    Physics2DContext.prototype.createWorld = function (params) {
	        return Physics2DWorld.create(params);
	    };

	    Physics2DContext.prototype.createMaterial = function (params) {
	        return Physics2DMaterial.create(params);
	    };

	    Physics2DContext.prototype.createSweepAndPruneBroadphase = function () {
	        return Physics2DSweepAndPrune.create();
	    };

	    Physics2DContext.prototype.createBoxTreeBroadphase = function () {
	        return Physics2DBoxTreeBroadphase.create();
	    };

	    Physics2DContext.prototype.createCollisionUtils = function () {
	        return Physics2DCollisionUtils.create();
	    };

	    Physics2DContext.prototype.createPointConstraint = function (params) {
	        return Physics2DPointConstraint.create(params);
	    };

	    Physics2DContext.prototype.createWeldConstraint = function (params) {
	        return Physics2DWeldConstraint.create(params);
	    };

	    Physics2DContext.prototype.createAngleConstraint = function (params) {
	        return Physics2DAngleConstraint.create(params);
	    };

	    Physics2DContext.prototype.createDistanceConstraint = function (params) {
	        return Physics2DDistanceConstraint.create(params);
	    };

	    Physics2DContext.prototype.createLineConstraint = function (params) {
	        return Physics2DLineConstraint.create(params);
	    };

	    Physics2DContext.prototype.createMotorConstraint = function (params) {
	        return Physics2DMotorConstraint.create(params);
	    };

	    Physics2DContext.prototype.createPulleyConstraint = function (params) {
	        return Physics2DPulleyConstraint.create(params);
	    };

	    Physics2DContext.prototype.createCustomConstraint = function (params) {
	        return Physics2DCustomConstraint.create(params);
	    };

	    Physics2DContext.prototype.createRectangleVertices = function (minX, minY, maxX, maxY) {
	        var tmp;
	        if (maxX < minX) {
	            tmp = minX;
	            minX = maxX;
	            maxX = tmp;
	        }
	        if (maxY < minY) {
	            tmp = minY;
	            minY = maxY;
	            maxY = tmp;
	        }

	        var v0 = new Physics2DContext.prototype.floatArray(2);
	        v0[0] = minX;
	        v0[1] = minY;
	        var v1 = new Physics2DContext.prototype.floatArray(2);
	        v1[0] = maxX;
	        v1[1] = minY;
	        var v2 = new Physics2DContext.prototype.floatArray(2);
	        v2[0] = maxX;
	        v2[1] = maxY;
	        var v3 = new Physics2DContext.prototype.floatArray(2);
	        v3[0] = minX;
	        v3[1] = maxY;

	        return [v0, v1, v2, v3];
	    };

	    Physics2DContext.prototype.createBoxVertices = function (width, height) {
	        var w = (width * 0.5);
	        var h = (height * 0.5);

	        var v0 = new Physics2DContext.prototype.floatArray(2);
	        v0[0] = -w;
	        v0[1] = -h;
	        var v1 = new Physics2DContext.prototype.floatArray(2);
	        v1[0] = w;
	        v1[1] = -h;
	        var v2 = new Physics2DContext.prototype.floatArray(2);
	        v2[0] = w;
	        v2[1] = h;
	        var v3 = new Physics2DContext.prototype.floatArray(2);
	        v3[0] = -w;
	        v3[1] = h;

	        return [v0, v1, v2, v3];
	    };

	    Physics2DContext.prototype.createRegularPolygonVertices = function (diameterX, diameterY, numVertices) {
	        var rX = (diameterX * 0.5);
	        var rY = (diameterY * 0.5);
	        var vertices = [];

	        var num = numVertices;
	        var angInc = (Math.PI * 2 / num);

	        var i;
	        for (i = 0; i < num; i += 1) {
	            var ang = (angInc * i);
	            var vec = vertices[vertices.length] = new Physics2DContext.prototype.floatArray(2);
	            vec[0] = (rX * Math.cos(ang));
	            vec[1] = (rY * Math.sin(ang));
	        }

	        return vertices;
	    };

	    Physics2DContext.create = function () {
	        var pd = new Physics2DContext();
	        return pd;
	    };

	    return Physics2DContext;
})

	/*
	 Physics2DDevice.prototype.floatArray = function (arg) {
	 if (arguments.length === 0) {
	 return [];
	 }

	 var i, ret;
	 if (typeof arg === "number") {
	 ret = new Array(arg);
	 } else {
	 ret = [];
	 for (i = 0; i < arg.length; i += 1) {
	 ret[i] = arg[i];
	 }
	 }
	 return ret;
	 };

	 Physics2DDevice.prototype.uint16Array = Physics2DDevice.prototype.floatArray;

	 var testArray, textDescriptor;
	 if (typeof Float32Array !== "undefined") {
	 testArray = new Float32Array(4);
	 textDescriptor = Object.prototype.toString.call(testArray);
	 if (textDescriptor === '[object Float32Array]') {
	 Physics2DDevice.prototype.floatArray = Float32Array;
	 }
	 }

	 if (typeof Uint16Array !== "undefined") {
	 testArray = new Uint16Array(4);
	 textDescriptor = Object.prototype.toString.call(testArray);
	 if (textDescriptor === '[object Uint16Array]') {
	 Physics2DDevice.prototype.uint16Array = Uint16Array;
	 }
	 }
	 */