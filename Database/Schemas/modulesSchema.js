const mongoose = require("mongoose");

// Schema for commands, keywords, and timers (third-party and gallery)
module.exports = new mongoose.Schema({
	_id: {type: String, minlength: 3, maxlength: 100, required: true},
	level: {type: String, enum: ["third", "gallery"], required: true},
	type: {type: String, enum: ["command", "keyword", "timer"]},
	key: {type: String, minlength: 3, maxlength: 25},
	keywords: [String],
	isAdminOnly: {type: Boolean, default: false},
	interval: {type: Number, min: 300000, max: 86400000},
	enabled_channel_ids: [String],
	usage_help: {type: String, maxlength: 150},
	extended_help: {type: String, maxlength: 1000},
	last_run: Date,
	store: mongoose.Schema.Types.Mixed,
	gallery_listing: {
		name: {type: String, minlength: 3, maxlength: 100, required: true},
		description: {type: String, maxlength: 2000, required: true}
	}
});