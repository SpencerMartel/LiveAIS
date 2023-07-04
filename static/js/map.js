var map = L.map("map").setView([49.299045, -123.088558], 13);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 25
}).addTo(map);

var boatIcon = L.Icon.extend({
    options: {
        customId: "",
    }
});

var markers = [];

function add_boat(data){

    if (data.MetaData.MMSI in markers){
        console.log(`Boat ${data.MetaData.MMSI} has called again`)
    }
    var marker = L.marker(
        [data.MetaData.latitude, data.MetaData.longitude]
        )
    var popup = L.popup().setContent(`${data.MetaData.MMSI}`);
    marker.bindPopup(popup).openPopup();
    marker.addTo(map);

    markers.push(data.MetaData.MMSI)
    console.log(markers.length)
}