/**
 * @Author Davide Lorenzi
 * This class is used to get weather forecast from AccuWeather using the website free (but limited) APIs
 * Information will be turned to the music generator
 */

var debug = 0; //debug variable used to

const inchToMm = 25.4; //1 inch = 25.4 mm
const mileToKm = 1.60934; //1 mile = 1.60934 Km
const FToC = 5/9; //conversion for Farenheit to Celsius

//constant variable limits

var cities = []; //array of city coordinates and data
var citiesForecast = {}; //map of city coordinates and data
const valueConstraints =
    [
        {
            "valueName" : "Percentage",
            "maxValue"  : maxPercentage,
            "minValue"  : flatValue
        },
        {
            "valueName" : "Temperature",
            "maxValue"  : maxTemperature,
            "minValue"  : minTemperature
        },
        {
            "valueName" : "Wind",
            "maxValue"  : maxWind,
            "minValue"  : flatValue
        },
        {
            "valueName" : "Rain",
            "maxValue"  : maxRain,
            "minValue"  : flatValue
        },
        {
            "valueName" : "Snow",
            "maxValue"  : maxSnow,
            "minValue"  : flatValue
        }
    ];


//basic weather struct
class weatherForecast
{
    constructor(cityC, dateTime, iconNumber, iconPhrase, temperatureV, windS, relHum, rainP, rainV, snowP, snowV, cloudC)
    {
        this.cityCode = cityC;                      //string    city name used for search.
        this.iconNumber = iconNumber;               //int32	    Numeric value representing an image that displays the current condition described by WeatherText. May be NULL.
        this.iconPhrase = iconPhrase;               //string	Phrase description of the forecast associated with the WeatherIcon.
        this.temperatureValue = temperatureV;       //double	Rounded value in specified units. May be NULL.
        this.windSpeed = windS;                     //double	Rounded value in specified units. May be NULL.
        this.relativeHumidity = relHum;             //int32  	Relative humidity. May be NULL.
        this.rainProbability = rainP;               //int32	    Percent representing the probability of rain. May be NULL.
        this.snowProbability = snowP;               //int32  	Percent representing the probability of snow. May be NULL.
        this.rainValue = rainV;                     //double	Rounded value in specified units. May be NULL.
        this.snowValue = snowV;                     //double	Rounded value in specified units. May be NULL.
        this.cloudCover = cloudC;                   //int32 	Number representing the percentage of the sky that is covered by clouds. May be NULL.
    }
}

//we get lon lat from API, we need to invert them in get
class city
{
    constructor(cityC, cityN, lat, lon)
    {
        this.cityCode = cityC;
        this.cityName = cityN;
        this.latitude = lat;  // [-90.0 ; 90.0]
        this.longitude = lon; // [-180.0 ; 180.0]
    }
}
var currentCity = new city();
var currentCityForecast = []; //array of forecast of 12 hours

/**
 * Gets an API key for gets from AccuWeather
 * @returns {string} a random API between ones available
 */
function getAPIKey()
{
    let index = Math.floor(Math.random() * APIKeys.length);
    return APIKeys[index];
}

/**
 * Conversion from Farenheit to Celsius (degree °F - 32) × 5/9 = 0 °C
 * @param value
 * @returns {number}
 */
function temperatureConverter(value)
{
    return (value - 32) * FToC;
}

/**
 * Conversion of Mile to Km
 * @param value number of mile
 * @returns {number} value in km
 */
function mileToKmConverter(value)
{
    return value * mileToKm;
}

/**
 * Conversion from inc to mm
 * @param value value of inc of something
 * @returns {number} value in mm
 */
function incToMmConverter(value)
{
    return value * inchToMm;
}

/**
 * This function generates an array of "struct" of weather
 * @param fullForecast is the JSON coming from the website
 */

/**
 * Resets current city value
 */
function cleanCurrentCity()
{
    currentCity.cityCode = 0;
    currentCity.cityName = null;
    currentCity.longitude = 0;
    currentCity.latitude = 0;
}

