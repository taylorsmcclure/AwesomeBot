// Generates a random alphanumeric string of given length
module.exports = length => {
    var key = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i=0; i<length; i++) {
        key += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return key;
};