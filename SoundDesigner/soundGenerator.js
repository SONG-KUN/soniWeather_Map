function sound(lon, lat) {

    //MAPPING:
    //lon to freq
    let freq = scale(lon, -180, 180, 100, 1000)
    //lat to duration
    let dur = scale(lat, -90, 90, 0.1, 1)

    let sequence = 5;
    const c = new AudioContext();

    function playNoise () {
        var bufferSize = 2 * c.sampleRate,
            noiseBuffer = c.createBuffer(1, bufferSize, c.sampleRate),
            output = noiseBuffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        var whiteNoise = c.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        whiteNoise.start(0);

        whiteNoise.connect(c.destination);

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

    for (var i = 0; i < sequence; i++) {
        playNote(freq, dur, dur*i);
    }

}


//scale value from one domain to another
function scale (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
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