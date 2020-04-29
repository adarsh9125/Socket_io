var socket = io(); // TIP: io() with no args does auto-discovery
console.log(socket);
  socket.on('connect', function () { // TIP: you can avoid listening on `connect` and listen on events directly too!
    socket.emit('connect device', { mid:'22845',connect:'43345' }, function (data) {
      alert(data); // data will be 'woot'
    });
  });