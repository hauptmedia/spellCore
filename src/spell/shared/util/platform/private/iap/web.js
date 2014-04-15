define(
	'spell/shared/util/platform/private/iap/web',
	[
	],
	function(
		) {
		'use strict'

        var STATE = {
            succeeded: 0,
            alreadyPurchased: 1,
            notFulfilled: 2,
            notPurchased: 3
        }

        //TODO: Mockup, Only for debugging should be changed to paypal or something like that
        var purchases = {}

        var hasProduct = function( productId ) {
            var product = purchases[ productId ]

            return !!product
        }

		return {
			init: function( isDebug ) {
			},
            isProductActive: function( productId ) {
                return hasProduct( productId )
            },
            purchaseProduct: function( productId, successCallback, errorCallback ) {
                if( hasProduct( productId ) ) {
                    return errorCallback( STATE.alreadyPurchased )
                }

                var purchased = confirm("Want to buy '" + productId + "' ?")

                if( purchased ) {
                    purchases[ productId ] = true
                    successCallback()

                } else {
                    errorCallback( STATE.notFulfilled )
                }
            }
		}
	}
)
