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
  const sidebarContainer = document.getElementById("sidebar-container");
  const sidebarButton = document.getElementById("sidebarButton")
  sidebarContainer.style.width = "400px";

  sidebarButton.style.left = "400px"
  sidebarButton.onclick = function () { closeNav(); };
}

/* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
function closeNav() {
  const sidebarContainer = document.getElementById("sidebar-container");
  const sidebarButton = document.getElementById("sidebarButton")
  sidebarContainer.style.width = "0";

  sidebarButton.style.left = "0"
  sidebarButton.onclick = function () { openNav(); };
}