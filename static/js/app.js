$(document).ready(function () {
  var socket = io.connect(':8080');

  //receive details from server
  socket.on("newBoatLocated", function (msg) {
    // console.log(msg.value);
    newData(msg.value);
  });
});

/* Set the width of the sidebar to 250px and the left margin of the page content to 250px */
function openNav() {
  document.getElementById("mySidebar").style.width = "450px";
  document.getElementById("sidebarButton").style.left = "450px"
  document.getElementById("sidebarButton").onclick = function () { closeNav(); };
}

/* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
function closeNav() {
  document.getElementById("mySidebar").style.width = "0";
  document.getElementById("sidebarButton").style.left = "0px"
  document.getElementById("sidebarButton").onclick = function () { openNav(); };
}