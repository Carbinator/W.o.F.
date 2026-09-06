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

  // Farbschema auf Wunsch des Users: Hellgrün -> Grün -> Dunkelgrün ->
  // Grün/Rot -> Rot. Die "Grün/Rot"-Übergangsstufe wird nicht als
  // Mischfarbe (ergäbe nur ein trübes Braun), sondern als zweifarbiger
  // Goblin umgesetzt — Körper noch grün, Kopf schon rot, als sichtbarer
  // Zwischenschritt zur reinroten Endstufe.
  function renderSquatGoblin(stufe) {
    const koerperFarben = ['#8fc75f', '#4f9c3a', '#234a18', '#3f6e30', '#c0301a'];
    const kopfFarben = ['#8fc75f', '#4f9c3a', '#234a18', '#c0301a', '#c0301a'];
    const namen = FAMILIEN.squat_goblin.stufen;
    const idx = stufe - 1;
    const koerperFarbe = koerperFarben[idx];
    const kopfFarbe = kopfFarben[idx];
    const groesse = groesseFuer(stufe);
    const cx = 80;
    const cy = 110;
    const kopfR = 26 * groesse;
    const ohrLaenge = 20 * groesse;

    return `
      <svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${namen[idx].name}">
        <g fill="${koerperFarbe}">
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
        </g>
        <g fill="${kopfFarbe}">
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

  // Knödel-Pyramide: pro Stufe genau eine Knödel-Kugel mehr (Stufe 1 = 1
  // Knödel, Stufe 5 = 5 Knödel), gestapelt zu einem kleinen Turm/Pyramide
  // unterhalb der Kopf-Kugel — auf Wunsch des Users, nachdem "mehr Stufe
  // = mehr Knödel" naheliegender war als bloß Größe/Farbe zu ändern.
  // Kürbis-artiges Fratzengesicht + Teigfäuste nur am Kopf, Pfeffer-/
  // Kräuterflecken-Textur per Glanz-Gradient auf allen Kugeln. Bleibt
  // Vektor/flach (Vorlage war ein gemaltes Referenzbild, siehe Kommentar
  // in der Commit-Historie) — kein Ersatz für echte Illustrationen.
  const KNOEDEL_REIHEN_PRO_STUFE = { 1: [], 2: [1], 3: [2], 4: [3], 5: [1, 3] };

  function renderKnoedel(stufe) {
    const farben = ['#f0ead8', '#e8dcc0', '#dcd0ac', '#c8a878', '#a8845a'];
    const namen = FAMILIEN.knoedel.stufen;
    const idx = stufe - 1;
    const farbe = farben[idx];
    const g = groesseFuer(stufe);
    const cx = 80;
    const ballR = 24 * g;
    const gradientId = `knoedelGlanz${idx}`;

    // Kopf bei relativer y=0 planen, weitere Knödel-Reihen darunter
    // staffeln (leichte Überlappung, damit sie wie aneinandergepresst/
    // aufgetürmt wirken statt lose zu schweben).
    let kopfCy = 0;
    let laufendeCy = kopfCy;
    const reihen = [];
    (KNOEDEL_REIHEN_PRO_STUFE[stufe] || []).forEach((anzahl) => {
      laufendeCy += ballR * 1.7;
      const breite = (anzahl - 1) * ballR * 1.7;
      const startX = cx - breite / 2;
      const xs = [];
      for (let i = 0; i < anzahl; i++) xs.push(startX + i * ballR * 1.7);
      reihen.push({ cy: laufendeCy, xs });
    });

    // Vertikal zentrieren, damit alle Stufen ungefähr gleich viel vom
    // Canvas füllen statt Stufe 1 winzig oben schweben zu lassen.
    const inhaltOben = kopfCy - ballR - 34;
    const inhaltUnten = (reihen.length ? reihen[reihen.length - 1].cy : kopfCy) + ballR + 16;
    const versatz = 120 - (inhaltOben + inhaltUnten) / 2;
    kopfCy += versatz;
    reihen.forEach((r) => { r.cy += versatz; });

    function texturPunkte(ballCx, ballCy, ballIdx) {
      const farbePunkt = ballIdx % 2 === 0 ? '#5a4028' : '#7a9a4a';
      let out = '';
      for (let i = 0; i < 3; i++) {
        const winkel = (i / 3) * Math.PI * 2 + ballIdx;
        const px = ballCx + Math.cos(winkel) * ballR * 0.5;
        const py = ballCy + Math.sin(winkel) * ballR * 0.4;
        out += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${2 * g}" fill="${farbePunkt}"/>`;
      }
      return out;
    }

    let extraKnoedel = '';
    let ballIdx = 0;
    reihen.forEach((reihe) => {
      reihe.xs.forEach((x) => {
        extraKnoedel += `<circle cx="${x.toFixed(1)}" cy="${reihe.cy.toFixed(1)}" r="${ballR}" fill="url(#${gradientId})" stroke="#8a7048" stroke-width="1.5"/>`;
        extraKnoedel += texturPunkte(x, reihe.cy, ballIdx);
        ballIdx += 1;
      });
    });

    return `
      <svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${namen[idx].name}">
        <defs>
          <radialGradient id="${gradientId}" cx="35%" cy="28%" r="75%">
            <stop offset="0%" stop-color="#fffdf5"/>
            <stop offset="55%" stop-color="${farbe}"/>
            <stop offset="100%" stop-color="#8a7048"/>
          </radialGradient>
        </defs>
        <!-- Dampf über dem Kopf -->
        <g stroke="#cfead0" stroke-width="${2.4 * g}" fill="none" opacity="0.75">
          <path d="M ${cx - 15 * g} ${kopfCy - ballR - 4} Q ${cx - 21 * g} ${kopfCy - ballR - 18} ${cx - 13 * g} ${kopfCy - ballR - 32}"/>
          <path d="M ${cx + 15 * g} ${kopfCy - ballR - 4} Q ${cx + 21 * g} ${kopfCy - ballR - 18} ${cx + 13 * g} ${kopfCy - ballR - 32}"/>
        </g>
        <!-- Teigfäuste am Kopf -->
        <g fill="url(#${gradientId})" stroke="#8a7048" stroke-width="1">
          <ellipse cx="${cx - ballR - 10 * g}" cy="${kopfCy + 6 * g}" rx="${13 * g}" ry="${15 * g}" transform="rotate(-25 ${cx - ballR - 10 * g} ${kopfCy + 6 * g})"/>
          <ellipse cx="${cx + ballR + 10 * g}" cy="${kopfCy + 6 * g}" rx="${13 * g}" ry="${15 * g}" transform="rotate(25 ${cx + ballR + 10 * g} ${kopfCy + 6 * g})"/>
        </g>
        <!-- Weitere Knödel (eine Kugel mehr pro Stufe) -->
        ${extraKnoedel}
        <!-- Kopf-Knödel mit Fratze -->
        <circle cx="${cx}" cy="${kopfCy}" r="${ballR}" fill="url(#${gradientId})" stroke="#8a7048" stroke-width="1.5"/>
        <g fill="#2a1a0a">
          <path d="M ${cx - 14 * g} ${kopfCy - 6 * g} L ${cx - 4 * g} ${kopfCy - 2 * g} L ${cx - 14 * g} ${kopfCy + 2 * g} Z"/>
          <path d="M ${cx + 14 * g} ${kopfCy - 6 * g} L ${cx + 4 * g} ${kopfCy - 2 * g} L ${cx + 14 * g} ${kopfCy + 2 * g} Z"/>
          <path d="M ${cx - 12 * g} ${kopfCy + 12 * g}
                   Q ${cx} ${kopfCy + 20 * g} ${cx + 12 * g} ${kopfCy + 12 * g}
                   L ${cx + 8 * g} ${kopfCy + 11 * g} L ${cx + 5 * g} ${kopfCy + 16 * g} L ${cx + 2 * g} ${kopfCy + 11 * g}
                   L ${cx - 2 * g} ${kopfCy + 16 * g} L ${cx - 5 * g} ${kopfCy + 11 * g} L ${cx - 8 * g} ${kopfCy + 16 * g} Z"/>
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
