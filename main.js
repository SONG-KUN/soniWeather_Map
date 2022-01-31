const MIL_LAT = 1026180.4891858436;
const MIL_LON = 5690709.798259557;
// const milano = [MIL_LAT, MIL_LON];
let lat;
let lon;

// location of MILANO
var milano = [1026180.4891858436, 5690709.798259557];




//
document.addEventListener("DOMContentLoaded", function(event){
// view
    var myview = new ol.View({
        // center: ol.proj.fromLonLat([37.41, 8.82]),
        center: [1350766.668508934, 5177943.850979362], // map.getView().getCenter()
        zoom: 6,

    })


    window.onload = init();

    function init() {
        const map = new ol.Map({
            target: 'map', // id name of html
            // layers:
            view: myview
        })

        // map.on('pointermove', function (e) { // change mouse cursor when over marker
        //     const pixel = map.getEventPixel(e.originalEvent);
        //     const hit = map.hasFeatureAtPixel(pixel);
        //     console.log(hit)
        //     document.getElementById(map.getTarget()).style.cursor = hit ? 'pointer' : '';
        // });


        const openStreetMapStandard = new ol.layer.Tile({
            source: new ol.source.OSM(), // open street map
            visible: true,
            title: 'OSMStandard'
        })

        const openStreetMapHumanitarian = new ol.layer.Tile({
            source: new ol.source.OSM({
                url: 'http://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
            }),
            visible: false,
            title: 'OSMHumanitarian'
        })

        const stamenTerrain = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'http://tile.stamen.com/terrain/{z}/{x}/{y}.jpg',
                attributions: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
            }),
            visible: false,
            title: 'StamenTerrain'
        })
        // map.addLayer(stamenTerrain);

        // Layer group
        const baseLayerGroup = new ol.layer.Group({
            layers: [
                openStreetMapStandard, openStreetMapHumanitarian, stamenTerrain
            ]
        })
        map.addLayer(baseLayerGroup);

        // Layer Switcher
        const baseLayerElements = document.querySelectorAll('.sidebar>input[type=radio]');
        for (let baseLayerElement of baseLayerElements) {
            baseLayerElement.addEventListener('change', function () {
                // console.log(this.value);
                let baseLayerElementValue = this.value;
                baseLayerGroup.getLayers().forEach(function (element, index, array) {
                    let baseLayerTitle = element.get("title");
                    element.setVisible(baseLayerTitle === baseLayerElementValue);
                })

            })
        }

        // Vector Layers
        var styles = [
            new ol.style.Style({
                fill: new ol.style.Fill({
                    color: [125, 45, 45, 0.15]
                }),
                stroke: new ol.style.Stroke({
                    color: 'red', // '#3399CC'
                    width: 1.2
                }),

                image: new ol.style.Circle({
                    fill: new ol.style.Fill({
                        color: "blue"
                    }),
                    radius: 3.5,
                    stroke: new ol.style.Stroke({
                        color: 'red', // '#3399CC'
                        width: 1.2
                    }),

                }),

                // image: new ol.style.Icon({ // apply the icon
                //     scale: 0.04,
                //     src: 'https://dl.dropboxusercontent.com/u/27798645/fireman/truck65.svg'
                // }),

                // label: "Capital",
                // text: new ol.style.Text({
                //     font: '15px Calibri,sans-serif',
                //     scale: 1.1,
                //     fill: new ol.style.Fill({ color: '#000' }),
                //     stroke: new ol.style.Stroke({
                //         color: '#fff', //  color: '#FFFF99'
                //         width: 2
                //     }),
                //     text: "Capital",
                //     offsetY: 18,
                //     overflow: true
                //     // placement: 'line'
                //     // feature.get('name')
                // })

            })
        ];


        var ItalyGeoJSON = new ol.layer.VectorImage({
            source: new ol.source.Vector({
                format: new ol.format.GeoJSON(),
                url: './data/vector_data/italyFix.geojson'
            }),
            visible: true,
            title: 'ITALY',
            style: styles
        })
        map.addLayer(ItalyGeoJSON);

        // Vector feature popup
        const overlayContainerElement = document.querySelector(".overlay-cotainer");
        const overlayLayer = new ol.Overlay({
            element: overlayContainerElement
        })
        map.addOverlay(overlayLayer);
        const overlayFeatureName = document.getElementById('feature-name');
        const overlayFeatureAdditionalINFO = document.getElementById('feature-additional-info');

        map.on('click', function (i) { // create a click event ;
            overlayLayer.setPosition(undefined);
            map.forEachFeatureAtPixel(i.pixel, function (feature, layer) {
                    let clickedCoordinate = i.coordinate;
                    // console.log([
                    //     clickedCoordinate[0] + Math.round(clickedCoordinate[0] / 360) * 360,
                    //     clickedCoordinate[1],
                    // ]);
                    let lonLatCoordinate = ol.proj.toLonLat(clickedCoordinate) // longitude as 1st and latitude as 2nd element
                    console.log(lonLatCoordinate)

                    let clickedFeatureName = feature.get('NAME'); // getKeys()得到feature全部重要信息
                    let clickedFeatureAdditionalINFO = feature.get('additionalinfo');
                    overlayLayer.setPosition(clickedCoordinate);
                    overlayFeatureName.innerHTML = clickedFeatureName;
                    overlayFeatureAdditionalINFO.innerHTML = clickedFeatureAdditionalINFO;
                },
                {
                    layerFilter: function (layerCandidate) { // it's a filter that select the geojson you want to use
                        return layerCandidate.get("title") === 'ITALY'
                    }


                })
        })

        map.on("click", (e) => getMapCoordOnClick(e));

    }




});


function zoomtomilano(){
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
    sound (lonlat);
}





// layer
// var mylayer = new ol.layer.Tile({
//     source: new ol.source.OSM() // open street map
// })
// var layer = [mylayer]
