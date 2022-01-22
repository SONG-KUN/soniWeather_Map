/**
 * @Author Davide Lorenzi
 * This class is used to get weather forecast from AccuWeather using the website free (but limited) APIs
 * Tose information will be turned to the music generator
 */

const APIKey = 'b0G0rFd66TFZJFtg7Zc2zWFLtfszoQ1G';
const inchToMm = 25.4; //1 inch = 25.4 mm
const mileToKm = 1.60934; //1 mile = 1.60934 Km
const FToC = 5/9; //conversion for Farenheit to Celsius

var lat;
var lon;
var cities = []; //array of city coordinates and data
var citiesForecast = []; //array of city coordinates and data

//basic weather struct
class weatherForecast
{
    constructor(cityC, dateTime, iconNumber, iconPhrase, temperatureV, windS, relHum, rainP, rainV, snowP, snowV, cloudC)
    {
        this.cityCode = cityC;                      //string  city name used for search.
        this.iconNumber = iconNumber;               //int32	Numeric value representing an image that displays the current condition described by WeatherText. May be NULL.
        this.iconPhrase = iconPhrase;               //string	Phrase description of the forecast associated with the WeatherIcon.
        this.temperatureValue = temperatureV;       //double	Rounded value in specified units. May be NULL.
        this.windSpeed = windS;                     //double	Rounded value in specified units. May be NULL.
        this.relativeHumidity = relHum;             //int32	Relative humidity. May be NULL.
        this.rainProbability = rainP;               //int32	Percent representing the probability of rain. May be NULL.
        this.rainValue = rainV;                     //double	Rounded value in specified units. May be NULL.
        this.snowProbability = snowP;               //int32	Percent representing the probability of snow. May be NULL.
        this.snowValue = snowV;                     //double	Rounded value in specified units. May be NULL.
        this.cloudCover = cloudC;                   //int32	Number representing the percentage of the sky that is covered by clouds. May be NULL.
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
 * Conversion from Farenheit to Celsious (degree °F - 32) × 5/9 = 0 °C
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

function addNewForecast(fullForecast)
{
    fullForecast.forEach((hourWeather) =>
    {
        let tmpHourForecast = new weatherForecast();

        tmpHourForecast.cityCode = currentCity.cityCode;

        if (hourWeather.WeatherIcon === null)
        {
            tmpHourForecast.iconNumber = 33;
            tmpHourForecast.iconPhrase = "Clear";
        }
        else
        {
            tmpHourForecast.iconNumber = hourWeather.WeatherIcon;
            tmpHourForecast.iconPhrase = hourWeather.IconPhrase;
        }

        //temperature conversion if needed
        if (hourWeather.Temperature.Value === null) tmpHourForecast.temperatureValue = 0;
        else
        {
            if (hourWeather.Temperature.Unit === "F") tmpHourForecast.temperatureValue = temperatureConverter(hourWeather.Temperature.Value);
            else tmpHourForecast.temperatureValue = Temperature.Value;
        }

        //wind conversion if needed
        if (fullForecast.Wind.Speed.Value === null) tmpHourForecast.windSpeed = 0;
        else
        {
            if (hourWeather.Wind.Speed.Unit === "mi/h") tmpHourForecast.windSpeed = mileToKmConverter(hourWeather.Wind.Speed.Value);
            else tmpHourForecast.windSpeed = fullForecast.Wind.Speed.Value;
        }

        if (hourWeather.RelativeHumidity === null) tmpHourForecast.relativeHumidity = 0;
        else tmpHourForecast.relativeHumidity = hourWeather.RelativeHumidity;

        if (hourWeather.RainProbability === null) tmpHourForecast.rainProbability = 0;
        else tmpHourForecast.rainProbability = hourWeather.RainProbability;

        //rain conversion if needed
        if (hourWeather.Rain.Value === null) tmpHourForecast.rainValue = 0;
        else
        {
            if (hourWeather.Rain.Unit === "in") tmpHourForecast.rainValue = incToMmConverter(hourWeather.Rain.Value);
            else tmpHourForecast.rainValue = hourWeather.Rain.Value;
        }

        if (hourWeather.SnowProbability === null) tmpHourForecast.snowProbability = 0;
        else tmpHourForecast.snowProbability = hourWeather.SnowProbability;

        //snow conversion if needed
        if (hourWeather.Snow.Value === null) tmpHourForecast.snowValue = 0;
        else
        {
            if (hourWeather.Snow.Unit === "in") tmpHourForecast.snowValue = incToMmConverter(hourWeather.Snow.Value);
            else tmpHourForecast.snowValue = hourWeather.Snow.Value;
        }

        if (hourWeather.CloudCover === null) tmpHourForecast.cloudCover = 0;
        else tmpHourForecast.cloudCover = hourWeather.CloudCover;

        currentCityForecast.push(tmpHourForecast);
    })
    citiesForecast.push(currentCityForecast)
}

function currentCityCleaner()
{
    currentCity.cityCode = 0;
    currentCity.cityName = null;
    currentCity.longitude = 0;
    currentCity.latitude = 0;
}

/**
 * This function get the city key given coordinates, eg 45.730396, 9.5259203
 * I can't optimize avoiding queries because a mm move of click can change the city
 * @returns {Promise<void>} populates the current city
 */
const getCity = async () =>
{
    const locationBaseUrl = "http://dataservice.accuweather.com/locations/v1/cities/geoposition/search";
    const cityCoordinates = currentCity.latitude.toString() + ',' + currentCity.longitude.toString();
    const query = `?apikey=${APIKey}&q=${cityCoordinates}`;

    const res = await fetch(locationBaseUrl + query);
    const tmpCity = await res.json()

    //fill our city info
    currentCity.cityName = tmpCity[0]['LocalizedName'];
    currentCity.cityCode = tmpCity[0]['Key'];
    cities.push(currentCity);
}

/**
 * Function used for populating current city forecast
 * @returns {Promise<void>} the get of new city forecast or the get from saved cities of needed infos.
 */
const gettingWeatherDetails = async() =>
{
    currentCityForecast = []; //clean the array

    //look if already downloaded
    let found = citiesForecast.findIndex(tmpCity => tmpCity.cityCode = currentCity.cityCode);

    //if city is not present
    if (found === -1)
    {
        const weatherBaseUrl = "http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/";
        const query = `${currentCity.cityCode}?apikey=${APIKey}`;
        const details = "&details=true"; //needed for get full datas

        const res = await fetch(weatherBaseUrl + query + details);
        const fullWeather = await res.json();

        addNewForecast(fullWeather);
    }
    else
    {
        /*
         * We don't refresh data of a city if not fresh because of the limit of the query we have
         * We also assume that we don't leave the app open for more than a day, so weather forecast are unchanged in that
         * time
         */
        currentCityForecast = citiesForecast[found];
    }
    currentCityCleaner();
}