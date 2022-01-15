
/*
  we store data into a big JSON at least at the beginning.
  in this way we can do a search in city/region name BEFORE do a get at accu weather, like a proxy server
  if needed we will implement firebase exchange, but is pretty unusefull here...do a get just for... Pontida is 214046
TODO list: 2 - fix city management (instance of actual city? load form array of saved cities?
           4 - check if this array of obj is possible to create a map of [n][12], or if is already a json
           5 - find the way to store all city we click in a JSON to use as proxy
 */

//following this tutorial https://www.youtube.com/watch?v=D6EzSmVh3ko

const APIKey = 'b0G0rFd66TFZJFtg7Zc2zWFLtfszoQ1G';
const inchToMm = 25.4; //1 inch = 25.4 mm
const mileToKm = 1.60934; //1 mile = 1.60934 Km
const FToC = 5/9; //conversion for Farenheit to Celsius

var lat;
var lon;
var forecast = []; //array of forecast of 12 hours
var cities = [];

class weatherForecast
{
    constructor(cityC, dateTime, iconNumber, iconPhrase, temperatureV, windS, relHum, rainP, rainV, snowP, snowV, cloudC)
    {
        this.cityCode = cityC;                      //string  city name used for search.
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

var currentCity = new city();

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


//1 - initialize and populate both structs X 12 times
//is also done null value control and fix
//TODO verify if needed to define the object hour weather or if it assumes it exists

/**
 * This function generates an array of "struct" of weather
 * @param fullForecast is the JSON coming from the website
 * @param weatherForecast is the filtered JSON we will use
 * @param city main data of the city
 */
function populateJSONWeatherForecast(fullForecast, weatherForecast, city)
{
    fullForecast.forEach((hourWeather) =>
    {
        weatherForecast.cityCode = city.cityCode;
        weatherForecast.dateTime = hourWeather.DateTime;

        if (hourWeather.WeatherIcon === null)
        {
            weatherForecast.iconNumber = 33;
            weatherForecast.iconPhrase = "Clear";
        }
        else
        {
            weatherForecast.iconNumber = hourWeather.WeatherIcon;
            weatherForecast.iconPhrase = hourWeather.IconPhrase;
        }

        //temperature conversion if needed
        if (hourWeather.Temperature.Value === null) weatherForecast.temperatureValue = 0;
        else
        {
            if (hourWeather.Temperature.Unit === "F") weatherForecast.temperatureValue = temperatureConverter(hourWeather.Temperature.Value);
            else weatherForecast.temperatureValue = Temperature.Value;
        }

        //wind conversion if needed
        if (fullForecast.Wind.Speed.Value === null) weatherForecast.windSpeed = 0;
        else
        {
            if (hourWeather.Wind.Speed.Unit === "mi/h") weatherForecast.windSpeed = mileToKmConverter(hourWeather.Wind.Speed.Value);
            else weatherForecast.windSpeed = fullForecast.Wind.Speed.Value;
        }

        if (hourWeather.RelativeHumidity === null) weatherForecast.relativeHumidity = 0;
        else weatherForecast.relativeHumidity = hourWeather.RelativeHumidity;

        if (hourWeather.RainProbability === null) weatherForecast.rainProbability = 0;
        else weatherForecast.rainProbability = hourWeather.RainProbability;

        //rain conversion if needed
        if (hourWeather.Rain.Value === null) weatherForecast.rainValue = 0;
        else
        {
            if (hourWeather.Rain.Unit === "in") weatherForecast.rainValue = incToMmConverter(hourWeather.Rain.Value);
            else weatherForecast.rainValue = hourWeather.Rain.Value;
        }

        if (hourWeather.SnowProbability === null) weatherForecast.snowProbability = 0;
        else weatherForecast.snowProbability = hourWeather.SnowProbability;

        //snow conversion if needed
        if (hourWeather.Snow.Value === null) weatherForecast.snowValue = 0;
        else
        {
            if (hourWeather.Snow.Unit === "in") weatherForecast.snowValue = incToMmConverter(hourWeather.Snow.Value);
            else weatherForecast.snowValue = hourWeather.Snow.Value;
        }

        if (hourWeather.CloudCover === null) weatherForecast.cloudCover = 0;
        else weatherForecast.cloudCover = hourWeather.CloudCover;

        forecast.push(hourWeather)
    })
}
//TODO: fix city data management
/**
 * This function get the city key given coordinates, eg 45.730396, 9.525920
 * @param cityInfos struct containing all city infos
 * @returns {Promise<void>} fill the struct
 */
const getCity = async (cityInfos) =>
{
    const locationBaseUrl = "http://dataservice.accuweather.com/locations/v1/cities/geoposition/search";
    const cityCoordinates = currentCity.latitude.toString() + ',' + currentCity.longitude.toString();
    const query = `?apikey=${APIKey}&q=${cityCoordinates}`;

    const res = await fetch(locationBaseUrl + query);
    const data = await res.json()

    //fill our city info
    currentCity.cityName = data[0]['LocalizedName'];
    currentCity.cityCode = data[0]['Key'];
}

const gettingWeatherDetails = async(weatherForecast) =>
{
    const weatherBaseUrl = "http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/";
    const query = `${currentCity.cityCode}?apikey=${APIKey}`;
    const details = "&details=true";

    const res = await fetch(weatherBaseUrl + query);
    const data = await res.json();

    //we can execute the body of populateJSONWeatherForecast body directly from here, jumping weatherForecast struct
    //TODO: implement data get, remove redundant struct and rename JSONWeatherForecast to weatherForecast and save and array of these
    //for etc

}





