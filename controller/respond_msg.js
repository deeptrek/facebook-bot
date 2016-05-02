var request = require('request');
var orchestrate = require('../controller/orchestrate');
var errors = require('../util/errors');

var token = "<FACEBOOK_PAGE_TOKEN>";

var pageSieze = 5;

function sendQueryMessage(sender,venues,text,page,sortType) {

	var elements = [];

	if(sortType === "1") {
		venues.sort(function(a,b){
			return b.stats.checkinsCount - a.stats.checkinsCount;
		});
	} else {
		venues.sort(function(a,b){
			return a.location.distance - b.location.distance;
		});		
	}

	var fromInd = page * pageSieze;
	var endInd = (page+1) * pageSieze;

	var targetVenues = venues.slice(fromInd,endInd);
	targetVenues.forEach(function(venue){
		var ele = {};
		ele["title"] = venue.name;
		var contact = undefined;
		venue.location.formattedAddress.forEach(function(str){
			if(contact) {
				contact = contact + "," + str;
			} else {
				contact = str;
			}
		});
		ele["subtitle"] = contact;
		var buttons = [
			{
				"type": "web_url",
				"url": "https://maps.google.com/?q="+venue.location.lat+","+venue.location.lng,
				"title": "Map"
			}
		];
		if(sortType === "1") {
			buttons.push({
				"type": "postback",
				"title": "Popularity: "+venue.stats.checkinsCount,
				"payload": "VENUE_COMMMENTS-@-"+venue.id+"-@-"+0				
			});
			
		} else {
			buttons.push({
				"type": "postback",
				"title": "Distance: "+venue.location.distance,
				"payload": "VENUE_DIST-@-"+venue.id				
			});
		}

		buttons.push({
        	"type": "postback",
        	"title": "More Info",
        	"payload": "VENUE_NFO-@-"+venue.id
		});

		ele["buttons"] = buttons;
		elements.push(ele);
	});
	
	var remainingVenues = venues.slice(endInd);

	var ele;
	var sortTitle;
	if(sortType === "1") {
		sortTitle = "Sort by Distance";
	} else {
		sortTitle = "Sort by Popularity";
	}
	if(remainingVenues.length>1) {
		ele = {};
		ele["title"] = "More Options";	
		ele["buttons"] = [];
		ele["buttons"].push({
            	"type": "postback",
            	"title": sortTitle,
            	"payload": "SORT_DISTANCE-@-"+sortType+"-@-"+text
        });
        elements.push(ele);
	}

	if(remainingVenues.length>pageSieze) {
		ele["buttons"].push({
            	"type": "postback",
            	"title": "More Result",
            	"payload": "MORE_RESULT-@-"+sortType+"-@-"+page+"-@-"+text
        });		
	}

	sendGenericMsgInternal(sender,elements);
}

