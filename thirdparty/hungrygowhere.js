var request = require("request");
var cheerio = require('cheerio');

var base_url = "http://www.hungrygowhere.com";
var search_url = base_url+"/search-results/<NAME>/?search_location=<LOCATION>&tab=1";

var cached_result = {};

function get_ratings_price(name,location,callback){

	var key = name+"-"+location;

	if(cached_result[key]){
		callback(cached_result[key]);
	} else {
		var name1 = name.split(" ").join("+");
		var location1 = location.split(" ").join("+");

		var targetUrl = search_url
			.replace("<NAME>", name1)
			.replace("<LOCATION>", location1);	
		console.log("targetUrl: "+targetUrl);

		request({
			uri: targetUrl,
		}, function(error, response, body) {
			if(!error) {
				var $ = cheerio.load(body);	
				var obj = $('.rs-regular-sm')[1];
				var detail_url = base_url+obj.children[0].attribs['href'];
				
				console.log("detail_url: "+detail_url);

				request({
					uri: detail_url,
				}, function(error, response, body) {

					var result = {};
					var $ = cheerio.load(body);

					$("div.entry div.inner").each(function(){
						var data = $(this);
						var text = data.text();
						if(text.indexOf("$") === 0) {
							result["price"] = "Avg. Price: "+text.split(" ")[0];
						}
					});	

					$("div.overall-item span.star-s").each(function(){
						var data = $(this);
						var star_text = data.children().first().attr('class');
						var stars = star_text.substring(4);
						result["overallRating"] = "Overall Rating: "+stars;
					});	

					var other_ratings = [];
					$("div.overall-item").each(function(){
						var data = $(this);
						var label = data.find(".label").text();
						var rating = data.find(".number").text();
						if(label) {
							other_ratings.push(label+" - "+rating);
						}
					});	
					result["otherRatings"] = other_ratings;	
					cached_result[key] = result;
					callback(result);	
				});	
			}
		});
	}
}

module.exports = {
	get_ratings_price: get_ratings_price
};