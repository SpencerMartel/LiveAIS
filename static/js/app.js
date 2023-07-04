$(document).ready(function () {
  const MAX_DATA_COUNT = 10;
  //connect to the socket server.
  //   var socket = io.connect("http://" + document.domain + ":" + location.port);
  var socket = io.connect();

  //receive details from server
  socket.on("newBoatLocated", function (msg) {
    // console.log(msg.value);
    add_boat(msg.value);
  });
});