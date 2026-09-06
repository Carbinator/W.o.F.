/**
 * state.js — Spielstand-Verwaltung (Punkt 2, 4, 5.4-5.6 aus HANDOVER.md)
 *
 * Kompletter State liegt in localStorage unter STORAGE_KEY.
 * Bewusst als eigenes Modul mit klarer API gehalten, damit später ein
 * Backend-Sync (Punkt 13, WoF Multiplayer) dazwischengeschoben werden kann,
 * ohne den Rest der App anzufassen.
 */

const WoFState = (() => {
  const STORAGE_KEY = 'wof_save_v1';

  // ---- Stammdaten (Punkt 4.1 / 4.5) ----------------------------------

  const KLASSEN = {
    barbar: {
      key: 'barbar',
      name: 'Barbar',
      beschreibung: 'Roher Kraftsport — Maximalkraft',
      emoji: '🪓',
      bonusStat: 'kraft',
      ausruestung: {
        armor: { name: 'Wildling-Fell', slot: 'armor', bonuses: { kraft: 3, ausdauer: 1 } },
        weapon: { name: 'Brechstangen-Faust', slot: 'weapon', bonuses: { kraft: 2 } },
      },
    },
    paladin: {
      key: 'paladin',
      name: 'Paladin',
      beschreibung: 'Muskelaufbau / Hypertrophie',
      emoji: '🛡️',
      bonusStat: 'muskelaufbau',
      ausruestung: {
        armor: { name: 'Turnier-Kürass', slot: 'armor', bonuses: { muskelaufbau: 3, willenskraft: 1 } },
        weapon: { name: 'Trainings-Handschuh', slot: 'weapon', bonuses: { muskelaufbau: 2 } },
      },
    },
    elf: {
      key: 'elf',
      name: 'Elf',
      beschreibung: 'Beweglichkeit, Yoga, Mobility',
      emoji: '🏹',
      bonusStat: 'beweglichkeit',
      ausruestung: {
        armor: { name: 'Läufer-Sandalen', slot: 'armor', bonuses: { beweglichkeit: 3, ausdauer: 1 } },
        weapon: { name: 'Federleichter Umhang', slot: 'weapon', bonuses: { beweglichkeit: 2 } },
      },
    },
    waldlaeufer: {
      key: 'waldlaeufer',
      name: 'Waldläufer',
      beschreibung: 'Ausdauer — Laufen, lange Distanzen',
      emoji: '🏃',
      bonusStat: 'ausdauer',
      ausruestung: {
        armor: { name: 'Läufer-Tuch', slot: 'armor', bonuses: { ausdauer: 3, willenskraft: 1 } },
        weapon: { name: 'Trink-Flakon', slot: 'weapon', bonuses: { ausdauer: 2 } },
      },
    },
  };

  const STATS = ['kraft', 'muskelaufbau', 'ausdauer', 'beweglichkeit', 'willenskraft'];

  // Skilltree (Punkt 4.6): "Konkrete Skilltree-Inhalte kann Claude Code
  // selbst entwerfen" — eigenes Design. 3 Äste x 3 Stufen pro Klasse,
  // mechanisch identisch über alle Klassen (nur Namen unterscheiden sich),
  // damit Code und Balancing an einer Stelle bleiben.
  const TALENT_AST_BASIS = {
    angriffslust: {
      stat: 'combatXpBonus',
      stufenWerte: [0.05, 0.05, 0.1], // kumuliert +20% XP im Kampf bei Stufe 3
      beschreibung: (kumuliert) => `+${Math.round(kumuliert * 100)}% XP im Kampf`,
    },
    bestaendigkeit: {
      stat: 'streakGrace',
      stufenWerte: [1, 1, 1], // kumuliert 3 Gnadentage bei Stufe 3
      beschreibung: (kumuliert) => `${kumuliert} Gnadentag(e) ohne Streak-Verlust`,
    },
    beute: {
      stat: 'lootChanceBonus',
      stufenWerte: [0.05, 0.05, 0.1], // kumuliert +20% Beute-Chance bei Stufe 3
      beschreibung: (kumuliert) => `+${Math.round(kumuliert * 100)}% Beute-Chance`,
    },
  };

  // Klassen-spezifische Namen für dieselben 3 Äste (Punkt 4.6 Vorschlag,
  // z.B. Barbar: "Berserker"/"Bulle"/"Prügler" — hier leicht angepasst).
  const KLASSEN_TALENTNAMEN = {
    barbar: { angriffslust: 'Berserker', bestaendigkeit: 'Widerstand', beute: 'Plünderer' },
    paladin: { angriffslust: 'Kreuzritter', bestaendigkeit: 'Standhaftigkeit', beute: 'Segen' },
    elf: { angriffslust: 'Sturmklinge', bestaendigkeit: 'Ausdauerlauf', beute: 'Waldglück' },
    waldlaeufer: { angriffslust: 'Jagdrausch', bestaendigkeit: 'Eiserner Wille', beute: 'Spurleser' },
  };

  function talentbaumFuer(klasseKey) {
    const namen = KLASSEN_TALENTNAMEN[klasseKey] || {};
    return Object.entries(TALENT_AST_BASIS).map(([astKey, basis]) => ({
      astKey,
      name: namen[astKey] || astKey,
      stufenWerte: basis.stufenWerte,
      beschreibung: basis.beschreibung,
    }));
  }

  function talentAusgeben(character, astKey) {
    if (!TALENT_AST_BASIS[astKey]) return false;
    if (character.talentPunkte <= 0) return false;
    const aktuelleStufe = character.talente[astKey] || 0;
    if (aktuelleStufe >= 3) return false;
    character.talente[astKey] = aktuelleStufe + 1;
    character.talentPunkte -= 1;
    return true;
  }

  function berechneTalentBoni(character) {
    const boni = { combatXpBonus: 0, streakGrace: 0, lootChanceBonus: 0 };
    Object.entries(character.talente || {}).forEach(([astKey, stufe]) => {
      const basis = TALENT_AST_BASIS[astKey];
      if (!basis) return;
      for (let i = 0; i < stufe; i++) {
        boni[basis.stat] += basis.stufenWerte[i];
      }
    });
    return boni;
  }

  // Punkt 4.4 Fitness-Startlevel-Mapping
  const FITNESS_STARTLEVEL = {
    1: { label: 'Novice', startCharLvl: 1, statBonus: 0 },
    2: { label: 'Fortgeschritten', startCharLvl: 3, statBonus: 5 },
    3: { label: 'Meister', startCharLvl: 6, statBonus: 12 },
    4: { label: 'Super', startCharLvl: 10, statBonus: 25 },
    5: { label: 'Ultra', startCharLvl: 15, statBonus: 45 },
  };

  const HAUTTON_PRESETS = ['#f5d5b8', '#e8b48a', '#d19468', '#a06a3a', '#6b4020', '#3a2010'];
  const HAARFARBE_PRESETS = [
    '#1a1008', '#3a2418', '#6b4020', '#a86828', '#d4a44a',
    '#e8dcc0', '#c04040', '#8a3060', '#2050a0', '#3d7a3d',
  ];
  const FRISUREN = ['kurz', 'mittel', 'lang', 'zopf', 'dutt', 'kahl'];

  // XP-Kurve: eigene Annahme (im HANDOVER nicht spezifiziert) — linear
  // wachsender Bedarf pro Level. Kann später leicht angepasst werden.
  function xpFuerNaechstesLevel(level) {
    return 100 + (level - 1) * 50;
  }

  // ---- Persistenz ------------------------------------------------------

  function laden() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const character = JSON.parse(raw);
      // Migration: Spielstände von vor dem Skilltree (Punkt 15 Schritt 11)
      // hatten noch kein talente-Feld.
      if (!character.talente) {
        character.talente = { angriffslust: 0, bestaendigkeit: 0, beute: 0 };
      }
      if (!character.bossCooldowns) {
        character.bossCooldowns = {};
      }
      return character;
    } catch (e) {
      console.error('WoF: Spielstand konnte nicht gelesen werden', e);
      return null;
    }
  }

  function speichern(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function zuruecksetzen() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ---- Charakter-Erstellung (Punkt 4.3 / 4.5) --------------------------

  function zufallStat(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function neuerCharakter(params) {
    const klasse = KLASSEN[params.klasse];
    if (!klasse) throw new Error('Unbekannte Klasse: ' + params.klasse);

    const startlevel = FITNESS_STARTLEVEL[params.fitnessStartlevel] || FITNESS_STARTLEVEL[1];

    // Start-Stat-Verteilung: Bonus-Stat 12, Rest 5-8 (Punkt 4.1)
    const stats = {};
    STATS.forEach((stat) => {
      stats[stat] = stat === klasse.bonusStat ? 12 : zufallStat(5, 8);
    });
    // Fitness-Startlevel-Bonus (Punkt 4.4) gleichmäßig auf jeden Stat
    STATS.forEach((stat) => {
      stats[stat] += startlevel.statBonus;
    });

    const talentPunkte = Math.max(0, startlevel.startCharLvl - 1);

    const armor = { id: cryptoId(), type: 'item', rarity: 'gewöhnlich', ...klasse.ausruestung.armor };
    const weapon = { id: cryptoId(), type: 'item', rarity: 'gewöhnlich', ...klasse.ausruestung.weapon };

    const character = {
      name: (params.name || 'Held').slice(0, 24),
      klasse: klasse.key,
      geschlecht: params.geschlecht || 'diverse',
      koerperbau: params.koerperbau || 'meso',
      hautton: params.hautton || HAUTTON_PRESETS[0],
      haarfarbe: params.haarfarbe || HAARFARBE_PRESETS[0],
      frisur: params.frisur || 'kurz',
      fitnessStartlevel: params.fitnessStartlevel || 1,

      level: startlevel.startCharLvl,
      xp: 0,
      gold: 0,
      talentPunkte,
      talente: { angriffslust: 0, bestaendigkeit: 0, beute: 0 },
      stats,

      inventory: [armor, weapon],
      equipped: { armor, weapon, amulet: null },

      streak: { count: 0, lastTrainingDate: null },
      besiegteMonster: [],
      bossCooldowns: {},

      erstelltAm: new Date().toISOString(),
    };

    return character;
  }

  function cryptoId() {
    return 'id_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  // ---- Stat-Berechnung (Punkt 4.2 Power-Formel) ------------------------

  function effektiveStats(character) {
    const result = { ...character.stats };
    Object.values(character.equipped).forEach((item) => {
      if (!item) return;
      Object.entries(item.bonuses || {}).forEach(([stat, wert]) => {
        result[stat] = (result[stat] || 0) + wert;
      });
    });
    return result;
  }

  function power(character) {
    const eff = effektiveStats(character);
    return STATS.reduce((sum, s) => sum + (eff[s] || 0), 0);
  }

  // ---- XP / Level-Up -----------------------------------------------------

  function xpHinzufuegen(character, betrag) {
    character.xp += Math.round(betrag);
    const levelUps = [];
    let bedarf = xpFuerNaechstesLevel(character.level);
    while (character.xp >= bedarf) {
      character.xp -= bedarf;
      character.level += 1;
      character.talentPunkte += 1;
      levelUps.push(character.level);
      bedarf = xpFuerNaechstesLevel(character.level);
    }
    return levelUps;
  }

  function goldHinzufuegen(character, betrag) {
    character.gold += Math.round(betrag);
  }

  function statErhoehen(character, stat, betrag) {
    if (!STATS.includes(stat)) return;
    character.stats[stat] = (character.stats[stat] || 0) + betrag;
  }

  // ---- Streak (Punkt 5.6) -----------------------------------------------

  function heuteISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function tageDifferenz(isoA, isoB) {
    const a = new Date(isoA + 'T00:00:00');
    const b = new Date(isoB + 'T00:00:00');
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
  }

  function streakAktualisieren(character) {
    const heute = heuteISO();
    const letzter = character.streak.lastTrainingDate;
    if (!letzter) {
      character.streak.count = 1;
    } else {
      const diff = tageDifferenz(letzter, heute);
      if (diff === 0) {
        // schon heute trainiert, Streak bleibt
      } else if (diff === 1) {
        character.streak.count += 1;
      } else {
        // Streak-Grace (Punkt 5.6 + 4.6): Talent "Beständigkeit" erlaubt
        // X übersprungene Tage, ohne dass die Streak zurückgesetzt wird.
        const grace = berechneTalentBoni(character).streakGrace;
        const uebersprungeneTage = diff - 1;
        if (uebersprungeneTage <= grace) {
          character.streak.count += 1;
        } else {
          character.streak.count = 1;
        }
      }
    }
    character.streak.lastTrainingDate = heute;
  }

  return {
    STORAGE_KEY,
    KLASSEN,
    STATS,
    FITNESS_STARTLEVEL,
    HAUTTON_PRESETS,
    HAARFARBE_PRESETS,
    FRISUREN,
    xpFuerNaechstesLevel,
    laden,
    speichern,
    zuruecksetzen,
    neuerCharakter,
    effektiveStats,
    power,
    xpHinzufuegen,
    goldHinzufuegen,
    statErhoehen,
    streakAktualisieren,
    cryptoId,
    talentbaumFuer,
    talentAusgeben,
    berechneTalentBoni,
  };
})();
