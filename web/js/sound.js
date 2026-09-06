/**
 * sound.js — Sound-Effekte per Web Audio API (Punkt 6.5)
 *
 * Bewusst OHNE externe Audio-Dateien: Alle Effekte sind kurze synthetische
 * Töne aus Oszillatoren mit Attack/Decay-Hüllkurve. Passt zum No-Build-Step/
 * Client-only-Ansatz — keine Downloads, keine Lizenzfragen.
 */

const WoFSound = (() => {
  const MUTE_KEY = 'wof_sound_muted';
  let ctx = null;
  let stummgeschaltet = localStorage.getItem(MUTE_KEY) === '1';

  function kontext() {
    // Browser-Autoplay-Regeln erlauben einen AudioContext erst nach einer
    // echten User-Geste -> lazy erstellen, freischalten() wird beim ersten
    // Klick irgendwo in der App aufgerufen (siehe main.js).
    if (!ctx) {
      const AudioContextKlasse = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextKlasse) return null;
      ctx = new AudioContextKlasse();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function ton({ frequenz, dauer, typ = 'sine', verzoegerung = 0, lautstaerke = 0.2 }) {
    const audio = kontext();
    if (!audio || stummgeschaltet) return;
    const start = audio.currentTime + verzoegerung;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = typ;
    osc.frequency.setValueAtTime(frequenz, start);
    // Lineares Attack + exponentieller Decay, sonst knackt/klickt der Ton
    // beim abrupten Ein-/Ausblenden hörbar.
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(lautstaerke, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dauer);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + dauer + 0.02);
  }

  function freischalten() {
    kontext();
  }

  function spieleHit() {
    ton({ frequenz: 180, dauer: 0.08, typ: 'square', lautstaerke: 0.15 });
  }

  function spieleCombo() {
    ton({ frequenz: 520, dauer: 0.12, typ: 'triangle', lautstaerke: 0.18 });
    ton({ frequenz: 780, dauer: 0.14, typ: 'triangle', verzoegerung: 0.06, lautstaerke: 0.15 });
  }

  function spieleLoot() {
    ton({ frequenz: 660, dauer: 0.1, typ: 'sine', lautstaerke: 0.15 });
    ton({ frequenz: 990, dauer: 0.18, typ: 'sine', verzoegerung: 0.08, lautstaerke: 0.15 });
  }

  function spieleLevelUp() {
    [440, 554, 659, 880].forEach((freq, i) => {
      ton({ frequenz: freq, dauer: 0.18, typ: 'triangle', verzoegerung: i * 0.09, lautstaerke: 0.2 });
    });
  }

  function spieleSieg() {
    [392, 494, 587, 784].forEach((freq, i) => {
      ton({ frequenz: freq, dauer: 0.22, typ: 'sawtooth', verzoegerung: i * 0.1, lautstaerke: 0.16 });
    });
  }

  function spieleErfolg() {
    ton({ frequenz: 523, dauer: 0.12, typ: 'sine', lautstaerke: 0.18 });
    ton({ frequenz: 659, dauer: 0.16, typ: 'sine', verzoegerung: 0.07, lautstaerke: 0.18 });
  }

  function istStummgeschaltet() {
    return stummgeschaltet;
  }

  function setzeStummgeschaltet(aktiv) {
    stummgeschaltet = aktiv;
    localStorage.setItem(MUTE_KEY, aktiv ? '1' : '0');
  }

  return {
    freischalten,
    spieleHit,
    spieleCombo,
    spieleLoot,
    spieleLevelUp,
    spieleSieg,
    spieleErfolg,
    istStummgeschaltet,
    setzeStummgeschaltet,
  };
})();
