var errors = require('../util/errors');
var query_processer = require('../util/process_query');
var geocode = require('../thirdparty/geocode');
var foursquare = require('../thirdparty/foursquare');
var hungrygowhere = require('../thirdparty/hungrygowhere');

function processInput(input_str,callback) {	
	foursquare.getAllCategories(function(){
		query_processer.process_input_query(input_str,function(result){
			if(result) {
				processLocationFood(result.place,result.food,callback);	
			} else {
				callback(undefined,errors.getMsg("INPUT_PARSE_ERROR"));
			}
		});		
	});
}

function getVenueById(venue_id,callback){
	foursquare.getVenueById(venue_id,callback);
}

function getVenueDetailsByHGW(name,location,callback){
	hungrygowhere.get_ratings_price(name,location,callback);
}

function processLocationFood(place,food,callback) {
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
		callback(venues,undefined);
	} else {
		var errMsg = errors.getMsg("NO_FOOD").replace("{0}",food);
		callback(undefined,errMsg);
	}
}

module.exports = {
	processInput: processInput,
	getVenueById: getVenueById,
	getVenueDetailsByHGW: getVenueDetailsByHGW
};