/**
 * This function parses the JSON response coming from API into a 12hour data structure
 * @param fullForecast
 */
function addNewForecast(fullForecast)
{
    //console.log("CONSTRAINTS IN DATA GETTER:", maxPercentage,maxRain,maxRain,maxSnow,maxTemperature,minTemperature,flatValue);
    fullForecast.forEach((hourWeather) => {
        let tmpHourForecast = new weatherForecast();

        tmpHourForecast.cityCode = currentCity.cityCode;

        if (hourWeather.WeatherIcon === null) {
            tmpHourForecast.iconNumber = 33;
            tmpHourForecast.iconPhrase = "Clear";
        } else {
            tmpHourForecast.iconNumber = hourWeather.WeatherIcon;
            tmpHourForecast.iconPhrase = hourWeather.IconPhrase;
        }

        //temperature conversion if needed
        if (hourWeather.Temperature.Value === null)
            tmpHourForecast.temperatureValue = 0;
        else {
            if (hourWeather.Temperature.Unit === "F")
                tmpHourForecast.temperatureValue = temperatureConverter(hourWeather.Temperature.Value);
            else tmpHourForecast.temperatureValue = Temperature.Value;
            //temperature
            if (tmpHourForecast.temperatureValue >= maxTemperature) {
                tmpHourForecast.temperatureValue = maxTemperature
            }   //double	Rounded value in specified units. May be NULL.;
            else if (tmpHourForecast.temperatureValue < minTemperature)
                tmpHourForecast.temperatureValue = minTemperature;
        }

        //humidity
        if (hourWeather.RelativeHumidity === null) tmpHourForecast.relativeHumidity = 0;
        else tmpHourForecast.relativeHumidity = hourWeather.RelativeHumidity;

        //rain probability
        if (hourWeather.RainProbability === null) tmpHourForecast.rainProbability = 0;
        else tmpHourForecast.rainProbability = hourWeather.RainProbability;

        //rain conversion if needed
        if (hourWeather.Rain.Value === null) tmpHourForecast.rainValue = 0;
        else
        {
            if (hourWeather.Rain.Unit === "in")
                tmpHourForecast.rainValue = incToMmConverter(hourWeather.Rain.Value);
            else
                tmpHourForecast.rainValue = hourWeather.Rain.Value;

            if (tmpHourForecast.rainValue > maxRain)
                tmpHourForecast.rainValue = maxRain;
        }

        //snow probability
        if (hourWeather.SnowProbability === null)
            tmpHourForecast.snowProbability = 0;
        else
            tmpHourForecast.snowProbability = hourWeather.SnowProbability;

        //snow conversion if needed
        if (hourWeather.Snow.Value === null) tmpHourForecast.snowValue = 0;
        else
        {
            if (hourWeather.Snow.Unit === "in")
                tmpHourForecast.snowValue = incToMmConverter(hourWeather.Snow.Value);
            else
                tmpHourForecast.snowValue = hourWeather.Snow.Value;

            if (tmpHourForecast.snowValue > maxSnow)
                tmpHourForecast.snowValue = maxSnow;
        }

        //cloud cover
        if (hourWeather.CloudCover === null)
            tmpHourForecast.cloudCover = 0;
        else
            tmpHourForecast.cloudCover = hourWeather.CloudCover;

        //wind
        if (hourWeather.Wind.Speed.Value === null)
            tmpHourForecast.windSpeed = 0;
        else
        {
            if (hourWeather.Wind.Speed.Unit === "mi/h")
                tmpHourForecast.windSpeed = mileToKmConverter(hourWeather.Wind.Speed.Value);
            else
                tmpHourForecast.windSpeed = fullForecast.Wind.Speed.Value;

            if (tmpHourForecast.windSpeed > maxWind)
                tmpHourForecast.windSpeed = maxWind;
        }
        if (debug === 1)
        {
            console.log("HourForecast")
            console.log(tmpHourForecast);
        }
        currentCityForecast.push(tmpHourForecast);
    })
    // Array.prototype.push.apply(citiesForecast, currentCityForecast);
    citiesForecast[currentCityForecast[0].cityCode] = currentCityForecast;
    if (debug === 1)
    {
        console.log("CurrentCityForecast")
        console.log(currentCityForecast);
    }
}

