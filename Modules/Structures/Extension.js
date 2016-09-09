// Object for extension metadata
module.exports = class Extension {
	constructor(winston, extensionDocument, svr, serverDocument, isTesting, testingLog) {
		const extension = extensionDocument.toObject();
		for(var prop in extension) {
			this[prop] = extension[prop];
		}

		this.writeStore = (key, value, callback) => {
	        if(isTesting) {
	            testingLog.push("INFO: Saved {\"" + key + "\": " + value + "} to extensionDocument storage");
	        }
            extensionDocument.store[key] = value;
            this.store = extensionDocument.store;
            serverDocument.save(err => {
            	if(err) {
            		winston.error("Failed to save server data for extension '" + extensionDocument._id + "'", {svrid: svr.id}, err);
            	}
            	callback(err, extensionDocument.store);
            });
	    };

	    this.deleteStore = (key, callback) => {
	        if(isTesting) {
	            testingLog.push("INFO: Deleted key \"" + key + "\" from extensionDocument storage");
	            var tmpstore = JSON.parse(JSON.stringify(extensionDocument.store));
	            delete tmpstore[key];
	            this.store = tmpstore;
	            callback(null, tmpstore);
	        }
            delete extensionDocument.store[key];
            this.store = extensionDocument.store;
            serverDocument.save(err => {
        		if(err) {
        			winston.error("Failed to save server data for extension '" + extensionDocument._id + "'", {svrid: svr.id}, err);
            	}
            	callback(err, extensionDocument.store);
            });
	    };
	}
}