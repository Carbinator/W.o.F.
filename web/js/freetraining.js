/**
 * freetraining.js — Freies Training parallel zum Monster-System (Punkt 9)
 *
 * Eigene Annahme (im HANDOVER nicht exakt spezifiziert): Zuordnung
 * Trainings-Typ -> Stat(s) und die XP/Stat-Formel. Monster bleiben der
 * Anreiz, freies Training bleibt die Basis (Punkt 9 "Wichtig").
 */

const WoFFreiesTraining = (() => {
  // Typ -> welche(r) Stat(s) profitieren, mit Gewichtung falls mehrere.
  const TYPEN = {
    kraft_schwer: { label: 'Kraftsport (schwer)', stats: { kraft: 1 } },
    kraft_mittel: { label: 'Kraftsport (mittel)', stats: { muskelaufbau: 1 } },
    kraft_leicht: { label: 'Kraftsport (leicht)', stats: { ausdauer: 1 } },
    cardio: { label: 'Cardio', stats: { ausdauer: 1 } },
    crossfit: { label: 'Cross-Fit', stats: { kraft: 0.5, ausdauer: 0.5 } },
    yoga: { label: 'Yoga / Mobility', stats: { beweglichkeit: 1 } },
    hiit: { label: 'HIIT', stats: { ausdauer: 0.7, willenskraft: 0.3 } },
  };

  // Intensität (Punkt 9): Multiplikator auf XP und Stat-Zuwachs.
  const INTENSITAETEN = {
    leicht: { label: 'Leicht', multiplikator: 0.5 },
    mittel: { label: 'Mittel', multiplikator: 1.0 },
    schwer: { label: 'Schwer', multiplikator: 1.5 },
    extrem: { label: 'Extrem', multiplikator: 2.0 },
  };

  const XP_PRO_MINUTE = 2; // eigene Annahme
  const TRAININGSPLATZ_BONUS = 1.2; // Punkt 9: +20% XP an Trainingsplatz

  function berechneBelohnung({ typ, dauerMinuten, intensitaet, trainingsplatz }) {
    const typInfo = TYPEN[typ];
    const intInfo = INTENSITAETEN[intensitaet];

    const xp = dauerMinuten * XP_PRO_MINUTE * intInfo.multiplikator * (trainingsplatz ? TRAININGSPLATZ_BONUS : 1);

    const statGesamt = Math.max(1, Math.floor((dauerMinuten * intInfo.multiplikator) / 10));
    const statBoni = {};
    Object.entries(typInfo.stats).forEach(([stat, gewicht]) => {
      statBoni[stat] = Math.max(1, Math.round(statGesamt * gewicht));
    });

    return { xp, statBoni };
  }

  function abschliessen(character, eingabe) {
    const belohnung = berechneBelohnung(eingabe);
    const levelUps = WoFState.xpHinzufuegen(character, belohnung.xp);
    Object.entries(belohnung.statBoni).forEach(([stat, betrag]) => {
      WoFState.statErhoehen(character, stat, betrag);
    });
    WoFState.streakAktualisieren(character);
    WoFState.speichern(character);
    return { belohnung, levelUps };
  }

  return { TYPEN, INTENSITAETEN, berechneBelohnung, abschliessen };
})();
