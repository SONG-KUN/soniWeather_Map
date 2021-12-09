// source
// layer
// map

// import {Fill, Stroke, Style} from 'ol/style';

var milano = [1026180.4891858436, 5690709.798259557];

var myview = new ol.View({
    // center: ol.proj.fromLonLat([37.41, 8.82]),
    center: [1350766.668508934, 5177943.850979362], // map.getView().getCenter()
    zoom: 6
})

var mylayer = new ol.layer.Tile({
    source: new ol.source.OSM()
})

var layer = [mylayer]

var styles = [
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

var map = new ol.Map({
    target: 'map',
    layers: layer,
    view: myview
});

var mygeojson = new ol.layer.Vector({
    // source: new ol.source.Vector({
    //     format : new ol.format.GeoJSON(),
    //     url : '.json'
    // }),

    style: styles
})


map.addLayer(mygeojson)


function zoomtomilano(){
    myview.animate({
        center: milano,
            duration: 1800,
            zoom: 11
    })
}

// change mouse cursor when over marker
map.on('pointermove', function (e) {
    const pixel = map.getEventPixel(e.originalEvent);
    const hit = map.hasFeatureAtPixel(pixel);
    console.log(hit)
    document.getElementById(map.getTarget()).style.cursor = hit ? 'pointer' : '';
});