const Cache = require("./Cache.js");
const User = require("./User.js");

// Role object for extensions
module.exports = class Role {
	constructor(bot, db, svr, serverDocument, role, isTesting, testingLog) {
		this.name = role.name;
        this.id = role.id;
        this.created = role.creationDate;
        this.mention = role.toString();
        this.position = role.position;
        this.hoist = role.hoist;
        this.managed = role.managed;
        this.permissions = role.serialize();
        this.hasPermission = role.hasPermission;
        this.color = role.color;
        this.hexColor = role.hexColor;
        this.getUsers = callback => {
            var users = new Cache();
            svr.members.forEach(member => {
                if(member.roles.exists("id", role.id)) {
                    users.push(new User(bot, db, member, svr, serverDocument, isTesting, testingLog));
                }
            });
            return users;
        };
        this.setName = (name, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Set name of role " + role.name + " to \"" + name + "\"");
            }
            var that = this;
            role.setName(name).then((newRole, err) => {
                if(!err) {
                    that.name = newRole.name;
                }
                if(typeof(callback)=="function") {
                    callback(err);
                }
            });
        };
        this.setPosition = (position, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Set position of role " + role.name + " to " + position);
            }
            var that = this;
            role.setPosition(position).then((newRole, err) => {
                if(!err) {
                    that.position = newRole.position;
                }
                if(typeof(callback)=="function") {
                    callback(err);
                }
            });
        };
        this.setHoist = (hoist, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Set hoist of role " + role.name + " to " + hoist);
            }
            var that = this;
            role.setHoist(hoist).then((newRole, err) => {
                if(!err) {
                    that.hoist = newRole.hoist;
                }
                if(typeof(callback)=="function") {
                    callback(err);
                }
            });
        };
        this.setPermissions = (permissions, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Set permissions of role " + role.name + " to " + JSON.stringify(permissions));
            }
            var that = this;
            role.setPermissions(permissions).then((newRole, err) => {
                if(!err) {
                    that.permissions = newRole.serialize();
                    that.hasPermission = newRole.hasPermission;
                }
                if(typeof(callback)=="function") {
                    callback(err);
                }
            });
        };
        this.setColor = (color, callback) => {
            if(isTesting) {
                testingLog.push("INFO: Set color of role " + role.name + " to " + color);
            }
            var that = this;
            role.setColor(color).then((newRole, err) => {
                if(!err) {
                    that.color = newRole.color;
                    that.hexColor = newRole.hexColor;
                }
                if(typeof(callback)=="function") {
                    callback(err);
                }
            });
        };
        this.delete = callback => {
            if(isTesting) {
                testingLog.push("INFO: Deleted role " + role.name);
            }
            role.delete().then(callback);
        };
	}
}