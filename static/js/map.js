var map = L.map("map", { zoomControl: false }).setView([49.299045, -123.088558], 9);

var CartoDB_DarkMatterNoLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});


var allPolylinesLayer = L.layerGroup();
var acivePolylineLayer = L.layerGroup();

const basemaps = {
    "Dark Basemap": CartoDB_DarkMatterNoLabels,
    // "Satellite Imagery": Esri_WorldImagery
}
const overlays = {
    "All Vessel Movement": allPolylinesLayer,
}

var basemapControl = L.control.layers(basemaps, overlays).addTo(map);

const boatIcon = L.divIcon({
    html: '<i class="fa-solid fa-ship" style="color: #d1d1d1; fa-lg"></i>',
    className: 'myDivIcon',
});

const anchorIcon = L.divIcon({
    html: '<i class="fa-solid fa-anchor" style="color: #d1d1d1; fa-lg"></i>',
    className: 'myDivIcon',
});

const largeBoatIcon = L.divIcon({
    html: '<i class="fa-solid fa-ship fa-lg"></i>',
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
    percantageOfBoatTypes();
}

function percantageOfBoatTypes() {
    var docked = 0
    var moving = 0
    var temp = [...markers]
    for (var boat of temp) {
        var data = Object.values(boat)[0]
        var speed = data.Speeds[data.Speeds.length - 1];
        if (speed <= 0.3) {
            docked++
        } else {
            moving ++
        }
    }
    var total = temp.length
    var percentDocked = (docked / total) * 100
    var percentMoving = (moving / total) * 100
    // Call render function on piechart
    console.log(percentDocked, percentMoving)
    renderPieChart([percentDocked, percentMoving])
}


function instantiateBoat(data) {
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
        [[data.MetaData.latitude, data.MetaData.longitude], [data.MetaData.latitude, data.MetaData.longitude]], [1000], { icon: icon })
        .bindPopup(popup)
        .on('click', () => {

            acivePolylineLayer.eachLayer(function (layer) {
                acivePolylineLayer.removeLayer(layer)
            });

            if ((obj_data.PingLocations).length >= 2 && (data.Message.PositionReport.Sog >= 1 || obj_data.Speeds.slice(-1) <= 0.5)) {
                console.log(`Creating polyline for boat ${capitalizeFirstLetters(data.MetaData.ShipName.toLowerCase().trim())}`)
                var antPath = constructAntPath(obj_data.PingLocations)
                antPath.addTo(acivePolylineLayer);
            }
            map.addLayer(acivePolylineLayer);
            map.removeLayer(allPolylinesLayer);
        })
        .addTo(map);

    // Make leaflet Id of the markers = the boats unique identifier
    marker._leaflet_id = data.MetaData.MMSI;

    // This builds the json object all our data lives in
    let obj_data = {
        "MMSI": data.MetaData.MMSI,
        "Marker": marker,
        "PingLocations": [[data.MetaData.latitude, data.MetaData.longitude]],
        "AntPath": L.polyline.antPath([]),
        "Speeds": [data.Message.PositionReport.Sog]
    }
    var obj = { ...obj, [data.MetaData.MMSI]: obj_data }

    // Add it to our master list of Boats
    markers.push(obj)
}

function updateBoat(data) {
    console.log(`Boat: ${capitalizeFirstLetters(data.MetaData.ShipName.toLowerCase().trim())} has called in again`)
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
    Speed over ground: ${data.Message.PositionReport.Sog}`
    );

    if (data.Message.PositionReport.Sog >= 0.8) {
        console.log("Updating antpath")
        boatObj.polyline = constructAntPath(boatObj.PingLocations)
        boatObj.polyline._leaflet_id = boatObj.MMSI
        allPolylinesLayer.addLayer(boatObj.polyline)

        // Update polylines if it already exists rather than create duplicates
        allPolylinesLayer.eachLayer(function (layer) {
            if (layer._leaflet_id == boatObj.MMSI) {
                layer = boatObj.polyline
            }
        });

        // Update layer real time if layer is on
        if(map.hasLayer(allPolylinesLayer)) {
            map.removeLayer(allPolylinesLayer);
            map.addLayer(allPolylinesLayer);
        }
    }

    // Update icon and begin moving to new location
    markerObj.bindPopup(popup);
    markerObj.setIcon(icon);
    markerObj.moveTo(newPosition, [20000], { autostart: true });
    markerObj.start();
}

// Instantiate polyline
const polylineOptions = {
    "delay": 800,
    "dashArray": [
        100,
        100
    ],
    "weight": 5,
    "color": "#0000FF",
    "pulseColor": "#FFFFFF",
    "paused": false,
    "reverse": false,
    "hardwareAccelerated": false
}

function constructAntPath(values) {
    var polyline = L.polyline.antPath(values, polylineOptions);
    return polyline;
}

map.on('click', function () {
    map.removeLayer(acivePolylineLayer);
});

function capitalizeFirstLetters(string) {
    const arr = string.split(" ");

    for (var i = 0; i < arr.length; i++) {
        arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
    }

    const str2 = arr.join(" ");
    return str2;
}