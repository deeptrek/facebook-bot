var Client = require('node-rest-client').Client;
var client = new Client();

var cliend_id = "<FOURSQUARE_CLIENT_ID>";
var client_secret = "<FOURSQUARE_CLIENT_SECRET>";

var url_by_category = "https://api.foursquare.com/v2/venues/search?categoryId=<CATEGORY_ID>&client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>&v=20140806&ll=<LOCATION>&intent=browse&radius=<RADIUS>";

var url_by_name = "https://api.foursquare.com/v2/venues/search?client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>&v=20140806&ll=<LOCATION>&intent=browse&radius=<RADIUS>&query=<QUERY>";

var all_categories_url = "https://api.foursquare.com/v2/venues/categories?client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>&v=20140806";

var cached_venues = {};

var cached_all_categories = []; 

var cached_queries = []; 

exports.getVenuesByCategories = function (category_id,place,location,callback) {
	var targetUrl = url_by_category.replace("<CATEGORY_ID>", category_id);
	getVenues(targetUrl,category_id,place,location,callback);
}

exports.getVenuesByName = function (name,place,location,callback) {
	var targetUrl = url_by_name.replace("<QUERY>", name);
	getVenues(targetUrl,name,place,location,callback);
}

function getVenues(url,query,place,location,callback) {

	var radius = 2000;
	if(place === 'Singapore') {
		radius = 10000;
	}
	var targetUrl = url
		.replace("<RADIUS>", radius)
		.replace("<LOCATION>", location)
		.replace("<CLIENT_ID>", cliend_id)
		.replace("<CLIENT_SECRET>", client_secret);

	console.log("targetUrl is: "+targetUrl);

	var key = query+"-"+location;
	if(cached_venues[key]) {
		console.log("get result for key: "+key);
		callback(cached_venues[key]);
	} else {
		client.get(targetUrl, function (data, response) {	

			venues = data.response.venues;

			if(venues && venues.length > 0){

				venues.sort(function(a,b){
					return a.location.distance - b.location.distance;
				});

				cached_venues[key] = venues;
				callback(venues);
			} else {
				callback(undefined);
			}
		});
	}
}


exports.getAllCategories = function(callback){
	var size = cached_all_categories.length;
	console.log("Start geting all categories: "+size);
	if(size === 0) {
		all_categories_url = all_categories_url.replace("<CLIENT_ID>", cliend_id)
			.replace("<CLIENT_SECRET>", client_secret);

		console.log("all_categories_url is: "+all_categories_url);

		client.get(all_categories_url, function (data, response) {	
			cached_all_categories = data.response.categories;
			console.log("Done geting all categories: "+cached_all_categories.length);
			callback();
		});	
	} else {
		console.log("All categories already cached");
		callback();
	}
}

exports.getCategoryIds = function(query){

	if(cached_all_categories.length === 0) {
		return [];
	}

	if(cached_queries[query]) {
		return cached_queries[query];
	} else {
		var matched_map = [];
		var result = [];

		getCategoryIdsInternal(cached_all_categories,query,matched_map,0);

		if(matched_map.length > 0) {

			matched_map.sort(function(a,b){
				return b.level - a.level;
			});			

			var target_level = matched_map[0].level;

			matched_map.forEach(function(ele){
				if(ele.level === target_level) {
					console.log("Got category ("+ele.category.name+") with id (" +ele.category.id+")");
					result.push(ele.category.id);
				}
			});
			
			cached_queries[query] = result;
		} 

		return result;
	}
}

function getCategoryIdsInternal(categories,query,matched_map,level){
	categories.forEach(function(category){
		var name = category.name.toLowerCase();	
		if(name.indexOf(query) > -1) {
			matched_map.push({"category": category,"level": level});
		}
		//console.log(category.categories.length);
		if(category.categories.length>0) {
			getCategoryIdsInternal(category.categories,query,matched_map,level+1);
		}
	});
}

