var fs = require('fs');

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

exports.process_input_query = function (input_str,callback) {

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
				result["food"] = ["food"];
			} 

			if(!result["location"]) {
				result["location"] = ["Singapore"];
			} 

			//process_location_food(result["location"][0],result["food"][0],callback);
			callback({
				"location": result["location"][0],
				"food": result["food"][0]
			});
		} else {
			callback(undefined);
		}
	});

	python.on('close', function(code){ 
		console.log("python process code is: "+code);
	});

}

function process_python_output (input_str) {
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