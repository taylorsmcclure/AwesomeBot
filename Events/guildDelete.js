// Leave server and delete data
module.exports = (bot, db, winston, svr) => {
	winston.info("Left server '" + svr.name + "'", {svrid: svr.id});
	db.servers.remove({_id: svr.id}, err => {
		if(err) {
			winston.error("Failed to remove server data", {svrid: svr.id}, err);
		}
	});
};