const mongoose = require("mongoose");

// Server's channel data (botOn, trivia, etc.)
module.exports = new mongoose.Schema({
	_id: {type: String, required: true},
	bot_enabled: {type: Boolean, default: true, required: true},
	isStatsEnabled: {type: Boolean, default: true, required: true},
	command_cooldown: {type: Number, default: 0, min: 0, max: 300000},
	isCommandCooldownOngoing: {type: Boolean, default: false},
	isMessageDeletedDisabled: {type: Boolean, default: false},
	spam_filter_data: [new mongoose.Schema({
		_id: {type: String, required: true},
		message_count: {type: Number, default: 0},
		last_message_content: String
	})],
	trivia: {
		isOngoing: {type: Boolean, default: false, required: true},
		set: {type: String, default: "default"},
		current_answer: String,
		past_questions: [String],
		question_attempts: {type: Number, default: 0, min: 0},
		score: {type: Number, default: 0, min: 0},
		max_score: {type: Number, default: 0, min: 0},
		responders: [new mongoose.Schema({
			_id: String,
			score: {type: Number, default: 0, min: 0}
		})]
	},
	poll: {
		isOngoing: {type: Boolean, default: false, required: true},
		created_timestamp: Date,
		creator_id: String,
		title: String,
		options: [String],
		responder_ids: [String],
		responses: [Number]
	},
	giveaway: {
		isOngoing: {type: Boolean, default: false, required: true},
		expiry_timestamp: Date,
		creator_id: String,
		title: String,
		secret: String,
		participant_ids: [String]
	},
	lottery: {
		isOngoing: {type: Boolean, default: false, required: true},
		creator_id: String,
		participant_ids: [String]
	}
});
