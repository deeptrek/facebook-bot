var fs = require('fs');
var geocode = require('./geocode');
var errors = require('./errors');

var foursquare = require('./foursquare');
foursquare.getAllCategories();

var cached_all_places = [];
var array = fs.readFileSync('./resources/sg_address.txt').toString().split("\n");
for(i in array) {
    cached_all_places.push(array[i].toLowerCase());
}

var cached_ignored_words = [];
array = fs.readFileSync('./resources/ignored_words.txt').toString().split("\n");
for(i in array) {
    cached_ignored_words.push(array[i].toLowerCase());
}

function process_input_query(input_str,callback) {

	console.log("Starting process_input_query: "+input_str);

	var python = require('child_process').spawn(
	     'python',
	     ["./pos_tagging.py", input_str]
	);

	python.stdout.on('data', function(data){ 
		console.log("python output is: "+data);
		if(data && data.length>0) {
			var result = process_python_output(data.toString('utf-8'));

			console.log(result);

			if(!result["food"]) {
				//callback(undefined,errors.getMsg("NO_FOOD"));
				result["food"] = ["food"];
			} 

			if(!result["location"]) {
				//callback(undefined,errors.getMsg("NO_LOCATION"));
				result["location"] = ["Singapore"];
			} 

			process_location_food(result["location"][0],result["food"][0],callback);
			 
		} else {
			callback(undefined,errors.getMsg("INPUT_PARSE_ERROR"));
		}
	});

	python.on('close', function(code){ 
		console.log("python process code is: "+code);
	});

}

function process_python_output(input_str) {
	var result = {};

	input_str = input_str.replace(/[()]/g, '').replace(/[\[\] ']+/g, '');
	var list = input_str.split(",");

	for(var i=0;i<list.length;i=i+2){
		var tag = list[i+1].trim();
		var value = list[i].toLowerCase();

		if( tag === "JJ" || tag === "JJR" || tag == "JJS" 
			|| tag === "NN" || tag === "NNS" || tag === "NNP" || tag === "NNPS") {
			
			if(cached_ignored_words.indexOf(value) === -1) {
				var type = "food";

				for(var j=0;j<cached_all_places.length;j++) {
					if(cached_all_places[j].indexOf(value) > -1) {
						type = "location";
						value = cached_all_places[j]+",Singapore";
					}
				}

				if(!result[type]) {
					result[type] = [];
				}
				
				if(result[type].indexOf(value) === -1) {
					result[type].push(value);	
				}
			}
		}
	}

	return result;
}

function process_location_food(place,food,callback) {
	console.log("Start process place ("+place+") for food: ("+food+")");

    geocode.getGeoCode(place,function(location,error){
    	if(error) {
    		console.log("Error from geocode: "+error);
    		var errMsg = errors.getMsg("NO_LOCATION").replace("{0}",place);
    		callback(undefined,errMsg);
    	} else {
			var result = foursquare.getCategoryIds(food);

			if(result.length === 0) {
				//cannot find any category, try search by venue name
				console.log("cannot find any category for: "+food+", using venue name instead");

				foursquare.getVenuesByName(food,place,location,function(venues){
					sendBackVenues(venues,food,callback);
				});

			} else {
		    	var category_ids = result.join(",");
			    foursquare.getVenuesByCategories(category_ids,place,location,function(venues){
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

exports.process_input_query = process_input_query;
