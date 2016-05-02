var errors = {
	"NO_LOCATION": "Oops.. Location {0} not found",
	"NO_FOOD": "Oops.. Food {0} not found",
	"NO_RESULT": "Oops.. Nothing matched {0}",
	"INTERANL_ERROR": "Oops.. Sth wrong",
	"INPUT_PARSE_ERROR": "Sorry, I don't understand your question. Pls try again"
};

function getMsg(key) {
	return errors[key];
}

exports.getMsg = getMsg;