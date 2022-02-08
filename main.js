let lat;
let lon;

//variables used in retrive informations
const APIKeys = ['b0G0rFd66TFZJFtg7Zc2zWFLtfszoQ1G' , '39a9a737b07b4b703e3d1cd1e231eedc' , '7pu6ELCYDhg8YqBTAPNCal6I6svfsuEL'];

// URL of the TILE SERVER
const url_carto_cdn = 'http://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';


document.addEventListener("DOMContentLoaded", function(event)
{
    // view
    var myview = new ol.View({
        center: [1350766.668508934, 5177943.850979362], // map.getView().getCenter()
        zoom: 6,
    })

    window.onload = init(); // Call init() when we open the window
    function init() {
        const map = new ol.Map({
            target: 'map', 
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.XYZ({url: url_carto_cdn})
                })
            ],
            view: myview
        })

        // The following is to create three different layers. openStreetMapStandard, openStreetMapHumanitarian and stamenTerrain
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

        // Manually created geojson of italy by http://geojson.io/#map=7/51.529/-0.110
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
                    let lonLatCoordinate = ol.proj.toLonLat(clickedCoordinate) // longitude as 1st and latitude as 2nd element
                    let clickedFeatureName = feature.get('NAME'); 
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

        
        // Create a click event to call getMapCoordOnClick()
        map.on("click", (e) => getMapCoordOnClick(e));
        
        
        /**
         * Nominatim is the open-source geocoding with OpenStreetMap data
         * We apply Nominatim to get the geographic information on Lon&Lat obtained by clicking on the map
         */
        map.on('click', function (evt) {

            const coords_click = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');

            // MOUSE CLICK: Longitude,Latitude
            const lon = coords_click[0];
            const lat = coords_click[1];

            // Data to put in Nominatim url to find address of mouse click location
            const data_for_url = {lon: lon, lat: lat, format: "json", limit: 1};

            // ENCODED DATA for URL
            const encoded_data = Object.keys(data_for_url).map(function (k) {
                return encodeURIComponent(k) + '=' + encodeURIComponent(data_for_url[k])
            }).join('&');

            // FULL URL for searching address of mouse click
            const url_nominatim = 'https://nominatim.openstreetmap.org/reverse?' + encoded_data;
            console.log("URL Request NOMINATIM-Reverse: " + url_nominatim);

            // GET URL REQUEST for ADDRESS
            httpGet(url_nominatim, function (response_text) {

                // JSON Data of the response to the request Nominatim
                const data_json = JSON.parse(response_text);

                // Longitude and latitude
                const res_lon = data_json.lon;
                const res_lat = data_json.lat;

                // All the information of the address are here
                const res_address = data_json.address;

                // Manage some details depends on the location, country and places
                const address_display_name  = data_json.display_name;
                const address_country       = res_address.country;
                const address_country_code  = res_address.country_code;
                const address_postcode      = res_address.postcode;
                const address_state         = res_address.state;
                const address_town          = res_address.town;
                const address_city          = res_address.city;
                const address_suburb        = res_address.suburb;
                const address_neighbourhood = res_address.neighbourhood;
                const address_house_number  = res_address.house_number;
                const address_road          = res_address.road;


                console.log("Longitude    : " + res_lon);
                console.log("Longitude    : " + res_lat);
                console.log("Name         : " + address_display_name);
                console.log("Country      : " + address_country);
                console.log("Count. Code  : " + address_country_code);
                console.log("Postcode     : " + address_postcode);
                console.log("State        : " + address_state);
                console.log("Town         : " + address_town);
                console.log("City         : " + address_city);
                console.log("Suburb       : " + address_suburb);
                console.log("Neighbourhood: " + address_neighbourhood);
                console.log("Road         : " + address_road);
                console.log("House Number : " + address_house_number);
            });
        });

    }

});



// Get the weather info when click on the map
const getMapCoordOnClick = (evt) => {
    //tuple of coordinates
    const lonlat = ol.proj.toLonLat(evt.coordinate);
    //prepare clean ambient
    currentCityCleaner();
    currentCityForecast = []
    currentCity.longitude = lonlat[0];
    currentCity.latitude = lonlat[1];

    //doing the query to get forecast (or load it in current city)
    getCityByCoordinates().then(r => gettingWeatherDetails());
    console.log(citiesForecast);

    // weather params to generate sound; 0 is the current hour, stubbed, returns forecast of 1 hour
    sound (currentCityForecast[0]);
}


function httpGet(url, callback_function) {

    const getRequest = new XMLHttpRequest();
    getRequest.open("get", url, true);

    getRequest.addEventListener("readystatechange", function () {

        // If response is good
        if (getRequest.readyState === 4 && getRequest.status === 200) {

            // Callback for making stuff with the Nominatim response address
            callback_function(getRequest.responseText);
        }
    });
    
    // Send the request
    getRequest.send();
}












// function zoomtomilano(){
//     myview.animate({
//         center: milano,
//         duration: 1800,
//         zoom: 11
//     })
// }



// layer
// var mylayer = new ol.layer.Tile({
//     source: new ol.source.OSM() // open street map
// })
// var layer = [mylayer]
