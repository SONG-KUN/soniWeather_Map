
//variables used in retrive informations
const APIKeys = ['b0G0rFd66TFZJFtg7Zc2zWFLtfszoQ1G' , '7pu6ELCYDhg8YqBTAPNCal6I6svfsuEL'];

// URL of the TILE SERVER
const url_carto_cdn = 'http://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';

const textContent = document.getElementById("content");
const search = document.getElementById("searchUser");
const weatherButton = document.getElementById("submit");
const image = document.querySelector(".image img");

/**
 * Function used to update all ui functions about city and weather forecast and icon
 * @param data
 */
const updateUI = (data) => {
    const cityDets = data.cityDetails;
    const weather = data.cityWeather;

    //updating details into HTML
    textContent.innerHTML = `
    <h3 class="font-c">${cityDets.EnglishName}</h3>
    <h3 class="font-c">${weather.WeatherText}</h3>
    <h2 class="font-c">${weather.Temperature.Metric.Value} &degC</h2>
  `;
    
    //updating image
    let imgSrc = null;
    imgSrc = "/data/WeatherIcons/" + weather.WeatherIcon + ".png";
    image.setAttribute("src", imgSrc);
}

/**
 * City updater
 * @param city city we need for calling function
 * @returns {Promise<{cityDetails: *, cityWeather: *}>}
 */
const updateCity = async (city) => {
    const cityDetails = await getCity(city);
    const cityWeather = await getWeather(cityDetails.Key);

    return {
        cityDetails: cityDetails,
        cityWeather: cityWeather,
    };
};

/**
 * Click event listener
 */
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
               
    }

});



/**
 * Get the weather info when click on the map
 * @param evt click event
 */
const getMapCoordOnClick = (evt) => {
    //tuple of coordinates
    const lonlat = ol.proj.toLonLat(evt.coordinate);
    //prepare clean ambient
    currentCityCleaner();
    currentCityForecast = []
    currentCity.longitude = lonlat[0];
    currentCity.latitude = lonlat[1];
    
    // get the city name when you click on the map(Represent the city name only on the console, can't print it and call it now)
    const addressINFO = httpGet(lonlat ,function(a){console.log(a)});
    
    // display city name on the sidebar
    populateUI(addressINFO);

    // doing the query to get forecast (or load it in current city)
    // Also only represent the city name on the console, can't print it and call it now; It's the problem of async and cannot get the OBJECT correctly
    getCityByCoordinates().then(r => gettingWeatherDetails());
    //console.log('cities', citiesForecast);

    // weather params to generate sound; 0 is the current hour, stubbed, returns forecast of 1 hour
    //console.log("current", currentCityForecast[0]);
    //sound (currentCityForecast[0]);
    sound();
}



 /**
  * Nominatim is the open-source geocoding with OpenStreetMap data
  * We apply Nominatim to get the geographic information on Lon&Lat obtained by clicking on the map
  */
function httpGet(coords , callback)
{
    fetch('http://nominatim.openstreetmap.org/reverse?format=json&lon=' + coords[0] + '&lat=' + coords[1])
        .then(function(response) {
            return response.json();
        }).then(function(info)
    {
        // console.log(info);
        const cityName = info.address.city;
        // console.log(cityName)
        callback(cityName)

    });
}


/**
 * Function used to populate the UI section of city
 * @param city city used to populate the param
 */
function populateUI(city)
{
    //add them to inner HTML
    textContent.innerHTML = `
        <div class="card mx-auto mt-5" style="width: 18rem;">
            <div class="card-body justify-content-center">
                <h5 class="card-title">${city}</h5>
                
            </div>
        </div> 
        `;
}


/**
 * Function event on click on search button
 */
weatherButton.addEventListener("click", () => {
    const city = search.value;
    currentCity.cityName = city;
    getCityByName();
    console.log(city);
    //updating UI
    updateCity(city)
        .then((data) => {
            updateUI(data);
        })
        .catch((err) => console.log(err));
});










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
