/**
 * Sound generator
 */

var intervalWind = -1;
var intervalSky = -1;
var intervalRain = -1;

function sound() {

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
   const soundWeather = getCityHourForecast(hour);
   console.log("weather param", soundWeather);

    let wind = soundWeather.windSpeed;
    wind = scale(wind, 0, constraints.prototype.maxWind, 0, 100);
    console.log("----wind-----", wind);

    let rain = soundWeather.rainValue;
    rain = scale(rain, 0, constraints.prototype.maxRain, 0, 0.01);

    let snow = soundWeather.snowValue;
    snow = scale(snow, 0, constraints.prototype.maxSnow, 0, 100);

    let temperature = soundWeather.temperatureValue;
    temperature = scale(temperature, constraints.prototype.minTemperature, constraints.prototype.maxTemperature, 0, 100);

    //all %
    const humidity =soundWeather.relativeHumidity;
    const cloud = soundWeather.cloudCover;
    const rainProb = soundWeather.rainProbability;

    // duration of the entire event (maybe 1 min?)
    let totalDuration = 20;      //secs
    const c = new AudioContext();
    const startTime = c.currentTime;

    //initial counter
    let skyCounter = 0;
    let rainCounter = 0;
    let windCounter = 0;

    intervalWind = setInterval(playWind, windCounter, wind)
    intervalRain = setInterval(playRain, rainCounter, rain)
    intervalSky = setInterval(playSky, skyCounter, cloud, humidity, temperature);

    /**
     * Cloud sound generator
     * @param cloud cloud cover value
     * @param humidity humidity% value
     * @param temperature temperature value
     */
    function playSky (cloud, humidity, temperature) {

        //clear interval and creat new one
        clearInterval(intervalSky);
        //time for another call = duration of the actual one
        skyCounter = randomNumber(1000, 4000);
        intervalSky  = setInterval(playSky,  skyCounter, cloud)
        const now = c.currentTime;

        //3 oscillator --> triad chord
        const o1 = c.createOscillator();
        const o2 = c.createOscillator();
        const o3 = c.createOscillator();
        o1.type = "sawtooth";
        o2.type = "sawtooth";
        o3.type = "sawtooth";

        // VIBRATO SECTION
        const vib = c.createOscillator();
        const gainVib = c.createGain();
        vib.frequency.value = scale(humidity, 0, 100, 0, 15);
        gainVib.gain.value = scale(humidity, 0, 100, 0, 10);

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
        const dur = (skyCounter/1000) * 1.8;
        const att = dur/4;
        const dec = dur/4;

        const maxAmp = 0.01;

        /*
        choose one chord in the list depending on the cloud covering:
        CONSONANT --> clear
        DISSONANT --> cloud
        more the cloud more the probability of having dissonance
        */
        const rootNote = Math.floor(scale(temperature, 0, 100, 48, 72));
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

        //setting envelope
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(maxAmp, now+att);
        g.gain.linearRampToValueAtTime(maxAmp, now + dur - dec);
        g.gain.linearRampToValueAtTime(0, now + dur);

        vib.connect(gainVib).connect(o1.detune);
        vib.connect(gainVib).connect(o2.detune);
        vib.connect(gainVib).connect(o3.detune);

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
    function playRain (rain) {

        //clear interval and creat new one
        clearInterval(intervalRain);
        //time for another call = duration of the actual one
        rainCounter = randomNumber(100, 500);
        intervalRain  = setInterval(playRain,  rainCounter, rain)

        const now = c.currentTime;
        const o1 = c.createOscillator()
        const o2 = c.createOscillator()
        const o3 = c.createOscillator()
        const g = c.createGain();

        const gNoise1 = c.createGain();
        const gNoise2 = c.createGain();

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

        //FILTER SECTION
        const lpf = c.createBiquadFilter();
        lpf.frequency.value = 500;

        //WAVE SHAPER
        const clip = c.createWaveShaper();
        clip.curve = new Float32Array([-1, 1]);

        //const dur = randomNumber(0.1,0.1);
        const dur = randomNumber(50, 200) / 1000;
        const att = dur/3;
        const dec = dur/3;

        o1.frequency.value = randomNumber(300, 500)
        o2.frequency.value = randomNumber(300, 500)
        o3.frequency.value = randomNumber(300, 500)

        o1.type = "sine"
        o2.type = "sine"
        o3.type = "sine"

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.1, now+att);
        g.gain.linearRampToValueAtTime(0.1, now + dur - dec);
        g.gain.linearRampToValueAtTime(0, now + dur);

        //sum of oscillator
        o1.connect(g);
        o2.connect(g);
        o3.connect(g);
        g.connect(c.destination);

        gNoise2.gain.value = rain;
        //TO DO link weather parameter (mm of rain to the soundscape)
        //pink noise multiply white noise
        whiteNoise.connect(lpf).connect(gNoise1.gain);
        //result is clipped (waveshaper)
        whiteNoise.connect(gNoise1).connect(clip).connect(gNoise2).connect(c.destination);

        /*
        o1.start(now);
        o1.stop(now+dur);
        o2.start(now);
        o2.stop(now+dur);
        o3.start(now);
        o3.stop(now+dur);
         */
        whiteNoise.start(now);

        if (c.currentTime - startTime > totalDuration)
        {
            clearInterval(intervalRain)
        }
    }

    /**
     * Function generator for wind sound
     * @param wind forecast wind value
     */
    function playWind (wind) {

        //clear interval and creat new one
        clearInterval(intervalWind);
        //time for another call = duration of the actual one
        windCounter = randomNumber(8000, 12000);
        intervalWind  = setInterval(playWind,  windCounter, wind)
        //play with a certain probability according the wind quantity
        let delayTime;
        if (randomNumber(0, 100) < wind) {

            const now = c.currentTime;

            //DELAY SECTION
            const delay = c.createDelay(5.0);
            const delayTime = randomNumber(10, 30) / 10;
            delay.delayTime.value = delayTime;

            //wind event has a random duration
            const eventDur = randomNumber(10, 100) / 10;
            const att = eventDur / 10;
            const dec = eventDur / 5;

            const ampGain = c.createGain();
            const delayGain = c.createGain()

            //LFO SECTION
            const lfo = c.createOscillator();
            lfo.type = "triangle";
            lfo.frequency.value = randomNumber(1, 10);

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
            ampGain.gain.linearRampToValueAtTime(1, now + att);
            ampGain.gain.linearRampToValueAtTime(1, now + eventDur - dec);
            ampGain.gain.linearRampToValueAtTime(0, now + eventDur);

            delayGain.gain.setValueAtTime(0, now+delayTime);
            delayGain.gain.linearRampToValueAtTime(0.5, now + att + delayTime);
            delayGain.gain.linearRampToValueAtTime(0.5, now + eventDur + delayTime - dec);
            delayGain.gain.linearRampToValueAtTime(0, now + eventDur + delayTime);

            //CONNECTION
            lfo.connect(ampGain.gain);
            //modGain.connect(ampGain);
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
function scale (number, inMin, inMax, outMin, outMax) {
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