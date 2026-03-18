export class AudioSystem {
  constructor() {
    this._ac = null;
    this._muted = false;
    this._initAC();
  }

  _initAC() {
    try {
      this._ac = new (window.AudioContext || window.webkitAudioContext)();
    } catch { this._ac = null; }
  }

  _resume() {
    if (this._ac && this._ac.state === 'suspended') this._ac.resume();
  }

  _tone(freq, dur, vol = 0.3, type = 'sine', freqEnd = null) {
    if (!this._ac || this._muted) return;
    this._resume();
    const o = this._ac.createOscillator();
    const g = this._ac.createGain();
    o.connect(g); g.connect(this._ac.destination);
    o.type = type; o.frequency.value = freq;
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, this._ac.currentTime + dur);
    g.gain.setValueAtTime(vol, this._ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this._ac.currentTime + dur);
    o.start(); o.stop(this._ac.currentTime + dur);
  }

  _noise(dur, vol = 0.3) {
    if (!this._ac || this._muted) return;
    this._resume();
    const sampleRate = this._ac.sampleRate;
    const len = Math.floor(dur * sampleRate);
    const buf = this._ac.createBuffer(1, len, sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / len * 4);
    const src = this._ac.createBufferSource();
    const g   = this._ac.createGain();
    src.buffer = buf; src.connect(g); g.connect(this._ac.destination);
    g.gain.value = vol; src.start();
  }

  play(sound) {
    switch (sound) {
      case 'scratch': // zombie scratching glass
        this._tone(180 + Math.random() * 60, 0.08, 0.08, 'sawtooth', 100);
        break;
      case 'bang':    // zombie banging door
        this._noise(0.12, 0.3);
        this._tone(80, 0.15, 0.2, 'square', 40);
        break;
      case 'crack':   // wood cracking / window cracking
        this._noise(0.18, 0.35);
        this._tone(220, 0.06, 0.15, 'square', 80);
        break;
      case 'shatter': // glass shattering
        this._noise(0.25, 0.5);
        this._tone(1200, 0.1, 0.1, 'sine', 200);
        break;
      case 'repair':  // hammering
        [0,80,160].forEach(t => setTimeout(() => {
          this._tone(200, 0.05, 0.25, 'square', 80);
        }, t));
        break;
      case 'pickup':  // material collected
        this._tone(440, 0.07, 0.15, 'sine', 660);
        break;
      case 'entry':   // zombie entering
        this._tone(60, 0.4, 0.2, 'sawtooth', 30);
        break;
      case 'alert':   // integrity warning
        [0, 200].forEach(t => setTimeout(() => this._tone(880, 0.15, 0.2, 'square'), t));
        break;
      case 'gameover':
        [523, 415, 330, 262].forEach((f, i) => setTimeout(() => this._tone(f, 0.3, 0.2, 'square'), i * 180));
        break;
      case 'victory':
        [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this._tone(f, 0.2, 0.2, 'square'), i * 120));
        break;
    }
  }

  setMuted(m) { this._muted = m; }
}
