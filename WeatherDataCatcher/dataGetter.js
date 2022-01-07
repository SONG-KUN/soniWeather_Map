//this class is used to get data from accuweather and push it on a JSON...

/*
  we store data into a big JSON at least at the beginning.
  in this way we can do a search in city/region name BEFORE do a get at accu weather, like a proxy server
  if needed we will implement firebase exchange, but is pretty unusefull here...do a get just for...
TODO list: 2 - implement data get and push it to an array
           3 - transfer body of populate JSONWeatherForecast in body of get and populate array of obj
           4 - check if this array of obj is possible to create a map of [n][12], or if is already a json
           5 - find the way to store all city we click in a JSON to use as proxy
 */

//following this tutorial https://www.youtube.com/watch?v=D6EzSmVh3ko

const APIKey = 'b0G0rFd66TFZJFtg7Zc2zWFLtfszoQ1G';

class weatherForecast
{
    constructor(cityC, dateTime, iconNumber, iconPhrase, temperatureV, windS, relHum, rainP, rainV, snowP, snowV, cloudC)
    {
        this.cityCode = cityC;                       //string  city name used for search.
        this.dateTime = dateTime;                   //string	DateTime of the forecast, displayed in ISO8601 format.
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

const gettingWeatherDetails = async(weatherForecast) =>
{
    const weatherBaseUrl = "http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/";
    const query = `${id}?apikey=${APIKey}`;

    const res = await fetch(weatherBaseUrl + query);
    const data = await res.json();

    //we can execute the body of populateJSONWeatherForecast body directly from here, jumping weatherForecast struct
    //TODO: implement data get, remove redundant struct and rename JSONWeatherForecast to weatherForecast and save and array of these
    //for etc

}

/**
 * This function get the city key given coordinates, eg 45.730396, 9.525920
 * @param cityInfos struct containing all city infos
 * @returns {Promise<void>} fill the struct
 */
const getCity = async (cityInfos) =>
{
    const locationBaseUrl = "http://dataservice.accuweather.com/locations/v1/cities/geoposition/search";
    const cityCoordinates = cityInfos.latitude.toString() + ',' + cityInfos.longitude.toString();
    const query = `?apikey=${APIKey}&q=${cityCoordinates}`;

    const res = await fetch(locationBaseUrl + query);
    const data = await res.json()

    //fill our city info
    cityInfos.cityName = data[0]['LocalizedName'];
    cityInfos.cityCode = data[0]['Key'];
}

//conversion constants
const inchToMm = 25.4; //1 inch = 25.4 mm
const mileToKm = 1.60934; //1 mile = 1.60934 Km
const FToC = 5/9; //conversion for Farenheit to Celsius


var lat;
var lon;
var forecast = [12]; //array of forecast of 12 hours
var cities = [];




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

//filling single hour mes
//TODO: create an array of 12 jsonWeatherForecast to use for the temporary computation, maybe is better a pair key value

//1 - initialize and populate both structs X 12 times
//is also done null value control and fix
//maybe i can avoid support beginning struct

//TODO implement this function directly in get function, get everything a lot faster.
/**
 * This function generates an array of "struct" of weather
 * @param fullForecast is the JSON coming from the website
 * @param weatherForecast is the filtered JSON we will use
 * @param city main data of the city
 */
function populateJSONWeatherForecast(fullForecast, weatherForecast, city)
{
    //for 12 times, 1 per hour of forecast

    weatherForecast.cityCode = city.cityCode;
    weatherForecast.dateTime = fullForecast.dateTime;

    if (fullForecast.iconNumber === null)
    {
        weatherForecast.iconNumber = 33;
        weatherForecast.iconPhrase = "Clear";
    }
    else
    {
        weatherForecast.iconNumber = fullForecast.iconNumber;
        weatherForecast.iconPhrase = fullForecast.iconPhrase;
    }


    //temperature conversion if needed
    if (fullForecast.temperatureValue === null) weatherForecast.temperatureValue = 0;
    else
    {
        if (fullForecast.temperatureUnit === "F") weatherForecast.temperatureValue = temperatureConverter(fullForecast.temperatureValue);
        else weatherForecast.temperatureValue = fullForecast.temperatureValue;
    }

    //wind conversion if needed
    if (fullForecast.windSpeed === null) weatherForecast.windSpeed = 0;
    else
    {
        if (fullForecast.windUnit === "mi/h") weatherForecast.windSpeed = mileToKmConverter(fullForecast.windSpeed);
        else weatherForecast.windSpeed = fullForecast.windSpeed;
    }

    if (fullForecast.relativeHumidity === null) weatherForecast.relativeHumidity = 0;
    else weatherForecast.relativeHumidity = fullForecast.relativeHumidity;

    if (fullForecast.rainProbability === null) weatherForecast.rainProbability = 0;
    else weatherForecast.rainProbability = fullForecast.rainProbability;

    //rain conversion if needed
    if (fullForecast.rainValue === null) weatherForecast.rainValue = 0;
    else
    {
        if (fullForecast.rainUnit === "in") weatherForecast.rainValue = incToMmConverter(fullForecast.rainValue);
        else weatherForecast.rainValue = fullForecast.rainValue;
    }

    if (fullForecast.snowProbability === null) weatherForecast.snowProbability = 0;
    else weatherForecast.snowProbability = fullForecast.snowProbability;

    //snow conversion if needed
    if (fullForecast.snowValue === null) weatherForecast.snowValue = 0;
    else
    {
        if (fullForecast.snowUnit === "in") weatherForecast.snowValue = incToMmConverter(fullForecast.snowValue);
        else weatherForecast.snowValue = fullForecast.snowValue;
    }

    if (fullForecast.cloudCover === null) weatherForecast.cloudCover = 0;
    else weatherForecast.cloudCover = fullForecast.cloudCover;
}
