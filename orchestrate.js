var geocode = require('./geocode');
var errors = require('./errors');

var query_processer = require('./process_query');
var foursquare = require('./foursquare');

exports.process_input = function (input_str,callback) {	
	foursquare.getAllCategories(function(){
		query_processer.process_input_query(input_str,function(result){
			if(result) {
				process_location_food(result.place,result.food,callback);	
			} else {
				callback(undefined,errors.getMsg("INPUT_PARSE_ERROR"));
			}
		});		
	});
}

function process_location_food(place,food,callback) {
	console.log("Start process place ("+place+") for food: ("+food+")");

    geocode.getGeoCode(place,function(code,error){
    	if(error) {
    		console.log("Error from geocode: "+error);
    		var errMsg = errors.getMsg("NO_LOCATION").replace("{0}",place);
    		callback(undefined,errMsg);
    	} else {
			var result = foursquare.getCategoryIds(food);

			if(result.length === 0) {
				console.log("cannot find any category for ("+food+"), using venue name instead");

				foursquare.getVenuesByName(food,place,code,function(venues){
					sendBackVenues(venues,food,callback);
				});

			} else {
		    	var category_ids = result.join(",");
			    foursquare.getVenuesByCategories(category_ids,place,code,function(venues){
			    	sendBackVenues(venues,food,callback);
				});
			}
			
		}
    }); 
}

function sendBackVenues(venues,food,callback){
	if(venues) {
		var top5venues = venues.slice(0,5);
		callback(top5venues,undefined);
	} else {
		var errMsg = errors.getMsg("NO_FOOD").replace("{0}",food);
		callback(undefined,errMsg);
	}
}