function sendPostbackMessage(sender, text) {
	var info = text.split("-@-");

	console.log("Postback message: "+info);
	
	var command = info[0];
	
	if(command === "VENUE_NFO") {
		var venue_id = info[1];

		orchestrate.getVenueById(venue_id,function(venue){
			if(venue) {
				var buttons = [];

				if(venue.popular && venue.popular.timeframes) {
					var openHour = "";
					venue.popular.timeframes.forEach(function(tf){
						if(tf.days === "Today"){
							tf.open.forEach(function(slot){
								openHour = openHour + slot.renderedTime + " ";
							});
							openHour = openHour.trim();
						}						
					});						
					buttons.push({
				    	"type": "postback",
				        "title": openHour,
				        "payload": "MORE_OPEN_HOURS-@-"+venue.id
					});				
				}				

				orchestrate.getVenueDetailsByHGW(venue.name,"",function(result){
					console.log(result);

					if(result.price) {
						buttons.push({
					    	"type": "postback",
					        "title": result.price,
					        "payload": "VENUE_PRICE-@-"+result.price
						});	
					}					

					if(result.overallRating) {
						buttons.push({
					    	"type": "postback",
					        "title": result.overallRating,
					        "payload": "VENUE_RATING-@-"+result.otherRatings
						});	
					}

					var text = venue.name;
					if(venue.contact.phone){
						text = text+", "+venue.contact.phone;					
					}
					sendButtonMsgInternal(sender,text,buttons);
				});

			} else {
				sendTextMessage(sender,errors.getMsg("INTERANL_ERROR"));
			}
		});
	} else if(command === "VENUE_DIST") {

		var venue_id = info[1];
		orchestrate.getVenueById(venue_id,function(venue){
			var msg = "Address - "+venue.location.address+"; ";
			if(venue.location.crossStreet) {
				msg = msg + "Cross Street - "+venue.location.crossStreet
			}
			sendTextMessage(sender,msg);
		});	

	} else if(command === "VENUE_COMMMENTS") {
		var venue_id = info[1];

		orchestrate.getVenueById(venue_id,function(venue){

			if(venue.tips.groups && venue.tips.groups[0] && venue.tips.groups[0].items) {
				var all_comments = venue.tips.groups[0].items;
				var start_ind = info[2];
				var end_ind = parseInt(start_ind)+2;

				console.log("total_comment_length: "+all_comments.length+", start_ind: "+start_ind+", end_ind: "+end_ind);
				var buttons = [];
				for(var i=start_ind;i<end_ind && i<all_comments.length;i++){
					buttons.push({
						"type": "postback",
						"title": all_comments[i].text,
						"payload": "VENUE_COMMMENT_DETAIL-@-"+all_comments[i].text	
					});
				}
				if(end_ind < all_comments.length) {
					buttons.push({
						"type": "postback",
						"title": "More Comments",
						"payload": "VENUE_COMMMENTS-@-"+venue.id+"-@-"+end_ind			
					});
				}

				if(buttons.length>0) {							
					sendButtonMsgInternal(sender,venue.name+" Reviews",buttons);
				}
			} else {
				sendTextMessage(sender,"No Reviews");
			}
		});	

	} else if(command === "VENUE_COMMMENT_DETAIL" 
			|| command === "VENUE_PRICE"
			|| command === "VENUE_RATING") {

		var comment = info[1];
		sendTextMessage(sender,comment);

	} else if(command === "MORE_OPEN_HOURS") {

		var venue_id = info[1];
		orchestrate.getVenueById(venue_id,function(venue){
			if(venue.popular.timeframes) {
				var openHour = "Opening: ";
				venue.popular.timeframes.forEach(function(tf){
					openHour = openHour + tf.days + ": ";
					for(var i=0;i<tf.open.length;i++){
						if(i === tf.open.length-1) {
							openHour = openHour+tf.open[i].renderedTime+"; ";	
						} else {
							openHour = openHour+tf.open[i].renderedTime+", ";
						}
					}					
				});	
				sendTextMessage(sender,openHour);
			} else {
				sendTextMessage(sender,"No popular opening hours");	
			}
		});	


	} else if(command === "SORT_DISTANCE") {
		var sortType = info[1];
		var text = info[2];

		if(sortType==="1") {
			sortType = "2";
		} else {
			sortType = "1";
		}

		orchestrate.processInput(text,function(venues,error){
			if(error) {
				sendTextMessage(sender,error);
			} else {
				sendQueryMessage(sender,venues,text,0,sortType);
			}
		});			
	} else if(command === "MORE_RESULT") {
		var sortType = info[1];
		var page = parseInt(info[2]);
		var text = info[3];

		orchestrate.processInput(text,function(venues,error){
			if(error) {
				sendTextMessage(sender,error);
			} else {
				sendQueryMessage(sender,venues,text,page+1,sortType);
			}
		});		
	} else {
		sendTextMessage(sender,"TO BE IMPLEMENTED");
	}
}

function sendTextMessage(sender, text){
	messageData = {
		text:text
	}
	sendMsg(sender,messageData);
}

function sendGenericMsgInternal(sender, elements){
	messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": elements
			}
		}
	};
	sendMsg(sender,messageData);
}

function sendButtonMsgInternal(sender, text, buttons){
	messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "button",
				"text": text,
				"buttons": buttons
			}
		}
	};
	sendMsg(sender,messageData);
}


function sendMsg(sender, messageData){
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})	
}

module.exports = {
	sendTextMessage: sendTextMessage,
	sendQueryMessage: sendQueryMessage,
	sendPostbackMessage: sendPostbackMessage
};
