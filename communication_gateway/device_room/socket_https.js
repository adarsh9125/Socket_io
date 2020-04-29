//how many ms without a pong packet to consider the connection closed
var options = {
  pingTimeout: 1000,
  pingInterval: 5000
};

var express = require("express");
var app = express();
const bodyParser = require("body-parser");
var path = require("path");
var _ = require("underscore");
var cron = require("node-cron");
var mysql = require("mysql");
var server = require("http").createServer(app);
var io = require("../..")(server, options);
var axios = require("axios");
const client_io = require("socket.io-client");
var port = process.env.PORT || 4000;
var connections = new Array();
var connectionsSocket = new Array();
const API_BASE_URL = "http://staging.dashboard.taplocalmarketing.com:3000/staging/";
server.listen(port, () => {
  console.log("Server listening at port %d", port);
});

// Routing
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(
  express.static("static")
);
var user_name = "Username";
app.use(express.static(path.join(__dirname, "public")));
var usernames = {};
var devicetypes = {};
var rooms = [];

io.sockets.on('connection', function (socket) {

  socket.on('CONNECT_REQUEST', function (devicedata) {
    var client_ip_address = socket.request.connection.remoteAddress.split(':').slice(-1)[0];
    console.log("client_ip_address websoket===", client_ip_address);
    console.log("obj==============", typeof devicedata);
    var obj = JSON.parse(devicedata);
    console.log("obj2==============", obj);
    var api_url = API_BASE_URL + "merchants/devicepin";
    console.log("api_url" + api_url);
    console.log("pin" + obj.pin);

    axios.post(api_url, {
        "pin": obj.pin
      })
      .then(function (response) {
        console.log("pin exist=", response.data.data);
        if (obj.is_pin == true && obj.device_type == "customer") {
          if (obj && response.data.data.status == true && response.data.data.client_ip == client_ip_address) {
            console.log("room_name=", obj);
            var username = obj.device_id;
            var req_devicetype = obj.pin;
            var room_name = response.data.data.unique_id;
            socket.username = username;
            socket.room = room_name;
            socket.req_devicetype = req_devicetype;
            usernames[username] = username;

            var number_room_member;
            if (io.sockets.adapter.rooms[socket.room] == undefined) {
              number_room_member = 0;
            } else {
              console.log(io.sockets.adapter.rooms[socket.room]);
              number_room_member = io.sockets.adapter.rooms[socket.room].length;
            }
            console.log("number_room_member=", number_room_member);
            console.log("devicetypes=====", devicetypes);
            if (number_room_member < 2 || obj.reconnect == true) {
              /*
                Connecting merchant device and create room on basis of PIN.
              */
              console.log("room_name=" + room_name);
              var room_alredy_exist = _.contains(rooms, room_name);
              if (!room_alredy_exist) {
                rooms.push(room_name);
              }
              socket.join(room_name);
              devicetypes[req_devicetype] = obj;
              socket.emit('updatechat', 'SERVER', 'you have connected to ' + room_name);
              socket.broadcast.to(room_name).emit('updatechat', 'SERVER', username + ' has connected to this room');
              socket.emit('updaterooms', rooms, room_name);
              socket.broadcast.to(room_name).emit('you have connected to ' + room_name);
              socket.broadcast.to(room_name).emit('SERVER', 'you have connected to ' + room_name);
              io.to(socket.id).emit('CONNECT_RESPONSE', 'Success', 'you have connected to ' + room_name, room_name);
              var no_of_device_connected = io.sockets.adapter.rooms[socket.room].length;
              socket.to(socket.room).emit('OTHER_DEVICE_CONNECTION_CHANGED', true);
              console.log('OTHER_DEVICE_CONNECTION_CHANGED', true);
              if (no_of_device_connected == 2) {
                io.sockets["in"](socket.room).emit("GUID_RESPONSE", room_name);
              }
            } else {
              /*
                Already two device connected in this room.
              */
              io.to(socket.id).emit('CONNECT_RESPONSE', 'Rejected', 'Alredy two device connected');
            }
          } else {
            console.log("Please provide us valid pin 106");
            io.to(socket.id).emit('CONNECT_RESPONSE', 'Rejected', 'Please provide a valid pin.');
          }
        } else {
          if (obj && response.data.data.status == true) {
            console.log("room_name=", obj);
            var username = obj.device_id;
            var req_devicetype = obj.pin;
            var room_name = response.data.data.unique_id;
            socket.username = username;
            socket.room = room_name;
            socket.req_devicetype = req_devicetype;
            usernames[username] = username;

            var number_room_member;
            if (io.sockets.adapter.rooms[socket.room] == undefined) {
              number_room_member = 0;
            } else {
              console.log(io.sockets.adapter.rooms[socket.room]);
              number_room_member = io.sockets.adapter.rooms[socket.room].length;
            }
            console.log("number_room_member=", number_room_member);
            console.log("devicetypes=====", devicetypes);
            if (number_room_member < 2 || obj.reconnect == true) {
              /*
                Connecting merchant device and create room on basis of PIN.
              */
              console.log("room_name=" + room_name);
              var room_alredy_exist = _.contains(rooms, room_name);
              if (!room_alredy_exist) {
                rooms.push(room_name);
              }
              socket.join(room_name);
              devicetypes[req_devicetype] = obj;
              socket.emit('updatechat', 'SERVER', 'you have connected to ' + room_name);
              socket.broadcast.to(room_name).emit('updatechat', 'SERVER', username + ' has connected to this room');
              socket.emit('updaterooms', rooms, room_name);
              socket.broadcast.to(room_name).emit('you have connected to ' + room_name);
              socket.broadcast.to(room_name).emit('SERVER', 'you have connected to ' + room_name);
              io.to(socket.id).emit('CONNECT_RESPONSE', 'Success', 'you have connected to ' + room_name, room_name);
              var no_of_device_connected = io.sockets.adapter.rooms[socket.room].length;
              if (obj.device_type == "customer" && obj.is_pin == false) {
                socket.to(socket.room).emit('OTHER_DEVICE_CONNECTION_CHANGED', true);
                console.log('OTHER_DEVICE_CONNECTION_CHANGED room_name' + "===" + room_name);
              }
              if (no_of_device_connected == 2) {
                io.sockets["in"](socket.room).emit("GUID_RESPONSE", room_name);
              }
            } else {
              /*
                Already two device connected in this room.
              */
              io.to(socket.id).emit('CONNECT_RESPONSE', 'Rejected', 'Alredy two device connected');
            }
          } else {
            console.log("Please provide us valid pin 161");
            io.to(socket.id).emit('CONNECT_RESPONSE', 'Rejected', 'Please provide a valid pin.');
          }
        }
      })
      .catch(function (error) {
        /*
            Already two device connected in this room.
          */
        console.log("Somthing went wrong in catch block.", error);
        io.to(socket.id).emit('CONNECT_RESPONSE', 'Rejected', 'Somthing went wrong.', error);
      });

  });

  socket.on('create', function (room) {
    var room_alredy_exist = _.contains(rooms, room);
    if (!room_alredy_exist) {
      rooms.push(room);
    }
    socket.emit('updaterooms', rooms, socket.room);
  });

  socket.on('CHAT_MESSAGE', function (data) {
    var number_room_member = io.sockets.adapter.rooms[socket.room];
    if (number_room_member.length == 2) {
      io.sockets["in"](socket.room).emit('updatechat', socket.username, data);
    } else if (number_room_member.length > 2) {
      io.sockets["in"](socket.room).emit('updatechat', socket.username, 'More than two device connected');
    } else {
      io.sockets["in"](socket.room).emit('updatechat', socket.username, 'waiting for second device');
    }
  });


  /*
     RECONNECT.....
  */
  socket.on('reconnect', (attemptNumber) => {
    console.log("in re-connect event");
  });

  /*
    OPT-IN REQUEST FOR CUSTOMER AND MERCHANT.
    @PARAMS phone_no&merchant_id
  */
  socket.on('LOGIN_REQUEST', function (customer_details) {
    console.log("In login request...", typeof customer_details);
    var requested_data = JSON.parse(customer_details);
    var number_room_members = io.sockets.adapter.rooms[socket.room].length;
    console.log("LOGIN_REQUEST number_room_member=" + number_room_members);
    var termsAndCondition = (number_room_members == 1 && requested_data.device_type == "merchant") ? true : false;
    socket.emit('updaterooms', rooms, requested_data.merchant_id);
    var number_room_member = io.sockets.adapter.rooms[socket.room];
    io.sockets["in"](socket.room).emit('WAIT_EVENT', "Please wait for response.");
    var api_url = API_BASE_URL + "customers/createcustomerbyphonenumberoffers";
    var merchant_detail_api = API_BASE_URL + "/merchants/" + requested_data.merchant_id;
    var numof_room_member = io.sockets.adapter.rooms[socket.room].length;
    console.log("numof_room_member===" + numof_room_member + "==requested_data.device_type==" + requested_data.device_type);
    if (numof_room_member < 2 && requested_data.device_type == "customer") {
      io.sockets["in"](socket.room).emit('LOGIN_RESPONSE', "Unable to opt-in. Merchant device is not connected to server.", termsAndCondition, false);
    } else {
      axios.get(merchant_detail_api, {
          "id": requested_data.merchant_id
        })
        .then(function (merchant_detail) {
          var merchant_detail_response = merchant_detail.data.Data[0].taptext_status;
          console.log("merchant_detail_response=", typeof merchant_detail_response);
          if (merchant_detail_response == "true") {
            console.log("taplocal text is enabled");
            axios.post(api_url, {
                "merchant_id": requested_data.merchant_id,
                "phone_no": requested_data.phone_no
              })
              .then(function (response) {
                var response = JSON.stringify(response.data);
                io.sockets["in"](socket.room).emit('LOGIN_RESPONSE', response, termsAndCondition, true);
              })
              .catch(function (error) {
                console.log(error);
              });
          } else {
            console.log("taplocal text is not enabled");
            io.sockets["in"](socket.room).emit('LOGIN_RESPONSE', "Tap Local Text Loyalty service is currently disabled.", termsAndCondition, false);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    }

  });


  /*
    OPT-IN REQUEST FOR CUSTOMER AND MERCHANT.
    @PARAMS customer_id,phone_no&merchant_id
  */
  socket.on('OPT_IN_REQUEST', function (customer_details) {
    console.log("In OPT_IN_REQUEST...", typeof customer_details);
    var requested_data = JSON.parse(customer_details);
    var number_room_member = io.sockets.adapter.rooms[socket.room];
    io.sockets["in"](socket.room).emit('WAIT_EVENT', "Please wait for response.");
    var api_url = API_BASE_URL + "customers/" + requested_data.customer_id + "/tos/offers?merchant_id=" + requested_data.merchant_id;
    console.log("api_url" + api_url);
    var merchant_detail_api = API_BASE_URL + "/merchants/" + requested_data.merchant_id;
    var numof_room_member = io.sockets.adapter.rooms[socket.room].length;
    console.log("numof_room_member===" + numof_room_member + "==requested_data.device_type==" + requested_data.device_type);
    if (numof_room_member < 2 && requested_data.device_type == "customer") {
      io.sockets["in"](socket.room).emit('OPT_IN_RESPONSE', "Unable to opt-in. Merchant device is not connected to server.", false);
    } else {
      axios.get(merchant_detail_api, {
          "id": requested_data.merchant_id
        })
        .then(function (merchant_detail) {
          var merchant_detail_response = merchant_detail.data.Data[0].taptext_status;
          console.log("merchant_detail_response=", typeof merchant_detail_response);
          if (merchant_detail_response == "true") {
            console.log("taplocal text is enabled");
            axios.post(api_url, {
                "optin": true
              })
              .then(function (response) {
                var response = JSON.stringify(response.data);
                io.sockets["in"](socket.room).emit('OPT_IN_RESPONSE', response, true);
              })
              .catch(function (error) {
                console.log(error);
              });

          } else {
            console.log("taplocal text is not enabled");
            io.sockets["in"](socket.room).emit('OPT_IN_RESPONSE', "Tap Local Text Loyalty service is currently disabled.", false);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    }

  });

  /*
   OPT_OUT_REQUEST FOR CUSTOMER AND MERCHANT.
   @PARAMS customer_id,phone_no&merchant_id
  */
  socket.on('OPT_OUT_REQUEST', function (customer_details) {
    console.log("In OPT_OUT_REQUEST...", typeof customer_details);
    var requested_data = JSON.parse(customer_details);
    var number_room_member = io.sockets.adapter.rooms[socket.room];
    io.sockets["in"](socket.room).emit('WAIT_EVENT', "Please wait for response.");
    var api_url = API_BASE_URL + "customers/" + requested_data.customer_id + "/tos/offers?merchant_id=" + requested_data.merchant_id;
    console.log("api_url" + api_url);
    axios.post(api_url, {
        "optin": false
      })
      .then(function (response) {
        var response = JSON.stringify(response.data);
        io.sockets["in"](socket.room).emit('OPT_OUT_RESPONSE', response);
      })
      .catch(function (error) {
        console.log(error);
      });

  });



  /*
     GUID_RECEIVED REQUEST FOR RELEASE THE PIN UPDATE FIELD IN DATABASE pin_released.
     @PARAMS pin,unique_id
     */
  socket.on('GUID_RECEIVED', function (request_data) {
    var request_data = JSON.parse(request_data);
    //update the PIN released field.....
    var api_url = API_BASE_URL + "merchants/releasedevicepin";
    axios.post(api_url, {
        "pin": request_data.pin,
        "unique_id": request_data.guid,
        "api_for": "RELESE_PIN"
      })
      .then(function (response) {
        var response = JSON.stringify(response.data);
        io.sockets["in"](socket.room).emit('GUID_RECEIVED_RESPONSE', response);
      })
      .catch(function (error) {
        console.log(error);
      });

  });


  /*
      Noify for PIN expiration...
       */
  socket.on('PIN_EXPIREDCHECK_REQUEST', function (request_data) {
    var request_data = JSON.parse(request_data);
    //update the PIN released field.....
    var api_url = API_BASE_URL + "checkpinexpired";
    axios.post(api_url, {
        "unique_id": request_data.guid
      })
      .then(function (response) {
        console.log("expired response====", response.data.data.pin_expired);
        if (response.data.data.pin_expired == true) {
          io.sockets["in"](socket.room).emit('PIN_EXPIRED_RESPONSE', response.data.data.pin_expired);
        }

      })
      .catch(function (error) {
        console.log(error);
      });

  });


  /*
    UNPAIR_DEVICES_REQUEST REQUEST FOR RELEASE THE UNIQUE ID DELETE ROW FROM DATABASE TABLE.
    @PARAMS unique_id 
    */
  socket.on('UNPAIR_DEVICES_REQUEST', function (request_data) {
    io.sockets["in"](socket.room).emit('UNPAIR_DEVICES_RESPONSE', true, "Devices are unpaired");
    delete usernames[socket.username];
    socket.leave(socket.room);
    var request_data = JSON.parse(request_data);
    //delete the row info related to unique id.....
    var api_url = API_BASE_URL + "merchants/releasedevicepin";
    axios.post(api_url, {
        "unique_id": request_data.guid,
        "api_for": "UNPAIR_DEVICE"
      })
      .then(function (response) {
        console.log("room deleted successfully");
      })
      .catch(function (error) {
        console.log(error);
      });

  });


  /*
  CANCEL_TOS_REQUEST FOR CUSTOMER AND MERCHANT DEVICE.
  @PARAMS merchant_id
  */
  socket.on('CANCEL_TOS_REQUEST', function (cancele_detail) {
    var cancele_reqest = JSON.parse(cancele_detail);
    io.sockets["in"](socket.room).emit('CANCEL_TOS_RESPONSE', "Success", "Return back to privious screen.");
  });


  /*
  CANCLE REQUEST FOR CUSTOMER AND MERCHANT DEVICE.
  @PARAMS merchant_id
  */
  socket.on('CANCEL_REQUEST', function (cancele_detail) {
    var cancele_reqest = JSON.parse(cancele_detail);
    io.sockets["in"](socket.room).emit('CANCEL_RESPONSE', "Success", "Return back to privious screen.");
  });

  /*
  DISCONNECT_REQUEST REQUEST FOR DEVICE INFORM OTHER DEVICE.
  @PARAMS merchant_id
  */
  socket.on('DISCONNECT_REQUEST', function (device_room) {
    console.log('DISCONNECT_REQUEST', device_room);
    delete usernames[socket.username];
    io.sockets.emit('updateusers', usernames);
    socket.leave(socket.room);
    io.in(socket.room).emit('DISCONNECT_RESPONSE', socket.username + ' has disconnected');
  });

  /*
  ORDER_MODIFIED_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
  @PARAMS merchant_id
  */
  socket.on('ORDER_MODIFIED_REQUEST', function (oder_detail) {
    socket.to(socket.room).emit('ORDER_MODIFIED_RESPONSE', oder_detail);
  });

  /*
    MERCHANT_LOCAL_VERSION_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
    @PARAMS merchant_id
    */
  socket.on('MERCHANT_LOCAL_VERSION_REQUEST', function (merchantVersion) {
    socket.to(socket.room).emit('MERCHANT_LOCAL_VERSION_RESPONSE', merchantVersion);
  });

  /*
    CUSTOMER_LOCAL_VERSION_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
    @PARAMS merchant_id
    */
  socket.on('CUSTOMER_LOCAL_VERSION_REQUEST', function (customerVirsion) {
    socket.to(socket.room).emit('CUSTOMER_LOCAL_VERSION_RESPONSE', customerVirsion);
  });


  /*
    COUPONS_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
    @PARAMS merchant_id
    */
  socket.on('COUPONS_REQUEST', function (coupon_response) {
    socket.to(socket.room).emit('COUPONS_RESPONSE', coupon_response);
  });

  /*
    UPDATE_ORDER_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
    @PARAMS merchant_id
    */
  socket.on('UPDATE_ORDER_REQUEST', function (coupon_response) {
    socket.to(socket.room).emit('UPDATE_ORDER_RESPONSE', coupon_response);
  });

  /*
    APPLIED_COUPON_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
    @PARAMS merchant_id
    */
  socket.on('APPLIED_COUPON_REQUEST', function (appliedcoupon) {
    socket.to(socket.room).emit('APPLIED_COUPON_RESPONSE', appliedcoupon);
  });

  /*
    UNSELECT_COUPON_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
    @PARAMS merchant_id
    */
  socket.on('UNSELECT_COUPON_REQUEST', function (appliedcoupon) {
    socket.to(socket.room).emit('UNSELECT_COUPON_RESPONSE', appliedcoupon);
  });

  /*
  SELECT_COUPON_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
  @PARAMS merchant_id
  */
  socket.on('SELECT_COUPON_REQUEST', function (appliedcoupon) {
    socket.to(socket.room).emit('SELECT_COUPON_RESPONSE', appliedcoupon);
  });

  /*
   RESET_CUSTOMER_APP_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
   @PARAMS merchant_id
   */
  socket.on('RESET_CUSTOMER_APP_REQUEST', function (appliedcoupon) {
    socket.to(socket.room).emit('RESET_CUSTOMER_APP_RESPONSE', appliedcoupon);
  });


  /*
     PAYMENT_BEING_PROCESSED_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
     @PARAMS merchant_id
     */
  socket.on('PAYMENT_BEING_PROCESSED_REQUEST', function (appliedcoupon) {
    socket.to(socket.room).emit('PAYMENT_BEING_PROCESSED_RESPONSE', appliedcoupon);
  });


  /*
   DISPLAY_ERROR_MESSGAE_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
   @PARAMS merchant_id
   */
  socket.on('DISPLAY_ERROR_MESSAGE_REQUEST', function (appliedcoupon) {
    socket.to(socket.room).emit('DISPLAY_ERROR_MESSAGE_RESPONSE', appliedcoupon);
  });

  /*
    SEND_MERCHANT_ID_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
    @PARAMS merchant_id
    */
  socket.on('SEND_MERCHANT_ID_REQUEST', function (appliedcoupon) {
    socket.to(socket.room).emit('SEND_MERCHANT_ID_RESPONSE', appliedcoupon);
  });

  /*
    DISCOUNT_COUPON_DETAILS_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
    @PARAMS merchant_id
    */
  socket.on('DISCOUNT_COUPON_DETAILS_REQUEST', function (appliedcoupon) {
    socket.to(socket.room).emit('DISCOUNT_COUPON_DETAILS_RESPONSE', appliedcoupon);
  });


  /*
    SIGN_UP_OFFER_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
    @PARAMS merchant_id
    */
  socket.on('SIGN_UP_OFFER_REQUEST', function (signupoffer) {
    socket.to(socket.room).emit('SIGN_UP_OFFER_RESPONSE', signupoffer);
  });

  /*
   TEXT_NOT_ACTIVATED_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
   @PARAMS merchant_id
   */
  socket.on('TEXT_NOT_ACTIVATED_REQUEST', function (data) {
    socket.to(socket.room).emit('TEXT_NOT_ACTIVATED_RESPONSE', data);
  });

  /*
    UPDATE_MERCHANT_INFO_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
    @PARAMS merchant_id
    */
  socket.on('UPDATE_MERCHANT_INFO_REQUEST', function (data) {
    socket.to(socket.room).emit('UPDATE_MERCHANT_INFO_RESPONSE', data);
  });


  /*
   REMOVE_ORDER_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
   @PARAMS merchant_id
   */
  socket.on('REMOVE_ORDER_REQUEST', function (data) {
    socket.to(socket.room).emit('REMOVE_ORDER_RESPONSE', data);
  });


  /*
   REMOVE_COUPON_REQUEST REQUEST FOR SEND THE ORDER INFORMATION ON OTHER DEVICE.
   @PARAMS merchant_id
   */
  socket.on('REMOVE_COUPON_REQUEST', function (data) {
    socket.to(socket.room).emit('REMOVE_COUPON_RESPONSE', data);
  });


  socket.on('switchRoom', function (newroom) {
    var oldroom;
    oldroom = io.room;
    socket.leave(socket.room);
    socket.join(newroom);
    socket.emit('updatechat', 'SERVER', 'you have connected to ' + newroom);
    //socket.broadcast.to(oldroom).emit('updatechat', 'SERVER', socket.username + ' has left this room');
    socket.room = newroom;
    //socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username + ' has joined this room');
    socket.emit('updaterooms', rooms, newroom);
  });




  socket.on('disconnect', function () {
    console.log("disconnect");
    delete usernames[socket.username];
    io.sockets.emit('updateusers', usernames);
    socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
    socket.to(socket.room).emit('OTHER_DEVICE_CONNECTION_CHANGED', false);
    socket.leave(socket.room);
  });

  socket.on('connect_error', (error) => {
    console.log("connect_error===>", error);
  });

  socket.on('error', (error) => {
    console.log("error===>", error);
  });

  socket.on('reconnect_error', (error) => {
    console.log("reconnect_error===>", error);
  });

  socket.on('connect_failed', function () {
    console.log("connect_failed");
    document.write("Sorry, there seems to be an issue with the connection!");
  })
  /*
  EXPIRED PIN CHECK...===========================================================
  */

  console.log("socket.roomsdfsdfsdf121================================");

  // cron.schedule("*/1 * * * * *", () => {
  //   console.log("running a task every minute");

  //   var connection = mysql.createConnection({
  //     host: "tapdevstaging.cluster-cokeytqlmxxk.us-west-2.rds.amazonaws.com",
  //     user: "root",
  //     password: "3Nko8zumvRgw",
  //     port: "3306",
  //     database: "tapstaging"
  //   });

  //   connection.connect();

  //   connection.query("SELECT unique_id FROM tap_merchantdevice_pin where expired=1", function (
  //     error,
  //     results,
  //     fields
  //   ) {
  //     if (error) throw error;
  //     console.log(
  //       "The solution is: cronetime",
  //       +Math.floor(Date.now() / 1000) + "lenght==",
  //       results.length
  //     );

  //     results.forEach(function (room) {
  //       console.log("all expired PIN===", room.unique_id);
  //       io.to(room.unique_id).emit("PIN_EXPIRED_RESPONSE", "sorry your PIN is expired.");
  //     });
  //   });

  //   connection.end();
  // });
  /*
  ===============================================================================
  */

  /*
  Passing the data from one device to other device.
  */
  socket.on('OPT_IN_VIA_API_REQUEST', function (data) {
    socket.to(socket.room).emit('OPT_IN_VIA_API_RESPONSE', data);
  });

  /*
  Passing the data from one device to other device.
  */
  socket.on('OPT_OUT_VIA_API_REQUEST', function (data) {
    socket.to(socket.room).emit('OPT_OUT_VIA_API_RESPONSE', data);
  });

});