/**
 * monsters.js — Monster-Familien-System (Punkt 5.1/5.2 aus HANDOVER.md)
 *
 * 6 Familien (Punkt 15 Schritt 12): Squat Goblin, Pusher Demon, Dumplings,
 * Creatures, Killer Kebab Snakes, Knödel. Die Übungen waren im HANDOVER
 * mit "evtl." vorgeschlagen — hier übernommen, da thematisch stimmig
 * (Punkt 5.2 explizit: "Übung/Namen bitte thematisch stimmig zuordnen").
 * Die offenen Fragen aus Punkt 11 sind geklärt: Battering Ram ist nur
 * noch ein Boss (siehe 11.1), Klimmzüge bleiben draußen, Ersatz ist
 * Split Squats (siehe 11.2) — beides betrifft keine dieser Familien.
 */

const WoFMonsters = (() => {
  // Rep-Progressionen (Punkt 5.2): Standard 5->10->20->50->100,
  // Ausnahme Push-Ups (schwerer): 5->10->20->35->50.
  const STANDARD_PROGRESSION = [5, 10, 20, 50, 100];
  const PUSHUP_PROGRESSION = [5, 10, 20, 35, 50];

  // Eigene Annahme (im HANDOVER nicht spezifiziert): Basiswerte pro Stufe,
  // gleich über alle Familien — Belohnung hängt an der Monster-Stufe
  // (Punkt 5.4 "XP basierend auf Monster-Level"), nicht an der Rep-Zahl.
  const XP_BASIS = [20, 40, 80, 150, 300];
  const GOLD_BASIS = [5, 10, 20, 40, 80];
  const HP_BASIS = [20, 40, 80, 150, 300];

  function baueStufen(familyId, uebung, bonusStat, namen, progression) {
    return progression.map((repZiel, i) => ({
      familyId,
      stufe: i + 1,
      name: namen[i],
      repZiel,
      hp: HP_BASIS[i],
      xpBasis: XP_BASIS[i],
      goldBasis: GOLD_BASIS[i],
      bonusStat,
      uebung,
      einheit: 'reps',
    }));
  }

  const FAMILIEN = {
    squat_goblin: {
      id: 'squat_goblin',
      name: 'Squat Goblin',
      uebung: 'Kniebeugen',
      einheit: 'reps',
      bonusStat: 'muskelaufbau',
      stufen: baueStufen(
        'squat_goblin', 'Kniebeugen', 'muskelaufbau',
        ['Squat Goblin Welpe', 'Squat Goblin Späher', 'Squat Goblin Krieger', 'Squat Goblin Häuptling', 'Squat Goblin Uralt'],
        STANDARD_PROGRESSION
      ),
    },
    pusher_demon: {
      id: 'pusher_demon',
      name: 'Pusher Demon',
      uebung: 'Liegestütze',
      einheit: 'reps',
      bonusStat: 'kraft',
      stufen: baueStufen(
        'pusher_demon', 'Liegestütze', 'kraft',
        ['Pusher Demon Lehrling', 'Pusher Demon Treiber', 'Pusher Demon Peiniger', 'Pusher Demon Folterknecht', 'Pusher Demon Erzdämon'],
        PUSHUP_PROGRESSION
      ),
    },
    dumplings: {
      id: 'dumplings',
      name: 'Dumplings',
      uebung: 'Sit-Ups',
      einheit: 'reps',
      bonusStat: 'muskelaufbau',
      stufen: baueStufen(
        'dumplings', 'Sit-Ups', 'muskelaufbau',
        ['Dumpling-Teigling', 'Dumpling-Knusper', 'Dumpling-Dämpfer', 'Dumpling-Wok-Wächter', 'Dumpling-Kaiser'],
        STANDARD_PROGRESSION
      ),
    },
    creatures: {
      id: 'creatures',
      name: 'Creatures',
      uebung: 'Burpees',
      einheit: 'reps',
      bonusStat: 'ausdauer',
      stufen: baueStufen(
        'creatures', 'Burpees', 'ausdauer',
        ['Creature-Junges', 'Creature-Kriecher', 'Creature-Zerrer', 'Creature-Schlinger', 'Creature-Urwesen'],
        STANDARD_PROGRESSION
      ),
    },
    killer_kebab_snakes: {
      id: 'killer_kebab_snakes',
      name: 'Killer Kebab Snakes',
      uebung: 'Russian Twists',
      einheit: 'reps',
      bonusStat: 'beweglichkeit',
      stufen: baueStufen(
        'killer_kebab_snakes', 'Russian Twists', 'beweglichkeit',
        ['Kebabschlange-Jungtier', 'Kebabschlange-Spießer', 'Kebabschlange-Grillmeister', 'Kebabschlange-Flammenwächter', 'Kebabschlange-Ur-Spieß'],
        STANDARD_PROGRESSION
      ),
    },
    knoedel: {
      id: 'knoedel',
      name: 'Knödel',
      uebung: 'Hollow Body Rocks',
      einheit: 'reps',
      bonusStat: 'willenskraft',
      stufen: baueStufen(
        'knoedel', 'Hollow Body Rocks', 'willenskraft',
        ['Knödel-Krümel', 'Knödel-Rolle', 'Knödel-Batzen', 'Knödel-Fürst', 'Knödel-Koloss'],
        STANDARD_PROGRESSION
      ),
    },
  };

  function monsterDaten(familyId, stufe) {
    const familie = FAMILIEN[familyId];
    if (!familie) throw new Error('Unbekannte Familie: ' + familyId);
    const daten = familie.stufen[stufe - 1];
    if (!daten) throw new Error('Unbekannte Stufe: ' + stufe);
    return daten;
  }

  function zufallsFamilie() {
    const keys = Object.keys(FAMILIEN);
    return keys[Math.floor(Math.random() * keys.length)];
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
  // Jede Familie hat einen eigenen Renderer, aber teilt sich Canvas-Maße
  // (160x220) und das Größe-wächst-mit-Stufe-Prinzip von Squat Goblin.

  function groesseFuer(stufe) {
    return 0.7 + (stufe - 1) * 0.15;
  }

  function renderSquatGoblin(stufe) {
    const farben = ['#4a7a3a', '#3f6e30', '#356024', '#8a3020', '#c0401a'];
    const namen = FAMILIEN.squat_goblin.stufen;
    const idx = stufe - 1;
    const farbe = farben[idx];
    const groesse = groesseFuer(stufe);
    const cx = 80;
    const cy = 110;
    const kopfR = 26 * groesse;
    const ohrLaenge = 20 * groesse;

    return `
      <svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${namen[idx].name}">
        <g fill="${farbe}">
          <path d="M ${cx - 26 * groesse} ${cy + 60 * groesse}
                   L ${cx - 30 * groesse} ${cy + 20 * groesse}
                   L ${cx - 8 * groesse} ${cy + 10 * groesse}
                   L ${cx - 6 * groesse} ${cy + 60 * groesse} Z"/>
          <path d="M ${cx + 26 * groesse} ${cy + 60 * groesse}
                   L ${cx + 30 * groesse} ${cy + 20 * groesse}
                   L ${cx + 8 * groesse} ${cy + 10 * groesse}
                   L ${cx + 6 * groesse} ${cy + 60 * groesse} Z"/>
          <ellipse cx="${cx}" cy="${cy}" rx="${34 * groesse}" ry="${28 * groesse}"/>
          <ellipse cx="${cx - 40 * groesse}" cy="${cy + 4 * groesse}" rx="${9 * groesse}" ry="${16 * groesse}" transform="rotate(-20 ${cx - 40 * groesse} ${cy + 4 * groesse})"/>
          <ellipse cx="${cx + 40 * groesse}" cy="${cy + 4 * groesse}" rx="${9 * groesse}" ry="${16 * groesse}" transform="rotate(20 ${cx + 40 * groesse} ${cy + 4 * groesse})"/>
          <circle cx="${cx}" cy="${cy - 40 * groesse}" r="${kopfR}"/>
          <path d="M ${cx - kopfR + 4} ${cy - 40 * groesse - 6}
                   Q ${cx - kopfR - ohrLaenge} ${cy - 40 * groesse - ohrLaenge}
                     ${cx - kopfR + 2} ${cy - 40 * groesse + 10} Z"/>
          <path d="M ${cx + kopfR - 4} ${cy - 40 * groesse - 6}
                   Q ${cx + kopfR + ohrLaenge} ${cy - 40 * groesse - ohrLaenge}
                     ${cx + kopfR - 2} ${cy - 40 * groesse + 10} Z"/>
        </g>
        <g fill="#e8d840">
          <circle cx="${cx - 9 * groesse}" cy="${cy - 42 * groesse}" r="${3.5 * groesse}"/>
          <circle cx="${cx + 9 * groesse}" cy="${cy - 42 * groesse}" r="${3.5 * groesse}"/>
        </g>
        <g fill="#14100c">
          <circle cx="${cx - 9 * groesse}" cy="${cy - 42 * groesse}" r="${1.4 * groesse}"/>
          <circle cx="${cx + 9 * groesse}" cy="${cy - 42 * groesse}" r="${1.4 * groesse}"/>
        </g>
        <path d="M ${cx - 6 * groesse} ${cy - 28 * groesse} L ${cx - 3 * groesse} ${cy - 20 * groesse} L ${cx} ${cy - 28 * groesse} Z" fill="#f0ead6"/>
        <path d="M ${cx + 6 * groesse} ${cy - 28 * groesse} L ${cx + 3 * groesse} ${cy - 20 * groesse} L ${cx} ${cy - 28 * groesse} Z" fill="#f0ead6"/>
      </svg>
    `;
  }

  // Dämon in Liegestütz-Position: flacher Torso, gestreckte Arme/Beine, Hörner.
  function renderPusherDemon(stufe) {
    const farben = ['#7a2a2a', '#8a2020', '#9a1818', '#b81010', '#e01808'];
    const namen = FAMILIEN.pusher_demon.stufen;
    const idx = stufe - 1;
    const farbe = farben[idx];
    const g = groesseFuer(stufe);
    const cx = 80;
    const cy = 130;

    return `
      <svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${namen[idx].name}">
        <g fill="${farbe}">
          <!-- Arme (gestreckt, Liegestütz-Halt) -->
          <rect x="${cx - 46 * g}" y="${cy - 6 * g}" width="${10 * g}" height="${40 * g}" rx="4" transform="rotate(-12 ${cx - 46 * g} ${cy - 6 * g})"/>
          <rect x="${cx + 36 * g}" y="${cy - 6 * g}" width="${10 * g}" height="${40 * g}" rx="4" transform="rotate(12 ${cx + 36 * g} ${cy - 6 * g})"/>
          <!-- Beine (gestreckt nach hinten) -->
          <rect x="${cx - 20 * g}" y="${cy + 22 * g}" width="${44 * g}" height="${10 * g}" rx="4"/>
          <!-- Torso (flach, Plank) -->
          <ellipse cx="${cx}" cy="${cy}" rx="${40 * g}" ry="${16 * g}"/>
          <!-- Kopf -->
          <circle cx="${cx - 34 * g}" cy="${cy - 14 * g}" r="${16 * g}"/>
          <!-- Hörner -->
          <path d="M ${cx - 44 * g} ${cy - 24 * g} L ${cx - 50 * g} ${cy - 40 * g} L ${cx - 38 * g} ${cy - 26 * g} Z"/>
          <path d="M ${cx - 26 * g} ${cy - 24 * g} L ${cx - 18 * g} ${cy - 40 * g} L ${cx - 30 * g} ${cy - 26 * g} Z"/>
        </g>
        <g fill="#ffd020">
          <circle cx="${cx - 40 * g}" cy="${cy - 16 * g}" r="${2.6 * g}"/>
          <circle cx="${cx - 30 * g}" cy="${cy - 16 * g}" r="${2.6 * g}"/>
        </g>
        <path d="M ${cx - 38 * g} ${cy - 6 * g} L ${cx - 34 * g} ${cy - 1 * g} L ${cx - 30 * g} ${cy - 6 * g} Z" fill="#14100c"/>
      </svg>
    `;
  }

  // Runder Teigtaschen-Körper mit gekräuseltem Rand oben.
  function renderDumpling(stufe) {
    const farben = ['#e8d4a0', '#dcc48a', '#cfb374', '#c2a25e', '#b59148'];
    const namen = FAMILIEN.dumplings.stufen;
    const idx = stufe - 1;
    const farbe = farben[idx];
    const g = groesseFuer(stufe);
    const cx = 80;
    const cy = 130;
    const rx = 44 * g;
    const ry = 40 * g;

    let kraeusel = '';
    const anzahl = 7;
    for (let i = 0; i <= anzahl; i++) {
      const x = cx - rx + (i * (2 * rx)) / anzahl;
      kraeusel += `<circle cx="${x}" cy="${cy - ry + 4 * g}" r="${5 * g}"/>`;
    }

    return `
      <svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${namen[idx].name}">
        <g fill="${farbe}">
          <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>
          ${kraeusel}
          <!-- Stummelärmchen -->
          <circle cx="${cx - rx + 2 * g}" cy="${cy + 10 * g}" r="${8 * g}"/>
          <circle cx="${cx + rx - 2 * g}" cy="${cy + 10 * g}" r="${8 * g}"/>
        </g>
        <g fill="#5a3a1a">
          <circle cx="${cx - 12 * g}" cy="${cy - 2 * g}" r="${3 * g}"/>
          <circle cx="${cx + 12 * g}" cy="${cy - 2 * g}" r="${3 * g}"/>
        </g>
        <path d="M ${cx - 8 * g} ${cy + 12 * g} Q ${cx} ${cy + 18 * g} ${cx + 8 * g} ${cy + 12 * g}" stroke="#5a3a1a" stroke-width="${2 * g}" fill="none"/>
      </svg>
    `;
  }

  // Amorphe Kreatur mit einem großen Auge und Tentakel-Armen.
  function renderCreature(stufe) {
    const farben = ['#5a3a8a', '#6a2a9a', '#7a1aa8', '#8a10b0', '#a008c0'];
    const namen = FAMILIEN.creatures.stufen;
    const idx = stufe - 1;
    const farbe = farben[idx];
    const g = groesseFuer(stufe);
    const cx = 80;
    const cy = 120;

    return `
      <svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${namen[idx].name}">
        <g fill="${farbe}">
          <!-- Tentakel -->
          <path d="M ${cx - 30 * g} ${cy + 10 * g} Q ${cx - 55 * g} ${cy + 30 * g} ${cx - 40 * g} ${cy + 60 * g}
                   Q ${cx - 34 * g} ${cy + 40 * g} ${cx - 20 * g} ${cy + 20 * g} Z"/>
          <path d="M ${cx + 30 * g} ${cy + 10 * g} Q ${cx + 55 * g} ${cy + 30 * g} ${cx + 40 * g} ${cy + 60 * g}
                   Q ${cx + 34 * g} ${cy + 40 * g} ${cx + 20 * g} ${cy + 20 * g} Z"/>
          <!-- Blob-Körper (unregelmäßig) -->
          <path d="M ${cx} ${cy - 46 * g}
                   Q ${cx + 42 * g} ${cy - 40 * g} ${cx + 38 * g} ${cy + 10 * g}
                   Q ${cx + 34 * g} ${cy + 48 * g} ${cx} ${cy + 46 * g}
                   Q ${cx - 34 * g} ${cy + 48 * g} ${cx - 38 * g} ${cy + 10 * g}
                   Q ${cx - 42 * g} ${cy - 40 * g} ${cx} ${cy - 46 * g} Z"/>
        </g>
        <!-- Großes Auge -->
        <circle cx="${cx}" cy="${cy - 4 * g}" r="${16 * g}" fill="#e8f0d0"/>
        <circle cx="${cx}" cy="${cy - 4 * g}" r="${8 * g}" fill="#14100c"/>
        <circle cx="${cx + 3 * g}" cy="${cy - 7 * g}" r="${2.5 * g}" fill="#fff"/>
      </svg>
    `;
  }

  // Schlange spiralig um einen Spieß gewickelt, mit Fleisch-Segmenten.
  function renderKebabSnake(stufe) {
    const farben = ['#8a4a2a', '#9a3a1a', '#a82a10', '#b81a08', '#c80800'];
    const namen = FAMILIEN.killer_kebab_snakes.stufen;
    const idx = stufe - 1;
    const farbe = farben[idx];
    const g = groesseFuer(stufe);
    const cx = 80;
    const spiessTop = 40;
    const spiessBottom = 200;

    let segmente = '';
    const anzahlSegmente = 5;
    for (let i = 0; i < anzahlSegmente; i++) {
      const y = spiessTop + 20 + i * ((spiessBottom - spiessTop - 40) / (anzahlSegmente - 1));
      const richtungLinks = i % 2 === 0;
      const offsetX = richtungLinks ? -18 * g : 18 * g;
      segmente += `<ellipse cx="${cx + offsetX}" cy="${y}" rx="${20 * g}" ry="${13 * g}" fill="${farbe}"/>`;
    }

    return `
      <svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${namen[idx].name}">
        <!-- Spieß -->
        <rect x="${cx - 2}" y="${spiessTop - 14}" width="4" height="${spiessBottom - spiessTop + 28}" fill="#b0a898"/>
        <polygon points="${cx - 5},${spiessTop - 14} ${cx + 5},${spiessTop - 14} ${cx},${spiessTop - 26}" fill="#8a8070"/>
        ${segmente}
        <!-- Schlangenkopf oben -->
        <g fill="${farbe}">
          <circle cx="${cx}" cy="${spiessTop}" r="${16 * g}"/>
          <path d="M ${cx - 4 * g} ${spiessTop + 14 * g} L ${cx - 10 * g} ${spiessTop + 26 * g} L ${cx} ${spiessTop + 18 * g} L ${cx + 10 * g} ${spiessTop + 26 * g} L ${cx + 4 * g} ${spiessTop + 14 * g} Z"/>
        </g>
        <g fill="#e8d840">
          <circle cx="${cx - 6 * g}" cy="${spiessTop - 2 * g}" r="${2.6 * g}"/>
          <circle cx="${cx + 6 * g}" cy="${spiessTop - 2 * g}" r="${2.6 * g}"/>
        </g>
      </svg>
    `;
  }

  // Runder Knödel-Körper mit Gabel und Dampf-Schwaden.
  function renderKnoedel(stufe) {
    const farben = ['#f0ead8', '#e8dcc0', '#dcd0ac', '#d0c498', '#c4b884'];
    const namen = FAMILIEN.knoedel.stufen;
    const idx = stufe - 1;
    const farbe = farben[idx];
    const g = groesseFuer(stufe);
    const cx = 80;
    const cy = 130;
    const r = 42 * g;

    return `
      <svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${namen[idx].name}">
        <!-- Dampf -->
        <g stroke="#cfead0" stroke-width="${3 * g}" fill="none" opacity="0.8">
          <path d="M ${cx - 14 * g} ${cy - r - 6} Q ${cx - 20 * g} ${cy - r - 20} ${cx - 12 * g} ${cy - r - 34}"/>
          <path d="M ${cx + 14 * g} ${cy - r - 6} Q ${cx + 20 * g} ${cy - r - 20} ${cx + 12 * g} ${cy - r - 34}"/>
        </g>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${farbe}"/>
        <g fill="#6a5a3a">
          <circle cx="${cx - 12 * g}" cy="${cy - 6 * g}" r="${3 * g}"/>
          <circle cx="${cx + 12 * g}" cy="${cy - 6 * g}" r="${3 * g}"/>
        </g>
        <path d="M ${cx - 8 * g} ${cy + 8 * g} Q ${cx} ${cy + 2 * g} ${cx + 8 * g} ${cy + 8 * g}" stroke="#6a5a3a" stroke-width="${2 * g}" fill="none"/>
        <!-- Gabel im Knödel -->
        <g stroke="#9a9a9a" stroke-width="${2.5 * g}" fill="none">
          <line x1="${cx + r - 10 * g}" y1="${cy - r + 4 * g}" x2="${cx + r - 24 * g}" y2="${cy - 4 * g}"/>
          <line x1="${cx + r - 6 * g}" y1="${cy - r - 2 * g}" x2="${cx + r - 18 * g}" y2="${cy - r + 10 * g}"/>
          <line x1="${cx + r - 14 * g}" y1="${cy - r - 2 * g}" x2="${cx + r - 26 * g}" y2="${cy - r + 10 * g}"/>
        </g>
      </svg>
    `;
  }

  const RENDERER = {
    squat_goblin: renderSquatGoblin,
    pusher_demon: renderPusherDemon,
    dumplings: renderDumpling,
    creatures: renderCreature,
    killer_kebab_snakes: renderKebabSnake,
    knoedel: renderKnoedel,
  };

  function renderMonsterSVG(familyId, stufe) {
    const renderer = RENDERER[familyId];
    if (!renderer) throw new Error('Kein Renderer für Familie: ' + familyId);
    return renderer(stufe);
  }

  return {
    FAMILIEN,
    monsterDaten,
    zufallsFamilie,
    zufallsStufe,
    renderMonsterSVG,
  };
})();
