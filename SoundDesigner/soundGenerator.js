function sound(weatherParameters) {

    /*
    Weather parameters:
    - temperature
    - precipitation
    - humidity
    - wind          //range:
    - cloud cover

    ?- air quality
    ?- Main Condition: clear, cloudy, rainy

     */

    let wind = 100;

    //MAPPING:
    //lon to freq
    let freq = scale(weatherParameters[0], -180, 180, 100, 1000)
    //lat to duration
    let dur = scale(weatherParameters[1], -90, 90, 0.1, 1)

    // duration of the entire event (maybe 1 min?)
    let totalDuration = 60;      //secs
    let sequence = 5;
    const c = new AudioContext();
    const startTime = c.currentTime;

    // main sound function that lasts eventDur
    // in this function several functions are called: each function has its duration
    //for (var i = 0; i < sequence; i++) {
    //  playNote(freq, dur, dur*i);

    //}

    const intervalWind = setInterval(playWind, 10000, wind)

    function playWind (wind) {
        console.log("IN", c.currentTime)
        //play with a certain probability according the wind quantity
        if (randomNumber(0, 100) < wind)
        {
            //AGGIUNGERE DEC
            //CAPIRE MEGLIO LFO
            //CONTROLLARE FREQ LFO


            //wind event has a random duration
            const eventDur = randomNumber(1, 10);
            const att = eventDur / 10;
            console.log("OK", eventDur)

            const now = c.currentTime;
            const ampGain = c.createGain();
            const modGain = c.createGain()
            const lfo = c.createOscillator();
            const bpf = c.createBiquadFilter();
            lfo.type = "triangle";
            lfo.frequency.value = 5;
            modGain.gain.value = 2;
            bpf.type = "bandpass";
            bpf.Q.value = 50;

            const bpfStartFreq = randomNumber(200, 2000);
            const bpfStopFreq = randomNumber(200, 2000);
            bpf.frequency.setValueAtTime(bpfStartFreq, now );
            bpf.frequency.setValueAtTime(bpfStopFreq, now+eventDur );

            const bufferSize = 2 * c.sampleRate,
                noiseBuffer = c.createBuffer(1, bufferSize, c.sampleRate),
                output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            let whiteNoise = c.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            ampGain.gain.setValueAtTime(0, now);
            ampGain.gain.linearRampToValueAtTime(1, now+att);
            ampGain.gain.linearRampToValueAtTime(0, now+eventDur);

            lfo.connect(ampGain.gain);
            //modGain.connect(ampGain);
            whiteNoise.connect(bpf);
            bpf.connect(ampGain);
            ampGain.connect(c.destination)

            whiteNoise.start(now);
            lfo.start(now);
            whiteNoise.stop(now+eventDur);
            lfo.stop(now+eventDur);
            //interesting to add the wind direction in stereo mode
        }
        if (c.currentTime - startTime > totalDuration)
        {
            console.log("time: ", c.currentTime - startTime)
            clearInterval(intervalWind)
        }
    }


    function playNote (freq, dur, time) {
        const now = c.currentTime;
        const o = c.createOscillator()
        const g = c.createGain();

        o.frequency.value = freq
        o.type = "sine"
        o.connect(g);
        g.connect(c.destination)

        //no attack
        g.gain.setValueAtTime(0, now+time);
        g.gain.linearRampToValueAtTime(1, now+time);
        g.gain.linearRampToValueAtTime(0, now+dur+time);

        o.start(time);
        o.stop(now+dur+time);
        //console.log("note ended", now);
    }

}

//UTILITY

//scale value from one domain to another
function scale (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

// Function to generate random number
function randomNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}



/*

let context= new AudioContext();
let context2= new AudioContext();

let lowpass = context.createBiquadFilter();
lowpass.type = 'lowpass';
//lowpass.Q.value = -7.01;
lowpass.frequency.setValueAtTime(80, context2.currentTime);

let gain = new GainNode(context);
gain.gain.value= 0.4;

let gain2 = new GainNode(context2);
gain2.gain.value= 0.02;

let highpass=context2.createBiquadFilter();
highpass.type = 'highpass';
highpass.Q.value = 2;
//highpass.frequency.setValueAtTime(6000, context2.currentTime);

let distortion = context2.createWaveShaper();

let delay = context2.createDelay(90.0);




function StartAudio() {context.resume()};
context.audioWorklet.addModule('basicnoise.js').then(() => {
    let myNoise = new AudioWorkletNode(context,'noise-generator');

    myNoise.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(context.destination);
});

function StartAudio2() {context2.resume()};
context2.audioWorklet.addModule('basicnoise.js').then(() => {
    let myNoise2 = new AudioWorkletNode(context2,'noise-generator');

    myNoise2.connect(highpass);
    highpass.connect(gain2);
    gain2.connect(delay);
    delay.connect(context2.destination);
});

 */