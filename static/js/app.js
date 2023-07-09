$(document).ready(function () {
  var socket = io.connect(':8080');

  //receive details from server
  socket.on("newBoatLocated", function (msg) {
    // console.log(msg.value);
    newData(msg.value);
  });
});