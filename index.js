var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

var token = "<FACEBOOK_PAGE_TOKEN>";

var orchestrate = require('./orchestrate');

app.set('port', (process.env.PORT || 8886));

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());

// index
app.get('/', function (req, res) {
	res.send('hello world i am a secret bot');
})

// for facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
		res.send(req.query['hub.challenge']);
	}
	res.send('Error, wrong token');
})

// to post data
app.post('/webhook/', function (req, res) {
	messaging_events = req.body.entry[0].messaging;

	for (i = 0; i < messaging_events.length; i++) {
		event = req.body.entry[0].messaging[i];
		sender = event.sender.id;

		if (event.message && event.message.text) {
			text = event.message.text;

			orchestrate.process_input_query(text,function(venues,error){
				if(error) {
					sendTextMessage(sender, error);
				} else {
					sendGenericMessage(sender,venues);
				}
			});
		}
	}
	res.sendStatus(200)
})


function sendTextMessage(sender, text) {
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

function sendGenericMessage(sender,venues) {

	messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": []
			}
		}
	};

	venues.forEach(function(venue){
		var ele = {};
		ele["title"] = venue.name;
		var contact = venue.location.address;
		if(venue.contact.phone){
			if(contact) {
				contact = contact + ","+ venue.contact.phone;
			} else {
				contact = venue.contact.phone;
			}
		}
		ele["subtitle"] = contact;

		var buttons = [{
						"type": "web_url",
						"url": "https://maps.google.com/?q="+venue.location.lat+","+venue.location.lng,
						"title": "Map"
					}];

		if(venue.url) {
			buttons.push({
						"type": "web_url",
						"url": venue.url,
						"title": "Web Url"
					});
		}

		if(venue.location)

		ele["buttons"] = buttons;
		messageData.attachment.payload.elements.push(ele);
	});

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

// spin spin sugar
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})
