// Cache to replace arrays in extensions
module.exports = class Cache extends Array {
	constructor() {
		super();
	}

	exists(key, value)  {
		return this.find(key, value)!=null;
	}

	find(key, value)  {
		if(typeof key=="function") {
			var isValid = key;
			key = null;
		} else if(key && !value) {
			return this.map(a => {
				return a[key]
			});
		} else if(value && value.constructor.name=="RegExp") {
			var isValid = a => {
				return value.test(a);
			};
		} else if(typeof value!="function") {
			var isValid = a => {
				return a==value;
			};
		}

		for(var item of this) {
			if(isValid(key==null ? item : item[key])) {
				return item;
			}
		}

		return null;	
	}

	findAll(key, value) {
		var found = new constructor();

		if(typeof key=="function") {
			var isValid = key;
			key = null;
		} else if(value && value.constructor.name=="RegExp") {
			var isValid = a => {
				return value.test(a);
			};
		} else if (typeof value !== 'function') {
			var isValid = a => {
				return a==value;
			};
		}

		for(var item of this) {
			if(isValid(key==null ? item : item[key])) {
				found.push(item);
			}
		}

		return found;
	}

	random() {
		return this[Math.floor(Math.random()*this.length)];
	}
};