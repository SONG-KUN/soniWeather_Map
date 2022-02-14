/**
 * Sound generator
 * @author Nicolò Pisanu
 */

var intervalWind = -1;
var intervalSky = -1;
var intervalRain = -1;

function sound() {
    //console.log("CONSTRAINTS IN SOUND:", maxPercentage, maxRain, maxRain, maxSnow, maxTemperature, minTemperature, flatValue);

    console.log("sound() invoked");

    if (intervalWind !== -1) {
        console.log("clearing windInterval...");
        clearInterval(intervalWind);
    }
    if (intervalRain !== -1) {
        console.log("clearing rainInterval...");
        clearInterval(intervalRain);
    }
    if (intervalSky !== -1) {
        console.log("clearing skyInterval...");
        clearInterval(intervalSky);
    }

    //RETRIEVE off WEATHER PARAMETERS - ALL VALUE SCALED in [0;100]
    const soundWeather = getCityHourForecast();

    let wind = soundWeather.windSpeed;
    wind = scale(wind, 0, maxWind, 0, 100);

    let rain = soundWeather.rainValue;
    rain = scale(rain, 0, maxRain, 0, 0.9);

    let snow = soundWeather.snowValue;
    snow = scale(snow, 0, maxSnow, 0, 100);

    let temperature = soundWeather.temperatureValue;
    temperature = scale(temperature, minTemperature, maxTemperature, 48, 84);

    let humidity = soundWeather.relativeHumidity;
    humidity = scale(humidity, 0, 100, 0, 10);

    const cloud = soundWeather.cloudCover;
    const rainProb = soundWeather.rainProbability;

    // duration of the entire event (maybe 1 min?)
    let totalDuration = 25;      //secs
    const c = new AudioContext();
    const startTime = c.currentTime;

    //initial counter
    let skyCounter = 0;
    let rainCounter = 0;
    let windCounter = 0;

    intervalWind = setInterval(playWind, windCounter, wind)
    intervalRain = setInterval(playRain, rainCounter, rain, rainProb)
    intervalSky = setInterval(playSky, skyCounter, cloud, humidity, temperature);

    /**
     * Cloud sound generator
     * @param cloud cloud cover value
     * @param humidity humidity% value
     * @param temperature temperature value
     */
    function playSky(cloud, humidity, temperature)
    {
        //clear interval and creat new one
        clearInterval(intervalSky);
        //time for another call = duration of the actual one
        skyCounter = randomNumber(2000, 5000);
        intervalSky = setInterval(playSky, skyCounter, cloud, humidity, temperature);
        const now = c.currentTime;

        //3 oscillator --> triad chord
        const o1 = c.createOscillator();
        const o2 = c.createOscillator();
        const o3 = c.createOscillator();
        o1.type = "triangle";
        o2.type = "triangle";
        o3.type = "triangle";

        // VIBRATO SECTION
        const vib = c.createOscillator();
        const gainVib = c.createGain();
        vib.frequency.value = Math.floor(humidity*2);
        gainVib.gain.value = humidity;

        const g = c.createGain();

        //one panner for each osc --> different stereo positions
        //random panning each note
        const panner1 = c.createStereoPanner();
        const panner2 = c.createStereoPanner();
        const panner3 = c.createStereoPanner();
        panner1.pan.value = randomNumber(-10,10)/10;
        panner2.pan.value = randomNumber(-10,10)/10;
        panner3.pan.value = randomNumber(-10,10)/10;

        //DURATION PARAMETERS
        const dur = (skyCounter/1000) * 1.3;
        const att = dur/4;
        const dec = dur/4;

        const maxAmp = 0.01;

        /*
        choose one chord in the list depending on the cloud covering:
        CONSONANT --> clear
        DISSONANT --> cloud
        more the cloud more the probability of having dissonance
        */
        const rootNote = temperature;
        console.log(rootNote);

        let chord;
        const consonantChordList =
            Array
            (
                [0, 4, 7],
                [0, 5, 9],
                [0, 3, 8],
                [0, 5, 10],
                [0, 2, 7],
                [0, 2, 9],
                [0, 4, 5]
            );

        const dissonantChordList =
            Array(
                [0, 3, 7],
                [0, 5, 8],
                [0, 6, 9],
                [0, 6, 10],
                [0, 6, 11],
                [0, 1, 6],
                [0, 1, 11]
            );

        if (cloud < randomNumber(0,100))
        {
            //more CLEAR
            chord = consonantChordList[Math.floor(Math.random() * consonantChordList.length)];
        }
        else
        {
            //more CLOUDY
            chord = dissonantChordList[Math.floor(Math.random() * dissonantChordList.length)];
        }

        o1.frequency.value = noteToFreq(chord[0] + rootNote);
        o2.frequency.value = noteToFreq(chord[1] + rootNote);
        o3.frequency.value = noteToFreq(chord[2] + rootNote);

        console.log(o3.frequency.value, o2.frequency.value, o1.frequency.value);

        //setting envelope
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(maxAmp, now+att);
        g.gain.linearRampToValueAtTime(maxAmp, now + dur - dec);
        g.gain.linearRampToValueAtTime(0, now + dur);

        vib.connect(gainVib).connect(o1.frequency);
        vib.connect(gainVib).connect(o2.frequency);
        vib.connect(gainVib).connect(o3.frequency);

        //CONNECTION
        o1.connect(g).connect(panner1).connect(c.destination);
        o2.connect(g).connect(panner2).connect(c.destination);
        o3.connect(g).connect(panner3).connect(c.destination);

        o1.start(now);
        o2.start(now);
        o3.start(now);
        vib.start(now);

        o1.stop(now+dur);
        o2.stop(now+dur);
        o3.stop(now+dur);
        vib.stop(now+dur);

        if (c.currentTime - startTime > totalDuration)
        {
            clearInterval(intervalSky)
        }
    }

    /**
     * Rain sound generator
     * @param rain forecast of rain
     */
    function playRain (rain, rainProb)
    {
        //clear interval and creat new one
        clearInterval(intervalRain);
        //time for another call = duration of the actual one
        rainCounter = randomNumber(100, 1000);
        intervalRain  = setInterval(playRain,  rainCounter, rain, rainProb)
        if (randomNumber(0, 100) < rainProb) {

            //DELAY SECTION
            const delay = c.createDelay(5.0);
            delay.delayTime.value = randomNumber(0, 100) / 100;

            const now = c.currentTime;
            const o1 = c.createOscillator()
            const o2 = c.createOscillator()
            const o3 = c.createOscillator()
            const g = c.createGain();

            const gFeedback = c.createGain();
            gFeedback.gain.value = rain;

            //const dur = randomNumber(0.1,0.1);
            const dur = randomNumber(100, 300) / 1000;

            o1.frequency.value = randomNumber(2000, 3000);
            o2.frequency.value = randomNumber(2000, 3000);
            o3.frequency.value = randomNumber(2000, 3000);

            //one panner for each osc --> different stereo positions
            //random panning each note
            const panner1 = c.createStereoPanner();
            const panner2 = c.createStereoPanner();
            const panner3 = c.createStereoPanner();
            panner1.pan.value = randomNumber(-10,10)/10;
            panner2.pan.value = randomNumber(-10,10)/10;
            panner3.pan.value = randomNumber(-10,10)/10;


            o1.type = "square"
            o2.type = "sawtooth"
            o3.type = "triangle"

            g.gain.setValueAtTime(0.02, now);
            g.gain.linearRampToValueAtTime(0, now + dur);

            //sum of oscillator
            o1.connect(panner1).connect(g);
            o2.connect(panner2).connect(g);
            o3.connect(panner3).connect(g);
            g.connect(c.destination);

            g.connect(delay).connect(c.destination);
            delay.connect(gFeedback).connect(delay);

            o1.start(now);
            o1.stop(now + dur+10);
            o2.start(now);
            o2.stop(now + dur+10);
            o3.start(now);
            o3.stop(now + dur+10);
        }

        if (c.currentTime - startTime > totalDuration) {
            clearInterval(intervalRain)
        }

    }

    /**
     * Function generator for wind sound
     * @param wind forecast wind value
     */
    function playWind(wind) {

        //clear interval and creat new one
        clearInterval(intervalWind);
        //time for another call = duration of the actual one
        windCounter = randomNumber(8000, 12000);
        intervalWind = setInterval(playWind, windCounter, wind)
        //play with a certain probability according the wind quantity
        if (randomNumber(0, 100) < wind) {

            const now = c.currentTime;

            //DELAY SECTION
            const delay = c.createDelay(5.0);
            delay.delayTime.value = randomNumber(10, 30) / 10;

            //wind event has a random duration
            const eventDur = randomNumber(10, 50) / 10;
            const att = eventDur / 10;
            const dec = eventDur / 3;

            const ampGain = c.createGain();
            const delayGain = c.createGain()

            //LFO SECTION
            const lfo = c.createOscillator();
            lfo.type = "triangle";
            lfo.frequency.value = randomNumber(1, 7);

            //FILTER SECTION
            const bpf = c.createBiquadFilter();
            bpf.type = "bandpass";
            bpf.Q.value = 50;
            const bpfStartFreq = randomNumber(200, 2000);
            const bpfStopFreq = randomNumber(200, 2000);
            bpf.frequency.setValueAtTime(bpfStartFreq, now);
            bpf.frequency.linearRampToValueAtTime(bpfStopFreq, now + eventDur);

            //PANNING SECTION
            const panner = c.createStereoPanner();
            const panStart = randomNumber(-10, 10) / 10;
            const panStop = randomNumber(-10, 10) / 10;
            panner.pan.setValueAtTime(panStart, now);
            panner.pan.linearRampToValueAtTime(panStop, now + eventDur);

            //NOISE SECTION
            const bufferSize = 2 * c.sampleRate,
                noiseBuffer = c.createBuffer(1, bufferSize, c.sampleRate),
                output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            let whiteNoise = c.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            //AMPLITUDE SECTION
            ampGain.gain.setValueAtTime(0, now);
            ampGain.gain.linearRampToValueAtTime(0.5, now + att);
            ampGain.gain.linearRampToValueAtTime(0.5, now + eventDur - dec);
            ampGain.gain.linearRampToValueAtTime(0, now + eventDur);

            delayGain.gain.setValueAtTime(0, now+delay.delayTime.value);
            delayGain.gain.linearRampToValueAtTime(0.2, now + att + delay.delayTime.value);
            delayGain.gain.linearRampToValueAtTime(0.2, now + eventDur + delay.delayTime.value - dec);
            delayGain.gain.linearRampToValueAtTime(0, now + eventDur + delay.delayTime.value);

            //CONNECTION
            lfo.connect(ampGain.gain);
            whiteNoise.connect(bpf).connect(panner).connect(ampGain).connect(c.destination);
            ampGain.connect(delay).connect(delayGain).connect(c.destination);

            whiteNoise.start(now);
            lfo.start(now);
            whiteNoise.stop(now + eventDur + delay.delayTime.value);
            lfo.stop(now + eventDur + delay.delayTime.value);
        }
        if (c.currentTime - startTime > totalDuration)
        {
            clearInterval(intervalWind)
        }
    }
}

//UTILITY
/**
 * scale value from one domain to another
 * @param number base number
 * @param inMin begin min value
 * @param inMax begin max value
 * @param outMin final min value
 * @param outMax final max value
 * @returns {*} the scale value
 */
function scale(number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

/**
 * Function to generate random number
 * @param min lower bound
 * @param max upper bound
 * @returns {number}
 */
function randomNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Convert midi to freq
 * @param midiNote midi note in input
 * @returns {number} the frequency note
 */
function noteToFreq(midiNote) {
    let a = 440; //standard frequency of A (common value is 440Hz)
    return (a / 32) * (2 ** ((midiNote - 9) / 12));
}