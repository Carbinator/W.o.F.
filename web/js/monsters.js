/**
 * monsters.js — Monster-Familien-System (Punkt 5.1/5.2 aus HANDOVER.md)
 *
 * Erste Iteration: nur die Familie "Squat Goblin" (5 Stufen).
 * Weitere Familien folgen in Punkt 15 Schritt 12 — dort auch die
 * offenen Fragen aus Punkt 11 (Battering Ram / Nevill, Klimmzüge)
 * klären, BEVOR neue Familien/Bosse gebaut werden. Squat Goblin
 * betrifft keine der offenen Fragen (Kniebeugen, keine Utensilien).
 */

const WoFMonsters = (() => {
  // Rep-Progression Kniebeugen (Punkt 5.2): 5 -> 10 -> 20 -> 50 -> 100
  const REP_PROGRESSION = [5, 10, 20, 50, 100];

  // Eigene Annahme (im HANDOVER nicht spezifiziert): Basiswerte pro Stufe,
  // grob am Rep-Ziel orientiert.
  const XP_BASIS = [20, 40, 80, 150, 300];
  const GOLD_BASIS = [5, 10, 20, 40, 80];
  const HP_BASIS = [20, 40, 80, 150, 300];

  const STUFEN_NAMEN = [
    'Squat Goblin Welpe',
    'Squat Goblin Späher',
    'Squat Goblin Krieger',
    'Squat Goblin Häuptling',
    'Squat Goblin Uralt',
  ];

  const FAMILIEN = {
    squat_goblin: {
      id: 'squat_goblin',
      name: 'Squat Goblin',
      uebung: 'Kniebeugen',
      einheit: 'reps',
      bonusStat: 'muskelaufbau',
      stufen: REP_PROGRESSION.map((repZiel, i) => ({
        familyId: 'squat_goblin',
        stufe: i + 1,
        name: STUFEN_NAMEN[i],
        repZiel,
        hp: HP_BASIS[i],
        xpBasis: XP_BASIS[i],
        goldBasis: GOLD_BASIS[i],
        bonusStat: 'muskelaufbau',
        uebung: 'Kniebeugen',
        einheit: 'reps',
      })),
    },
  };

  function monsterDaten(familyId, stufe) {
    const familie = FAMILIEN[familyId];
    if (!familie) throw new Error('Unbekannte Familie: ' + familyId);
    const daten = familie.stufen[stufe - 1];
    if (!daten) throw new Error('Unbekannte Stufe: ' + stufe);
    return daten;
  }

  function zufallsStufe(charLevel) {
    // Spawn-Gewichtung (Punkt 7.3): niedrige Stufen deutlich häufiger.
    // Eigene Gewichtung, am Vorbild "Lvl1 = 10x wahrscheinlicher als Lvl4" orientiert.
    const gewichte = [10, 6, 3, 1.5, 0.5];
    const maxStufe = Math.min(5, Math.max(1, Math.ceil(charLevel / 2) + 1));
    const relevante = gewichte.slice(0, maxStufe);
    const summe = relevante.reduce((a, b) => a + b, 0);
    let roll = Math.random() * summe;
    for (let i = 0; i < relevante.length; i++) {
      roll -= relevante[i];
      if (roll <= 0) return i + 1;
    }
    return 1;
  }

  // ---- SVG-Rendering ----------------------------------------------------

  // Farbintensität und Größe skalieren mit Stufe.
  const STUFEN_FARBEN = ['#4a7a3a', '#3f6e30', '#356024', '#8a3020', '#c0401a'];

  function renderMonsterSVG(familyId, stufe) {
    if (familyId !== 'squat_goblin') {
      throw new Error('Nur squat_goblin ist aktuell implementiert');
    }
    const idx = stufe - 1;
    const farbe = STUFEN_FARBEN[idx] || STUFEN_FARBEN[0];
    const groesse = 0.7 + idx * 0.15; // wächst mit Stufe
    const cx = 80;
    const cy = 110;
    const kopfR = 26 * groesse;
    const ohrLaenge = 20 * groesse;

    // In der Hocke (Kniebeugen-Pose): Beine gebeugt, Torso tief.
    return `
      <svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${STUFEN_NAMEN[idx]}">
        <g fill="${farbe}">
          <!-- Beine (gehockt) -->
          <path d="M ${cx - 26 * groesse} ${cy + 60 * groesse}
                   L ${cx - 30 * groesse} ${cy + 20 * groesse}
                   L ${cx - 8 * groesse} ${cy + 10 * groesse}
                   L ${cx - 6 * groesse} ${cy + 60 * groesse} Z"/>
          <path d="M ${cx + 26 * groesse} ${cy + 60 * groesse}
                   L ${cx + 30 * groesse} ${cy + 20 * groesse}
                   L ${cx + 8 * groesse} ${cy + 10 * groesse}
                   L ${cx + 6 * groesse} ${cy + 60 * groesse} Z"/>
          <!-- Torso -->
          <ellipse cx="${cx}" cy="${cy}" rx="${34 * groesse}" ry="${28 * groesse}"/>
          <!-- Arme (nach vorne für Balance) -->
          <ellipse cx="${cx - 40 * groesse}" cy="${cy + 4 * groesse}" rx="${9 * groesse}" ry="${16 * groesse}" transform="rotate(-20 ${cx - 40 * groesse} ${cy + 4 * groesse})"/>
          <ellipse cx="${cx + 40 * groesse}" cy="${cy + 4 * groesse}" rx="${9 * groesse}" ry="${16 * groesse}" transform="rotate(20 ${cx + 40 * groesse} ${cy + 4 * groesse})"/>
          <!-- Kopf -->
          <circle cx="${cx}" cy="${cy - 40 * groesse}" r="${kopfR}"/>
          <!-- Ohren -->
          <path d="M ${cx - kopfR + 4} ${cy - 40 * groesse - 6}
                   Q ${cx - kopfR - ohrLaenge} ${cy - 40 * groesse - ohrLaenge}
                     ${cx - kopfR + 2} ${cy - 40 * groesse + 10} Z"/>
          <path d="M ${cx + kopfR - 4} ${cy - 40 * groesse - 6}
                   Q ${cx + kopfR + ohrLaenge} ${cy - 40 * groesse - ohrLaenge}
                     ${cx + kopfR - 2} ${cy - 40 * groesse + 10} Z"/>
        </g>
        <!-- Augen -->
        <g fill="#e8d840">
          <circle cx="${cx - 9 * groesse}" cy="${cy - 42 * groesse}" r="${3.5 * groesse}"/>
          <circle cx="${cx + 9 * groesse}" cy="${cy - 42 * groesse}" r="${3.5 * groesse}"/>
        </g>
        <g fill="#14100c">
          <circle cx="${cx - 9 * groesse}" cy="${cy - 42 * groesse}" r="${1.4 * groesse}"/>
          <circle cx="${cx + 9 * groesse}" cy="${cy - 42 * groesse}" r="${1.4 * groesse}"/>
        </g>
        <!-- Zähne -->
        <path d="M ${cx - 6 * groesse} ${cy - 28 * groesse} L ${cx - 3 * groesse} ${cy - 20 * groesse} L ${cx} ${cy - 28 * groesse} Z" fill="#f0ead6"/>
        <path d="M ${cx + 6 * groesse} ${cy - 28 * groesse} L ${cx + 3 * groesse} ${cy - 20 * groesse} L ${cx} ${cy - 28 * groesse} Z" fill="#f0ead6"/>
      </svg>
    `;
  }

  return {
    FAMILIEN,
    monsterDaten,
    zufallsStufe,
    renderMonsterSVG,
  };
})();
