var request = require('request');
var foursquare = require('./foursquare');
var errors = require('./errors');

var token = "<FACEBOOK_PAGE_TOKEN>";

exports.sendTextMessage = function (sender, text) {
	sendTextMsgInternal(sender.txt);
}

exports.sendQueryMessage = function (sender,venues) {

	var elements = [];
	venues.sort(function(a,b){
		return b.stats.checkinsCount - a.stats.checkinsCount;
	});

	var top5venues = venues.slice(0,5);
	top5venues.forEach(function(venue){
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
			},
			{
				"type": "postback",
				"title": "Popularity: "+venue.stats.checkinsCount,
				"payload": "VENUE_STAT,"+venue.id
			},			
            {
            	"type": "postback",
            	"title": "More Info",
            	"payload": "VENUE_NFO,"+venue.id
          	}
		];
		ele["buttons"] = buttons;
		elements.push(ele);
	});
	
	
	var last_element;
	if(venues.length>1) {
		last_element = {};
		last_element["title"] = "More Options";
		last_element["buttons"]=[
			{
            	"type": "postback",
            	"title": "Sort By Distance",
            	"payload": "SORT_DISTANCE"
        	}
        ];
	}

	
	if(venues.length>5) {
		last_element.buttons.push({
            	"type": "postback",
            	"title": "More Result",
            	"payload": "MORE_RESULT"
        });		
	}
	
	if(last_element) {
		elements.push(last_element);	
	}	

	sendTemplateMessage(sender,elements);
}

exports.sendPostbackMessage = function (sender, text) {

	var info = text.split(",");
	var command = info[0];
	var venue_id = info[1];

	if(command.startsWith("VENUE_")) {
		foursquare.getVenueById(venue_id,function(venue){

			if(venue) {
				messageData = {
					"attachment": {
						"type": "template",
						"payload": {
							"template_type": "generic",
							"elements": []
						}
					}
				};
				var ele = {};
				ele["title"] = venue.name;		
				//ele["subtitle"] = contact;

				var buttons = [
					{
						"type": "web_url",
						"url": venue.canonicalUrl,
						"title": "Web Url"
					}
				];

				ele["buttons"] = buttons;
				
				sendTemplateMessage(sender,[ele]);

			} else {
				sendTextMsgInternal(sender,errors.getMsg("INTERANL_ERROR"));
			}
		});
	} else {
		sendTextMsgInternal(sender,"TO BE IMPLEMENTED");
	}
}

function sendTextMsgInternal(sender, text){
	messageData = {
		text:text
	}
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

function sendTemplateMessage(sender, elements){

	messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": []
			}
		}
	};

	messageData.attachment.payload.elements = elements;

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