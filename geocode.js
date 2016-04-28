var geocoderProvider = 'google';
var httpAdapter = 'https';
var api_key = '<GOOGLE_API_KEY>'; 
var extra = {
    apiKey: api_key,
    formatter: null
};

var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);

var cached = {};

exports.getGeoCode = function (address_name, callback) {

	if(cached[address_name]) {
		console.log("Found result for address: "+address_name);
		callback(cached[address_name]);
	} else {
		geocoder.geocode(address_name)
		    .then(function(data) {

		        if(data.length > 0 ) {
					result = data[0].latitude+","+data[0].longitude;
					cached[address_name] = result;
					callback(result,undefined);
		        }
		    })
		    .catch(function(err) {
		        console.log(err);
		        callback(undefined,err);
		    });
	}
} 


