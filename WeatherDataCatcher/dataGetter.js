/**
 * @Author Davide Lorenzi
 * This class is used to get weather forecast from AccuWeather using the website free (but limited) APIs
 * Tose information will be turned to the music generator
 */

const APIKey = 'b0G0rFd66TFZJFtg7Zc2zWFLtfszoQ1G';
const inchToMm = 25.4; //1 inch = 25.4 mm
const mileToKm = 1.60934; //1 mile = 1.60934 Km
const FToC = 5/9; //conversion for Farenheit to Celsius

//constant variable limits
const maxWind = 100;
const flatValue = 0;
const maxPercentage = 100;
const maxTemperature = 40;
const minTemperature = -10;
const maxRain = 15;
const maxSnow = 5000; //mm of snow

var lat;
var lon;
var cities = []; //array of city coordinates and data
var citiesForecast = []; //array of city coordinates and data
var valueConstraints = [];


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
        this.rainValue = rainV;                     //double	Rounded value in specified units. May be NULL.
        this.snowProbability = snowP;               //int32  	Percent representing the probability of snow. May be NULL.
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

class forecastData
{
    constructor(max, min, name)
    {
        this.valueName = name;
        this.maxValue = max;
        this.minValue = min;
    }
}

var currentCity = new city();
var currentCityForecast = []; //array of forecast of 12 hours


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
 * This function return constraint values for variables
 * @returns {*[]} an array of object with values
 */
function getDataConstraints()
{
    //if no constraints already set, define it
    if (valueConstraints.length === 0) populateValuesConstraints();
    return valueConstraints;
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
        if (hourWeather.Temperature.Value === null)
            tmpHourForecast.temperatureValue = 0;
        else
        {
            if (hourWeather.Temperature.Unit === "F")
                tmpHourForecast.temperatureValue = temperatureConverter(hourWeather.Temperature.Value);
            else tmpHourForecast.temperatureValue = Temperature.Value;
            //temperature
            if (tmpHourForecast.temperatureValue >= maxTemperature)
            {
                tmpHourForecast.temperatureValue = maxTemperature
            }   //double	Rounded value in specified units. May be NULL.;
            else if (tmpHourForecast.temperatureValue < minTemperature)
                tmpHourForecast.temperatureValue = minTemperature;
        }

        //wind
        if (fullForecast.Wind.Speed.Value === null)
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

        currentCityForecast.push(tmpHourForecast);
    })
    citiesForecast.push(currentCityForecast)
}

/**
 * Resets current city value
 */
function currentCityCleaner()
{
    currentCity.cityCode = 0;
    currentCity.cityName = null;
    currentCity.longitude = 0;
    currentCity.latitude = 0;
}

function tmpForecastCleaner(tmpStructure)
{
    tmpStructure.name = null;
    tmpStructure.maxValue = 0;
    tmpStructure.minValue = 0;
}

function populateValuesConstraints()
{
    let tmpForecastData = new forecastData();

    //percentage (probabilities and relative humidity values) cloud cover
    tmpForecastData.valueName = "Percentage";
    tmpForecastData.maxValue = maxPercentage;
    tmpForecastData.minValue = flatValue;

    valueConstraints.push(tmpForecastData);
    tmpForecastCleaner(tmpForecastData);

    //temperature
    tmpForecastData.valueName = "Temperature";
    tmpForecastData.maxValue = maxTemperature;
    tmpForecastData.minValue = minTemperature;

    valueConstraints.push(tmpForecastData);
    tmpForecastCleaner(tmpForecastData);

    //windSpeed
    tmpForecastData.valueName = "Wind";
    tmpForecastData.maxValue = maxWind;
    tmpForecastData.minValue = flatValue;

    valueConstraints.push(tmpForecastData);
    tmpForecastCleaner(tmpForecastData);

    //rain
    tmpForecastData.valueName = "Rain";
    tmpForecastData.maxValue = maxRain;
    tmpForecastData.minValue = flatValue;

    valueConstraints.push(tmpForecastData);
    tmpForecastCleaner(tmpForecastData);

    //snow
    tmpForecastData.valueName = "Snow";
    tmpForecastData.maxValue = maxSnow;
    tmpForecastData.minValue = flatValue;

    valueConstraints.push(tmpForecastData);
    tmpForecastCleaner(tmpForecastData);
}

/**
 * Used to retrieve the forecast of a specific hour of a specific city
 * @requires city forecast already retrieved from internet
 * @param cityCode is the city code used for search the city
 * @param hour is the hour [0-11] of forecast we will read
 * @param normalize boolean, if true are returned normalized data
 * @returns {weatherForecast} all features of an hour weather forecast
 */
function getCityHourForecast(cityCode, hour, normalize)
{
    let hourlyWeatherForecast = new weatherForecast();

    hourlyWeatherForecast.cityCode = cities[cityCode].cityCode;                      //string  city name used for search.
    hourlyWeatherForecast.iconNumber = cities[cityCode].iconNumber;               //int32	Numeric value representing an image that displays the current condition described by WeatherText. May be NULL.
    hourlyWeatherForecast.iconPhrase = cities[cityCode].iconPhrase;               //string	Phrase description of the forecast associated with the WeatherIcon.
    hourlyWeatherForecast.temperatureValue = cities[cityCode].temperatureValue;       //double	Rounded value in specified units. May be NULL.
    hourlyWeatherForecast.windSpeed = cities[cityCode].windSpeed;                     //double	Rounded value in specified units. May be NULL.
    hourlyWeatherForecast.relativeHumidity = cities[cityCode].relativeHumidity;             //int32	Relative humidity. May be NULL.
    hourlyWeatherForecast.rainProbability = cities[cityCode].rainProbability;               //int32	Percent representing the probability of rain. May be NULL.
    hourlyWeatherForecast.rainValue = cities[cityCode].rainValue;                     //double	Rounded value in specified units. May be NULL.
    hourlyWeatherForecast.snowProbability = cities[cityCode].snowProbability;               //int32	Percent representing the probability of snow. May be NULL.
    hourlyWeatherForecast.snowValue = cities[cityCode].snowValue;                     //double	Rounded value in specified units. May be NULL.
    hourlyWeatherForecast.cloudCover = cities[cityCode].cloudCover;

    if (normalize)
    {
        return dataNormalizer(hourlyWeatherForecast)
    }
    else
    {
        return hourlyWeatherForecast;
    }
}

/**
 * This function get the city key given the name, Milan
 * I can't optimize avoiding queries because a mm move of click can change the city
 * @returns {Promise<void>} populates the current city
 */
const getCityByName = async () =>
{
    const locationBaseUrl = "http://dataservice.accuweather.com/locations/v1/cities/search";
    const cityName = currentCity.cityName;
    const query = `?apikey=${APIKey}&q=${cityName}`;

    const res = await fetch(locationBaseUrl + query);
    const tmpCity = await res.json()

    //fill our city info
    currentCity.cityCode = tmpCity[0]['Key'];
    //unused in further development ATM
    currentCity.latitude = tmpCity[0].GeoPosition['Latitude'];
    currentCity.longitude = tmpCity[0].GeoPosition['Longitude'];
    cities.push(currentCity);
}

/**
 * This function get the city key given coordinates, eg 45.730396, 9.5259203
 * I can't optimize avoiding queries because a mm move of click can change the city
 * @returns {Promise<void>} populates the current city
 */
const getCityByCoordinates = async () =>
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

