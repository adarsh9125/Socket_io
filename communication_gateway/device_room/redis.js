// var redis = require("redis");
// var client = redis.createClient({
//     detect_buffers: true,
// });

// client.set("foo_rand000000000000", "{'status':'OK'}");

// // This will return a JavaScript String
// client.get("foo_rand000000000000", function (err, reply) {
//     console.log(reply); // Will print `OK`
// });

// // This will return a Buffer since original key is specified as a Buffer
// client.get(new Buffer("foo_rand000000000000"), function (err, reply) {
//     console.log(reply); // Will print `<Buffer 4f 4b>`
// });
// client.quit();
function name() {
    console.log("start1");
    fullName().then(function (data) {
        console.log("start4");
    });
    console.log("start3");
}

function fullName() {
    return new Promise(function (resolve, reject) {
        console.log("start2");
        resolve(true);
    });
}

name();