/**
 * Used to retrieve the forecast of a specific hour of a specific city
 * @param hour is the hour [0-11] of forecast we will read
 * @returns {weatherForecast} all features of an hour weather forecast
 */
function getCityHourForecast()
{
    return currentCityForecast[hour];
}

/**
 * This function get the city key given the name, Milan
 * I can't optimize avoiding queries because a mm move of click can change the city
 * @returns {Promise<void>} populates the current city
 */
async function getCityByName()
{
    const locationBaseUrl = "http://dataservice.accuweather.com/locations/v1/cities/search";
    const cityName = currentCity.cityName;
    const currAPIKey = getAPIKey();
    const query = `?apikey=${currAPIKey}&q=${cityName}`;

    const res = await fetch(locationBaseUrl + query);
    const tmpCity = await res.json()

    if(debug === 1)
    {
        console.log("City by name\n");
        console.log(tmpCity);
    }

    const {GeoPosition, Key} = tmpCity[0];
    //fill our city info
    currentCity.cityCode = Key;
    //unused in further development ATM
    currentCity.latitude = GeoPosition.Latitude;
    currentCity.longitude = GeoPosition.Longitude;
    cities.push(currentCity);
    if (debug === 1) console.log(currentCity);
}

/**
 * This function get the city key given coordinates, eg 45.730396, 9.5259203
 * I can't optimize avoiding queries because a mm move of click can change the city
 * @returns {Promise<void>} populates the current city
 */
async function getCityByCoordinates ()
{
    const currAPIKey = getAPIKey();
    const locationBaseUrl = "http://dataservice.accuweather.com/locations/v1/cities/geoposition/search";
    const cityCoordinates = currentCity.latitude.toString() + ',' + currentCity.longitude.toString();
    const query = `?apikey=${currAPIKey}&q=${cityCoordinates}`;

    const res = await fetch(locationBaseUrl + query);
    const tmpCity = await res.json()
    if (debug === 1) console.log(tmpCity);
    const {LocalizedName, Key} = tmpCity;

    //fill our city info
    currentCity.cityName = LocalizedName;
    currentCity.cityCode = Key;
    cities.push(currentCity);
    if (debug === 1) console.log(currentCity);
}

/**
 * Function used for populating current city forecast
 * @returns {Promise<void>} the get of new city forecast or the get from saved cities of needed infos.
 */
async function gettingWeatherDetails()
{
    console.log("gettingWeatherDetails invoked");
    currentCityForecast = []; //clean the array
    const currAPIKey = getAPIKey();

    //look if already downloaded
    //if not working use getCityHourForecast
    //let found = citiesForecast.findIndex(tmpCity => tmpCity.cityCode = currentCity.cityCode);

    //if city is not present
    if (!(currentCity.cityCode in citiesForecast))
    {
        const weatherBaseUrl = "http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/";
        const query = `${currentCity.cityCode}?apikey=${currAPIKey}`;
        const details = "&details=true"; //needed for get full datas

        const res = await fetch(weatherBaseUrl + query + details);
        const fullWeather = await res.json();
        if(debug === 1) console.log(fullWeather);
        console.log("city not found, adding new forecast");
        addNewForecast(fullWeather);
    }
    else
    {
        /*
         * We don't refresh data of a city if not fresh because of the limit of the query we have
         * We also assume that we don't leave the app open for more than a day, so weather forecast are unchanged in that
         * time
         * Returns 12 hours forecast
         */
        currentCityForecast = citiesForecast[currentCity.cityCode];
        console.log("city found, overriding array...", currentCityForecast);
    }
}