//this class is used to get data from accuweather and push it on a JSON...

/*
  we store data into a big JSON at least at the beginning.
  in this way we can do a search in city/region name BEFORE do a get at accu weather, like a proxy server
  if needed we will implement firebase exchange, but is pretty unusefull here...do a get just for...
TODO list: 1 - end location key request
           2 - implement data get and push it to an array
           3 - transfer body of populate JSONWeatherForecast in body of get and populate array of obj
           4 - check if this array of obj is possible to create a map of [n][12], or if is already a json
           5 - find the way to store all city we click in a JSON to use as proxy
 */

//following this tutorial https://www.youtube.com/watch?v=D6EzSmVh3ko

const APIKey = 'b0G0rFd66TFZJFtg7Zc2zWFLtfszoQ1G';

const gettingWeatherDetails = async(idWeather) =>
{
    const weatherBaseUrl = "http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/";
    const query = `${id}?apikey=${APIKey}`;

    const res = await fetch(weatherBaseUrl + query);
    const data = await res.json();

    //we can execute the body of populateJSONWeatherForecast body directly from here, jumping weatherForecast struct
    //TODO: implement data get, remove redundant struct and rename JSONWeatherForecast to weatherForecast and save and array of these
}

/*
const getCity = await(cityWeather) =>
{
    const locationBaseUrl = "http://dataservice.accuweather.com/locations/v1/cities/geoposition/search";
    //const query

}*/

//conversion constants
const inchToMm = 25.4; //1 inch = 25.4 mm
const mileToKm = 1.60934; //1 mile = 1.60934 Km
const FToC = 5/9; //conversion for Farenheit to Celsius


var lat;
var lon;
var forecast = [12]; //array of forecast of 12 hours
var cities = [];

//we get lon lat from API, we need to invert them in get
class city
{
    constructor(id, cityC, city,lat, lon)
    {
        this.cityID = id;
        this.cityCode = cityC;
        this.cityName = city;
        this.latitude = lat;  // [-90.0 ; 90.0]
        this.longitude = lon; // [-180.0 ; 180.0]
    }
}

//main data
//many data will disappear in final JSON update after normalization
//TODO: deprecated struct, delete
class weatherForecast
{
    constructor(dateTime, iconNumber, iconPhrase, temperatureV, temperatureU, windS, windU, relHum, rainP, rainV, rainU, snowP, snowV, snowU, cloudC)
    {
        this.dateTime = dateTime;                   //string	DateTime of the forecast, displayed in ISO8601 format.
        this.iconNumber = iconNumber;               //int32	Numeric value representing an image that displays the current condition described by WeatherText. May be NULL.
        this.iconPhrase = iconPhrase;               //string	Phrase description of the forecast associated with the WeatherIcon.
        this.temperatureValue = temperatureV;       //double	Rounded value in specified units. May be NULL.
        this.temperatureUnit = temperatureU;        //string	Type of unit.
        this.windSpeed = windS;                     //double	Rounded value in specified units. May be NULL.
        this.windUnit = windU;                      //string	Type of unit.
        this.relativeHumidity = relHum;             //int32	Relative humidity. May be NULL.
        this.rainProbability = rainP;               //int32	Percent representing the probability of rain. May be NULL.
        this.rainValue = rainV;                     //double	Rounded value in specified units. May be NULL.
        this.rainUnit = rainU;                      //string	Type of unit.
        this.snowProbability = snowP;               //int32	Percent representing the probability of snow. May be NULL.
        this.snowValue = snowV;                     //double	Rounded value in specified units. May be NULL.
        this.snowUnit = snowU;                      //string	Type of unit.
        this.cloudCover = cloudC;                   //int32	Number representing the percentage of the sky that is covered by clouds. May be NULL.
    }
}

//TODO rename this struct
class jsonWeatherForecast
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

//data conversion to SI
//temperature conversion (degree °F - 32) × 5/9 = 0 °C, prior check if needed
function temperatureConverter(value)
{
    return (value - 32) * FToC;
}

//wind speed conversion
function speedConverter(value)
{
    return value * mileToKm;
}

//rain/snow  inc to mm
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
function populateJSONWeatherForecast(fullForecast, JSONForecast, city)
{
    //for 12 times, 1 per hour of forecast

    JSONForecast.cityCode = city.cityCode;
    JSONForecast.dateTime = fullForecast.dateTime;

    if (fullForecast.iconNumber === null)
    {
        JSONForecast.iconNumber = 33;
        JSONForecast.iconPhrase = "Clear";
    }
    else
    {
        JSONForecast.iconNumber = fullForecast.iconNumber;
        JSONForecast.iconPhrase = fullForecast.iconPhrase;
    }


    //temperature conversion if needed
    if (fullForecast.temperatureValue === null) JSONForecast.temperatureValue = 0;
    else
    {
        if (fullForecast.temperatureUnit === "F") JSONForecast.temperatureValue = temperatureConverter(fullForecast.temperatureValue);
        else JSONForecast.temperatureValue = fullForecast.temperatureValue;
    }

    //wind conversion if needed
    if (fullForecast.windSpeed === null) JSONForecast.windSpeed = 0;
    else
    {
        if (fullForecast.windUnit === "mi/h") JSONForecast.windSpeed = speedConverter(fullForecast.windSpeed);
        else JSONForecast.windSpeed = fullForecast.windSpeed;
    }

    if (fullForecast.relativeHumidity === null) JSONForecast.relativeHumidity = 0;
    else JSONForecast.relativeHumidity = fullForecast.relativeHumidity;

    if (fullForecast.rainProbability === null) JSONForecast.rainProbability = 0;
    else JSONForecast.rainProbability = fullForecast.rainProbability;

    //rain conversion if needed
    if (fullForecast.rainValue === null) JSONForecast.rainValue = 0;
    else
    {
        if (fullForecast.rainUnit === "in") JSONForecast.rainValue = incToMmConverter(fullForecast.rainValue);
        else JSONForecast.rainValue = fullForecast.rainValue;
    }

    if (fullForecast.snowProbability === null) JSONForecast.snowProbability = 0;
    else JSONForecast.snowProbability = fullForecast.snowProbability;

    //snow conversion if needed
    if (fullForecast.snowValue === null) JSONForecast.snowValue = 0;
    else
    {
        if (fullForecast.snowUnit === "in") JSONForecast.snowValue = incToMmConverter(fullForecast.snowValue);
        else JSONForecast.snowValue = fullForecast.snowValue;
    }

    if (fullForecast.cloudCover === null) JSONForecast.cloudCover = 0;
    else JSONForecast.cloudCover = fullForecast.cloudCover;
}
