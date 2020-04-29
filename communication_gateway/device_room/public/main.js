var socket = io(); // TIP: io() with no args does auto-discovery
//console.log(socket);
socket.on("connect", function () {
  // TIP: you can avoid listening on `connect` and listen on events directly too!
  socket.emit("connect device", { mid: "24345", connect: "93845" }, function (
    data
  ) {
    console.log(data); // data will be 'woot'
  });
});
socket.on("device-reached", function (data) {
  console.log(data);
});

document.getElementById('optin').addEventListener('click', function (e) {
  socket.emit("optin", { mid:"24345", connect: "93845", data: 'my data' }, function (data) {
    console.log(data);
  });
})