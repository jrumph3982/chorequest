import { Zombie } from '../entities/Zombie.js';
import { randBetween, randItem, randInt } from '../utils/MathUtils.js';
import { ZOMBIE_SPAWNS } from '../HouseLayout.js';

const MAX_ZOMBIES    = 24;
const MAX_PER_STRUCT = 3;

// Wave config: each wave triggered by game timer thresholds
const WAVES = [
  { triggerAt: 150, count: 4,  types: ['walker', 'walker', 'walker', 'runner'],              delay: 1.5 },
  { triggerAt: 105, count: 6,  types: ['walker', 'walker', 'runner', 'brute'],               delay: 1.2 },
  { triggerAt:  60, count: 9,  types: ['walker', 'runner', 'runner', 'brute'],               delay: 0.9 },
  { triggerAt:  20, count: 14, types: ['walker', 'runner', 'runner', 'brute', 'brute'],      delay: 0.6 },
];

export class ZombieAISystem {
  constructor() {
    this._wavesTriggered = new Set();
    this._spawnQueue     = [];   // { type, x, y, delay }
    this._spawnTimer     = 0;
    this._ambientTimer   = 18;   // ambient spawns between waves
    this.currentWave     = 0;
    this.waveAnnounce    = null; // { text, ttl }
  }

  update(dt, game) {
    // ── Wave triggers (time-based) ──────────────────────────
    for (const wave of WAVES) {
      if (!this._wavesTriggered.has(wave.triggerAt) && game.timer <= wave.triggerAt) {
        this._wavesTriggered.add(wave.triggerAt);
        this.currentWave++;
        this._queueWave(wave, game);
        this.waveAnnounce = { text: `WAVE ${this.currentWave}`, ttl: 2.5 };
        game.audio.play('alert');
      }
    }
    if (this.waveAnnounce) {
      this.waveAnnounce.ttl -= dt;
      if (this.waveAnnounce.ttl <= 0) this.waveAnnounce = null;
    }

    // ── Spawn queue ──────────────────────────────────────────
    if (this._spawnQueue.length > 0) {
      this._spawnTimer -= dt;
      if (this._spawnTimer <= 0 && game.zombies.length < MAX_ZOMBIES) {
        const entry = this._spawnQueue.shift();
        this._doSpawn(entry.type, entry.x, entry.y, game);
        this._spawnTimer = entry.delay || 0.8;
      }
    }

    // ── Ambient spawns between waves ─────────────────────────
    this._ambientTimer -= dt;
    if (this._ambientTimer <= 0 && game.zombies.length < 8 && game.timer > 5) {
      const spawn = randItem(ZOMBIE_SPAWNS);
      this._doSpawn('walker', spawn.x + randBetween(-20, 20), spawn.y + randBetween(-20, 20), game);
      this._ambientTimer = randBetween(12, 20);
    }

    // ── Update each zombie ────────────────────────────────────
    for (const z of game.zombies) {
      if (!z.target || (z.state === 'approaching' && z.target.isPassable())) {
        z.target = this._pickTarget(z, game);
      }
      z.update(dt, game);
    }

    // ── Remove dead zombies ───────────────────────────────────
    game.zombies = game.zombies.filter(z => !(z.state === 'dead' && z.alpha <= 0));

    // ── Sync attacker lists ────────────────────────────────────
    for (const s of game.structures) s.attackers = [];
    for (const z of game.zombies) {
      if (z.state === 'attacking' && z.target) {
        if (!z.target.attackers) z.target.attackers = [];
        z.target.attackers.push(z);
      }
    }
  }

  _queueWave(wave, game) {
    const spawnPts = ZOMBIE_SPAWNS;
    for (let i = 0; i < wave.count; i++) {
      const spawn = spawnPts[i % spawnPts.length];
      const type  = wave.types[i % wave.types.length];
      this._spawnQueue.push({
        type,
        x: spawn.x + randBetween(-25, 25),
        y: spawn.y + randBetween(-25, 25),
        delay: wave.delay,
      });
    }
  }

  _doSpawn(type, x, y, game) {
    const z = new Zombie(x, y, type);
    z.target = this._pickTarget(z, game);
    game.zombies.push(z);
  }

  _pickTarget(zombie, game) {
    const viable = game.structures.filter(s =>
      !s.attackers || s.attackers.length < MAX_PER_STRUCT
    );
    if (!viable.length) return randItem(game.structures);
    const scored = viable.map(s => {
      const dist = Math.hypot(s.cx - zombie.pos.x, s.cy - zombie.pos.y);
      const prio = s.state === 'intact' ? 0 : s.state === 'boarded' ? -1 : 2;
      return { s, score: prio - dist * 0.002 };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].s;
  }
}
