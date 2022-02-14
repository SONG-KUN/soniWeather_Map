/**
 *
 * @author Davide Lorenzi
 * @author Nicolò Pisanu
 * @author Haukun Song
 */

//array of api keys, shuffled
const APIKeys = ['G2RHDSZWOO0lHDHSSf339l9MeaEip0VW' , 'a39nt3GG9ZNiFsNmXADD0n4KWPSrlIhf'/*, 'rVlJUvfhFOVCS0J49iwPUGgUcGMAIX0z'*/];

// URL of the TILE SERVER
const url_carto_cdn = 'http://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';

const textContent = document.getElementById("content");
const search = document.getElementById("searchUser");
const weatherButton = document.getElementById("submit");
const image = document.querySelector(".image img");
let selectElement;
var hour;
var weather;
let decimals = 1;
var output;

var maxWind = 30;
var flatValue = 0;
var maxTemperature = 40;
var minTemperature = -10;
var maxRain = 15;
var maxSnow = 5000; //mm of snow
var maxPercentage = 100;


function getHour()
{
    selectElement = document.querySelector('#chooseHour');
    hour = selectElement.options[selectElement.selectedIndex].value;
    //console.log("Selection: ",selectElement, "HOUR: ", hour);
}
/**
 * Click event listener
 */

// view
var myview = new ol.View({
        center: [1350766.668508934, 5177943.850979362], // map.getView().getCenter()
        zoom: 2,
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
    const overlayContainerElement = document.querySelector(".overlay-container");
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


/**
 * Get the weather info when click on the map
 * @param evt click event
 */
const getMapCoordOnClick = (evt) => {
    console.log("getMapCoordOnClick invoked");
    //tuple of coordinates
    const lonlat = ol.proj.toLonLat(evt.coordinate);
    //prepare clean ambient
    cleanCurrentCity();

    currentCity.longitude = lonlat[0];
    currentCity.latitude = lonlat[1];

    // doing the query to get forecast (or load it in current city)
    // Also only represent the city name on the console, can't print it and call it now; It's the problem of async and cannot get the OBJECT correctly
    getCityByCoordinates().then(r => playSound());
}


/**
 * Function used to retrieve weather from search bar
 * @returns {Promise<void>} city forecast
 */
function getWeatherOnSearch()
{
    cleanCurrentCity();
    currentCity.cityName = search.value;
    getCityByName().then(playSound);
}

/**
 * Function event on click on search button
 */
weatherButton.addEventListener("click", () => {
    getWeatherOnSearch().then(r => console.log("Sound"));
});

/**
 * Common calls between search with
 */
function playSound()
{
    gettingWeatherDetails().then(r => getHour()).then(updateUI).then(sound).catch((err) => console.log(err));
}

/**
 * Function used to update all ui functions about city and weather forecast and icon
 */
const updateUI = () => {
    weather = getCityHourForecast();
    //console.log(weather);

    //updating details into HTML
    textContent.innerHTML = `
    <h2 class="font-c">${currentCity.cityName.toUpperCase()}</h2>
    <h4 class="font-c">${"Lat: " + currentCity.latitude.toFixed(6)} </h4>
    <h4 class="font-c">${"Lon: " + currentCity.longitude.toFixed(6)} </h4>
    <h3 class="font-c">${weather.iconPhrase}</h3>    
    <h4 class="font-c">${"Temperature: " + weather.temperatureValue.toFixed(decimals)} &degC</h4>
    <h4 class="font-c">${"Humidity: " + weather.relativeHumidity.toFixed(decimals)} &percnt;</h4>
    <h4 class="font-c">${"Wind Speed: " + weather.windSpeed.toFixed(decimals) + " km/h"}</h4>
    <h4 class="font-c">${"Cloud Cover: " + weather.cloudCover.toFixed(decimals)} &percnt;</h4>
    <h4 class="font-c">${"Rain Probability: " + weather.rainProbability.toFixed(decimals)} &percnt;</h4>
    <h4 class="font-c">${"Rain: " + weather.rainValue.toFixed(decimals) + " mm"}</h4>
    <h4 class="font-c">${"Snow Probability: " + weather.snowProbability.toFixed(decimals)} &percnt;</h4>
    <h4 class="font-c">${"Snow: " + weather.snowValue.toFixed(decimals) + " mm"} </h4>
  `;

    //updating image
    let imgSrc = "/data/WeatherIcons/" + weather.iconNumber + ".png";
    image.setAttribute("src", imgSrc);

    // zoom in
    const lat = ol.proj.fromLonLat([currentCity.latitude, currentCity.longitude])[1];// // -90 , 90
    const lon = ol.proj.fromLonLat([currentCity.latitude, currentCity.longitude])[0];//currentCity.longitude; // -180,180

    if (lon < -180 || lon > 180) {
        var Lon = Math.abs(lon + 180, 360) - 180;
    }
    if (lat < -90 || lat > 90) {
        var Lat = Math.abs(lat + 90, 180) - 90;
    }

    //zoomIn(Lat,Lon);
}

/**
 * Function for zoom in the map to the specific city
 */
function zoomIn(Lat , Lon)
{
    myview.animate({
        center: [Lat , Lon],
        duration: 1800,
        zoom: 6
    })
}

