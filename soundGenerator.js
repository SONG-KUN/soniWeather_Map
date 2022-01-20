function sound(lon, lat) {

    //lon to freq
    let freq = scale(lon, -180, 180, 100, 1000)
    //lat to duration
    let dur = scale(lat, -90, 90, 0.1, 2)

    let sequence = 5;

    const c = new AudioContext();

    function play (freq, dur, time) {
        const now = c.currentTime;
        const o = c.createOscillator()
        const g = c.createGain();

        o.frequency.value = freq
        o.type = "sine"
        o.connect(g);
        g.connect(c.destination)

        g.gain.setValueAtTime(0, now+time);
        g.gain.linearRampToValueAtTime(1, now+time);
        g.gain.linearRampToValueAtTime(0, now+dur+time);
        o.start(time);
        //o.stop(now+dur+time);
        console.log("note ended", now);
    }

    for (var i = 0; i < sequence; i++) {
        play(freq, dur, dur*i);
    }

}



function scale (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

