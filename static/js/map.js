var map = L.map("map").setView([49.299045, -123.088558], 13);

L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 15,
	ext: 'png'
}).addTo(map);

const boatIcon = L.divIcon({
    html: '<i class="fa-solid fa-ship"></i>',
    className: 'myDivIcon',
});

const anchorIcon = L.divIcon({
    html: '<i class="fa-solid fa-anchor"></i>',
    className: 'myDivIcon',
});

var markers = [];

function newData(data) {

    // Check if the boat already appears on map
    var check = markers.some(obj => obj.hasOwnProperty(data.MetaData.MMSI));

    // First occurance of boat
    if (!check) {
        instantiateBoat(data);
    
    // Boat has been seen before
    } else {
        updateBoat(data);
    }
}

function instantiateBoat(data) {
    // Instantiate polyline
    const polylineOptions = {
        "delay": 800,
        "dashArray": [
            100,
            100
        ],
        "weight": 2,
        "color": "#0000FF",
        "pulseColor": "#FFFFFF",
        "paused": false,
        "reverse": false,
        "hardwareAccelerated": true
    }
    var polyline = L.polyline.antPath([[data.MetaData.latitude, data.MetaData.longitude]], polylineOptions);

    if (data.Message.PositionReport.Sog <= 0.5) {
        var icon = anchorIcon;
    } else {
        var icon = boatIcon; 
    }

    // Instantiate marker
    var popup = L.popup().setContent(`
        MMSI: ${data.MetaData.MMSI}<br>
        Vessel name: ${capitalizeFirstLetters(data.MetaData.ShipName.toLowerCase().trim())}<br>
        Speed over ground: ${data.Message.PositionReport.Sog}
        `);
    var marker = L.Marker.movingMarker(
        [[data.MetaData.latitude, data.MetaData.longitude], [data.MetaData.latitude, data.MetaData.longitude]], [1000], {icon: icon})
        .bindPopup(popup)
        .on('click', () => {
            var obj = markers.find(obj => obj[[data.MetaData.MMSI]]);
            var boatObj = obj[[data.MetaData.MMSI]]
            console.log(boatObj.Polyline)
            map.addLayer(polyline);
        })
        .addTo(map);

    // This builds the json object all our data lives in
    let obj_data = {
        "MMSI" : data.MetaData.MMSI,
        "Marker": marker,
        "PingLocations": [data.MetaData.latitude, data.MetaData.longitude],
        "Polyline": polyline,
        "Speeds": [data.MetaData.Sog]
    }
    var obj = { ...obj, [data.MetaData.MMSI]: obj_data }

    // Add it to our master list of Boats
    markers.push(obj)
}

function updateBoat(data) {

    // Grab the right boat obj in array of markers
    var obj = markers.find(obj => obj[data.MetaData.MMSI]);
    var boatObj = obj[[data.MetaData.MMSI]]

    // Update location and speed arrays
    var newPosition = [data.MetaData.latitude, data.MetaData.longitude]
    boatObj.PingLocations.push(newPosition)

    var newSpeed = data.MetaData.Sog
    boatObj.Speeds.push(newSpeed)


    // Update the marker property
    if (data.Message.PositionReport.Sog <= 0.5) {
        var icon = anchorIcon;
    } else {
        var icon = boatIcon; 
    }
    var markerObj = boatObj.Marker;
    var popup = L.popup().setContent(`
    MMSI: ${data.MetaData.MMSI}<br>
    Vessel name: ${capitalizeFirstLetters(data.MetaData.ShipName.toLowerCase().trim())}<br>
    Speed over ground: ${data.Message.PositionReport.Sog}
    `);

    markerObj.bindPopup(popup);
    marker.setIcon(icon);
    markerObj.moveTo(newPosition, [30000], { autostart: true });
    markerObj.start();

    // Only create polyline if the boat is moving
    // || 
    if (data.Message.PositionReport.Sog >= 1) {
        console.log(`Creating polyline for boat ${capitalizeFirstLetters(data.MetaData.ShipName.toLowerCase().trim())}`)
        boatObj.Polyline.addLatLng(newPosition)
        console.log(boatObj.Polyline)
    }
}

function capitalizeFirstLetters(string) {
    const arr = string.split(" ");

    for (var i = 0; i < arr.length; i++) {
        arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
    }

    const str2 = arr.join(" ");
    return str2;
}