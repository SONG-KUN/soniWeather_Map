//this class is used to get data from accuweather and push it on a JSON...

/*
1 we need to use the Locations API to get the locations Key
2 we can call the desired retrive function to get  dayly, hourly weather forecast, obtaining a full object
we must do 2 data request.
3 data normalization: we need to normalize data in order to have all in SI unit
4 we store data into a big JSON, think is idiot, slow and redundant get data to and from firebase. at least at the beginning.
  in this way we can do a search in city/region name BEFORE do a get at accu weather, like a proxy server
  if needed we will implement firebase exchange, but is pretty unusefull here...do a get just for...

 */

const APIKey = 'b0G0rFd66TFZJFtg7Zc2zWFLtfszoQ1G';
var cityKey;
var lat;
var lon;

//main data
//many data will disappear in final JSON update after normalization
class weatherForecast
{
    constructor(city, cityC, dateTime, iconNumber, iconPhrase, temperatureV, temperatureU, windS, windU, relHum, rainP, rainV, rainU, snowP, snowV, snowU, cloudC)
    {
        this.cityName = city;                       //string  city name used for search.
        this.cityCode = cityC;                      //string  city code to avoid errors in retriving infos.
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