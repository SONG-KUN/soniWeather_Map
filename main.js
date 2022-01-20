// source
// layer
// map

// import {Fill, Stroke, Style} from 'ol/style';
let myview;
let map;

const MIL_LAT = 1026180.4891858436;
const MIL_LON = 5690709.798259557;
const milano = [MIL_LAT, MIL_LON];
let lat;
let lon;

//when html is ready, execute all below
document.addEventListener("DOMContentLoaded", function(event) {


    myview = new ol.View({
        //center: ol.proj.fromLonLat([37.41, 8.82]);
        center: [1350766.668508934, 5177943.850979362], // map.getView().getCenter()
        zoom: 6
    })

    const mylayer = new ol.layer.Tile({
        source: new ol.source.OSM()
    })

    const layer = [mylayer]

    const styles = [
        new ol.style.Style({

            fill: new ol.style.Fill({
                color: 'green'    //'rgba(255,255,255,0.4)'
            }),

            stroke: new ol.style.Stroke({
                color: '#3399CC',
                width: 1.25
            })
        })
    ];

    map = new ol.Map({
        target: 'map',
        layers: layer,
        view: myview
    });

    const mygeojson = new ol.layer.Vector({
        // source: new ol.source.Vector({
        //     format : new ol.format.GeoJSON(),
        //     url : '.json'
        // }),

        style: styles
    })


    map.addLayer(mygeojson);
    map.on("click", (e) => getMapCoordOnClick(e));


    document.getElementById("milanoBtn").addEventListener("click", zoomtomilano);
});

const zoomtomilano = () => {
    console.debug("myview object", myview);
    myview.animate({
        center: milano,
            duration: 1800,
            zoom: 11
    })
}

const getMapCoordOnClick = (evt) => {
    //tuple of coordinates
    const lonlat = ol.proj.toLonLat(evt.coordinate);
    lon = lonlat[0];
    lat = lonlat[1];
    console.log("lon & lat", lon, lat);

    //array = query accuweather

    // weather params to generate sound
    sound (lon, lat);
}

// change mouse cursor when over marker
/* map.on('pointermove', function (e) {
    const pixel = map.getEventPixel(e.originalEvent);
    const hit = map.hasFeatureAtPixel(pixel);
    console.debug("marker hit?", hit);
    document.getElementById(map.getTarget()).style.cursor = hit ? 'pointer' : '';
}); */