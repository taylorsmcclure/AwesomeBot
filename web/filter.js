onmessage = function(e) {
    console.log("starting now...");
    var filtered = e.data[0].filter(function(obj) {
        return e.data[1].indexOf(obj[1])==-1;
    });
    console.log("done!");
    postMessage(filtered);
}