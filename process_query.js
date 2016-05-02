var fs = require('fs');
var natural = require('natural');

var cached_all_places = [];
var cached_all_food = [];

cached_items(cached_all_places,"./resources/sg_address.txt")
cached_items(cached_all_food,"./resources/sg_foods.txt")
cached_items(cached_all_food,"./resources/common_foods.txt")

function cached_items(cached_list,file_path){
	var array = fs.readFileSync(file_path).toString().split("\n");
	for(i in array) {
		var word = array[i].trim();
		if(word.length>0 && cached_list.indexOf(word) === -1) {
	    	cached_list.push(array[i].toLowerCase());
		}
	}	
}

exports.process_input_query = function (input_str,callback) {
	input_str = input_str.toLowerCase().trim();
	console.log("Starting process_input_query: "+input_str);
	match_place_food_list(input_str,function(init_result){
		if(init_result.food && init_result.place) {
			callback(init_result);
		} else {
			nltk_process_python(init_result,input_str,callback);
		}
	});
}

function match_place_food_list(input_str,next){
	var result = {};

	var longestMatch = -1;
	var value = undefined;
	cached_all_food.forEach(function(item){
		if(input_str.indexOf(item)>longestMatch) {
			longestMatch = item.length;
			value = item;
		}
	});

	if(value) {
		result["food"] = value;
	}

	longestMatch = -1;
	value = undefined;
	cached_all_places.forEach(function(item){
		if(input_str.indexOf(item)>longestMatch) {
			longestMatch = item.length;
			value = item;
		}
	});	

	if(value) {
		result["place"] = value;
	}

	console.log("Initial result: food - "+result.food+", place - "+result.place);

	next(result);
}

function nltk_process_python(init_result,input_str,callback){
	var python = require('child_process').spawn(
	     'python',
	     ["./pos_tagging.py", input_str]
	);
	python.stdout.on('data', function(data){ 
		console.log("python output is: "+data);
		if(data && data.length>0) {
			var result = process_python_output(init_result,input_str,data.toString('utf-8'));

			console.log(result);

			callback(result);
		} else {
			callback(undefined);
		}
	});
	python.on('close', function(code){ 
		console.log("python process code is: "+code);
	});
}

function process_python_output (init_result,input_str,input_str1) {

	var input_str2 = input_str1.replace(/[()]/g, '').replace(/[\[\] ']+/g, '');
	var list = input_str2.split(",");

	var adj_list = [];
	var noun_list = [];
	var candidate_words = [];

	for(var i=0;i<list.length;i=i+2){
		var tag = list[i+1].trim();
		var value = list[i].trim();
		if(tag === "JJ" || tag === "JJR" || tag == "JJS"){
			adj_list.push(value);
		}
		if(tag === "NN" || tag === "NNS" || tag === "NNP" || tag === "NNPS") {
			noun_list.push(value);
		}
	}

	candidate_words = candidate_words.concat(adj_list).concat(noun_list);
	adj_list.forEach(function(adj){
		noun_list.forEach(function(noun){
			var str = adj+" "+noun;
			if(input_str.indexOf(str) > -1)
				candidate_words.push(str);
		});
	});
	noun_list.forEach(function(noun){
		noun_list.forEach(function(noun1){
			var str = noun+" "+noun1;			
			if(input_str.indexOf(str) > -1)
				candidate_words.push(str);
		});
	});	
	console.log("candidate_words: "+candidate_words);	
	
	if(!init_result.food){
		var food = getClosestMatch(candidate_words,cached_all_food,0.9);
		if(!food) {
			food = candidate_words[0];
		}
		init_result["food"] = food;
	}

	if(!init_result.place){
		var place = getClosestMatch(candidate_words,cached_all_places,0.9);
		if(!place) {
			place = "Singapore";
		} else {
			place = place+",Singapore";
		}
		init_result["place"] = place;
	}

	return init_result;
}


function getClosestMatch(words, list, threshold){
	var matchness = 0;
	var candidate = undefined;
	var result = undefined;

	words.forEach(function(word){
		list.forEach(function(word1){
			var distance = natural.JaroWinklerDistance(word,word1);	
			if(distance>matchness) {
				matchness = distance;
				candidate = word;
				result = word1;
			}
		});		
	});

	console.log("candidate ("+candidate+") match with ("+result+") with matchness: "+matchness);

	if(matchness>threshold) {
		return result;
	}
}

