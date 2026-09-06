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

    // Budget EINMAL aufteilen statt pro Stat einzeln auf mind. 1 zu runden —
    // sonst bekäme z.B. Cross-Fit (2 Stats à Gewicht 0.5) bei statGesamt=1
    // fälschlich 1+1=2 Punkte, doppelt so viel wie ein Einzel-Stat-Typ mit
    // identischer Dauer/Intensität. Der letzte Stat bekommt den Rest, damit
    // die Summe garantiert exakt statGesamt ergibt.
    const statGesamt = Math.max(1, Math.floor((dauerMinuten * intInfo.multiplikator) / 10));
    const statEintraege = Object.entries(typInfo.stats);
    const statBoni = {};
    let verteilt = 0;
    statEintraege.forEach(([stat, gewicht], i) => {
      const istLetzter = i === statEintraege.length - 1;
      const betrag = istLetzter ? Math.max(0, statGesamt - verteilt) : Math.round(statGesamt * gewicht);
      if (betrag > 0) statBoni[stat] = betrag;
      verteilt += betrag;
    });

    return { xp, statBoni };
  }

  function abschliessen(character, eingabe) {
    WoFState.aktualisiereEnergiePassiv(character);
    const belohnung = berechneBelohnung(eingabe);
    const levelUps = WoFState.xpHinzufuegen(character, belohnung.xp);
    Object.entries(belohnung.statBoni).forEach(([stat, betrag]) => {
      WoFState.statErhoehen(character, stat, betrag);
    });
    WoFState.streakAktualisieren(character);
    // Echte Erschöpfung gilt unabhängig davon, ob man gegen ein Monster
    // oder frei trainiert hat — Energie-Kosten grob an der Dauer bemessen.
    WoFState.energieAendern(character, -Math.max(2, Math.round(eingabe.dauerMinuten / 10)));
    WoFState.protokolliere(character, {
      typ: 'freiesTraining',
      uebung: TYPEN[eingabe.typ].label,
      dauerMinuten: eingabe.dauerMinuten,
      intensitaet: INTENSITAETEN[eingabe.intensitaet].label,
      trainingsplatz: !!eingabe.trainingsplatz,
      xp: Math.round(belohnung.xp),
      statBoni: belohnung.statBoni,
    });
    WoFState.speichern(character);
    return { belohnung, levelUps };
  }

  return { TYPEN, INTENSITAETEN, berechneBelohnung, abschliessen };
})();
