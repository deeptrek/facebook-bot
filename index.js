var express = require('express');
var bodyParser = require('body-parser');
var res_msg = require('./controller/respond_msg');
var orchestrate = require('./controller/orchestrate');

var app = express();
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
			orchestrate.processInput(text,function(venues,error){
				if(error) {
					res_msg.sendTextMessage(sender,error);
				} else {
					res_msg.sendQueryMessage(sender,venues,text,0,"1");
				}
			});		
		}

		if (event.postback) {
			res_msg.sendPostbackMessage(sender,event.postback.payload);
			continue;
		}	
	}
	res.sendStatus(200)
})

// spin spin sugar
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})
