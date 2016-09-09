const getNewServerData = require("./../Modules/NewServer.js");

// Join new server
module.exports = (bot, db, winston, svr) => {
	db.servers.findOne({_id: svr.id}, (err, serverDocument) => {
		if(err || !serverDocument) {
			winston.info("Joined server '" + svr.name + "'", {svrid: svr.id});
			db.servers.create(getNewServerData(bot, svr, new db.servers({_id: svr.id})), err => {
				if(err) {
					winston.error("Failed to insert server data", {svrid: svr.id});
				}
			});
		}
	});
};