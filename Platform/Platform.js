const config = require("./../Configuration/config.json");

module.exports = db => {
	// Get bot client from appropriate platform library
	return require("./" + config.platform.charAt(0).toUpperCase() + config.platform.slice(1) + ".js")(db);
};