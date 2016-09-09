// Server role details updated (name, permissions, etc.)
module.exports = (bot, db, winston, svr, oldrole, newrole) => {
	db.servers.findOne({_id: svr.id}, (err, serverDocument) => {
		if(!err && serverDocument) {
			// Auto-add admin role if necessary
			if(serverDocument.config.auto_add_admins && !oldrole.hasPermission("MANAGE_GUILD") && newrole.hasPermission("MANAGE_GUILD") && !serverDocument.config.admins.id(newrole.id)) {
				serverDocument.config.admins.push({
					_id: newrole.id,
					level: 3
				});

				// Save changes to serverDocument
				serverDocument.save(err => {
					winston.error("Failed to save server data for auto-adding admin role", {svrid: svr.id}, err);
				});
			}
		} else {
			winston.error("Failed to find server data for serverRoleUpdated", {svrid: svr.id}, err);
		}
	});
};