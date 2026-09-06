/**
 * monsters.js — Monster-Familien-System (Punkt 5.1/5.2 aus HANDOVER.md)
 *
 * 7 Familien: Squat Goblin, Pusher Demon, Dumplings, Burger, Killer
 * Kebab Snakes, Knödel, Plumpi. Übungen sind auf User-Wunsch (2026-09-06)
 * durchgehend auf "überall ausführbar" umgestellt — keine Boden-/
 * Liege-Übungen mehr außer Liegestütze. Klimmzüge bleiben draußen,
 * Ersatz ist Split Squats (siehe 11.2) — jetzt Plumpis Übung.
 */

const WoFMonsters = (() => {
  // Rep-Progressionen (Punkt 5.2): Standard 5->10->20->50->100,
  // Ausnahme Push-Ups (schwerer): 5->10->20->35->50.
  const STANDARD_PROGRESSION = [5, 10, 20, 50, 100];
  const PUSHUP_PROGRESSION = [5, 10, 20, 35, 50];
  // Standing Arnold Press (User-Vorgabe: "10 in der ersten Stufe" statt
  // Standard-5) — doppelte Standard-Progression, gleiche Eskalationsform.
  const ARNOLD_PRESS_PROGRESSION = [10, 20, 40, 100, 200];

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
      sprueche: ['Kein Goblin schlägt eine gute Kniebeuge!', 'Beug dich – bevor ER es tut!'],
      stufen: baueStufen(
        'squat_goblin', 'Kniebeugen', 'muskelaufbau',
        ['Squat Goblin', 'Squat Goblin Krieger', 'Squat Goblin Than', 'Squat Goblin Schamane', 'Squat Goblin Häuptling'],
        STANDARD_PROGRESSION
      ),
    },
    pusher_demon: {
      id: 'pusher_demon',
      name: 'Pusher Demon',
      uebung: 'Liegestütze',
      einheit: 'reps',
      bonusStat: 'kraft',
      sprueche: ['Drück durch, der Dämon guckt zu!', 'Push it, push it real good!'],
      stufen: baueStufen(
        'pusher_demon', 'Liegestütze', 'kraft',
        ['Pusher Dämon', 'Pusher Demon Warrior', 'Pusher Demon Desolator', 'Pusher Demon Devestator', 'Pusher Demon Terminator'],
        PUSHUP_PROGRESSION
      ),
    },
    dumplings: {
      id: 'dumplings',
      name: 'Dumplings',
      uebung: 'Hampelmänner',
      einheit: 'reps',
      bonusStat: 'muskelaufbau',
      sprueche: ['Iss keine Dumplings – mach Hampelmänner!', 'Knusprig wird nur, wer durchhält.'],
      stufen: baueStufen(
        'dumplings', 'Hampelmänner', 'muskelaufbau',
        ['Dumplings', 'Dumpling Tumbler', 'Dumpling Roller', 'Dumpling Slider', 'Dumpling Avalanche'],
        STANDARD_PROGRESSION
      ),
    },
    creatures: {
      id: 'creatures',
      name: 'Burger',
      uebung: 'Crab Walks',
      einheit: 'reps',
      bonusStat: 'ausdauer',
      sprueche: ['Sei kein Burger – verbrenn ihn mit Crab Walks!', 'Crab Walks schlagen jeden Cheeseburger.'],
      stufen: baueStufen(
        'creatures', 'Crab Walks', 'ausdauer',
        ['Creature', 'Creature Rare', 'Creature Medium-Rare', 'Creature Medium', 'Creature Done'],
        STANDARD_PROGRESSION
      ),
    },
    killer_kebab_snakes: {
      id: 'killer_kebab_snakes',
      name: 'Killer Kebab Snakes',
      uebung: 'Leg Raises',
      einheit: 'reps',
      bonusStat: 'beweglichkeit',
      sprueche: ['Dreh dich, bevor die Schlange zubeißt!', 'Twist it like a Döner-Spieß!'],
      stufen: baueStufen(
        'killer_kebab_snakes', 'Leg Raises', 'beweglichkeit',
        ['Killer Kebab', 'Killer Kebab Worm', 'Killer Kebab Snake', 'Killer Kebab Kobra', 'Killer Kebab Basilisk'],
        STANDARD_PROGRESSION
      ),
    },
    knoedel: {
      id: 'knoedel',
      name: 'Knödel',
      uebung: 'Standing Arnold Press',
      einheit: 'reps',
      bonusStat: 'willenskraft',
      sprueche: ['Sei kein Knödel, mach Crunches!', 'Roll dich zusammen, bevor der Knödel es tut!'],
      stufen: baueStufen(
        'knoedel', 'Standing Arnold Press', 'willenskraft',
        ['Knödel Base', 'Knödel Double', 'Knödel Triple', 'Knödel Quad', 'Knödel Pyramide'],
        ARNOLD_PRESS_PROGRESSION
      ),
    },
    plumpi: {
      id: 'plumpi',
      name: 'Plumpi',
      uebung: 'Split Squats',
      einheit: 'reps',
      bonusStat: 'kraft',
      sprueche: [],
      stufen: baueStufen(
        'plumpi', 'Split Squats', 'kraft',
        ['Plumpi', 'Superplumpi', 'Ultraplumpi', 'Megaplumpi', 'Hyperplumpi'],
        STANDARD_PROGRESSION
      ),
    },
  };

  // Zufälligen Kampfspruch für Popup beim Kampfstart auswählen (Punkt
  // 6.2-Ergänzung, User-Wunsch: "Sei kein Knödel, mach Crunches"). Von
  // combat.js sowohl für Mob- als auch Boss-Kämpfe genutzt (siehe bosses.js).
  function zufallsSpruch(sprueche) {
    if (!sprueche || sprueche.length === 0) return null;
    return sprueche[Math.floor(Math.random() * sprueche.length)];
  }

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

  // Burger-Kreatur (User-Rückmeldung: "Die Kreaturen sind eigentlich
  // Burger", danach präzisiert: krabbenartiges Wesen mit acht
  // Gliedmaßen — internes familyId "creatures"/Übung/Bonus-Stat bleiben
  // unverändert). Größe = Anzahl Patties = Stufe (1 Patty bei Stufe 1,
  // 5 Patties bei Stufe 5), JEDES Patty hat seine eigene Käsescheibe
  // (Cheeseburger -> Doublecheese -> ... -> Quintuple-Cheese, User-
  // Wunsch). Zusätzlicher Belag wächst mit der Stufe: ab 3 Salat, ab 4
  // Tomate, ab 5 Flammen — Soße ist immer dabei (das "Kreatur"-Element).
  function renderCreature(stufe) {
    const idx = stufe - 1;
    const g = groesseFuer(stufe);
    const namen = FAMILIEN.creatures.stufen;
    const cx = 80;

    const pattyAnzahl = stufe;
    const hatSalat = stufe >= 3;
    const hatTomate = stufe >= 4;
    const hatFlamme = stufe >= 5;

    const bunFarben = ['#e8c888', '#e0bc78', '#d8b068', '#c89858', '#a87840'];
    const pattyFarben = ['#7a4a28', '#6a3a20', '#5a2e18', '#4a2412', '#3a1a0a'];
    const beinFarbe = '#8a6838';
    const bunFarbe = bunFarben[idx];
    const pattyFarbe = pattyFarben[idx];

    const breite = 36 * g;
    const pattyDicke = 8 * g;
    // Bei bis zu 5 Patties (statt vorher max. 3) enger stapeln, damit der
    // Turm nicht aus dem 220px-Canvas herauswächst.
    const pattyAbstand = 12 * g;

    // Patty-Stapel um die Canvas-Mitte (cy=120) herum aufbauen; je mehr
    // Patties, desto tiefer reicht der Stapel nach unten.
    const pattyStartCy = 104;
    const pattyCys = [];
    for (let p = 0; p < pattyAnzahl; p++) pattyCys.push(pattyStartCy + p * pattyAbstand);
    const unterstesPattyCy = pattyCys[pattyCys.length - 1];
    const unterBunCy = unterstesPattyCy + pattyAbstand;
    const oberBunCy = pattyStartCy - pattyAbstand * 0.9;

    // Acht Gliedmaßen wie eine Krabbe: oberstes Paar sind Arme mit
    // Zangen, die restlichen drei Paare sind Laufbeine — gleichmäßig
    // über die Stapelhöhe verteilt, hinter dem Burger gezeichnet.
    function gliedmasse(seite, y, mitZange) {
      const laenge = 26 * g;
      const x0 = cx + seite * (breite - 4 * g);
      const xMitte = cx + seite * (breite * 0.5 + laenge * 0.5);
      const yMitte = y + laenge * 0.3;
      const xEnde = cx + seite * (breite + laenge);
      const yEnde = y + laenge * 0.55;
      const zange = mitZange
        ? `<circle cx="${xEnde.toFixed(1)}" cy="${yEnde.toFixed(1)}" r="${3.5 * g}" fill="${bunFarbe}" stroke="${beinFarbe}" stroke-width="1"/>`
        : '';
      return `<path d="M ${x0.toFixed(1)} ${y.toFixed(1)} Q ${xMitte.toFixed(1)} ${yMitte.toFixed(1)} ${xEnde.toFixed(1)} ${yEnde.toFixed(1)}"
                    stroke="${beinFarbe}" stroke-width="${3 * g}" stroke-linecap="round" fill="none"/>${zange}`;
    }
    let gliedmassen = '';
    for (let i = 0; i < 4; i++) {
      const y = oberBunCy + ((i + 0.5) * (unterBunCy - oberBunCy)) / 4;
      const mitZange = i === 0; // oberstes Paar = Arme mit Zangen, Rest = Beine
      gliedmassen += gliedmasse(-1, y, mitZange) + gliedmasse(1, y, mitZange);
    }

    // Soße (Ketchup-Schlangenlinie) — immer sichtbar, das "Kreatur"-Detail.
    const soesseHtml = `<path d="M ${(cx - breite * 0.7).toFixed(1)} ${(oberBunCy - 6 * g).toFixed(1)}
                                Q ${(cx - breite * 0.3).toFixed(1)} ${(oberBunCy - 14 * g).toFixed(1)} ${cx} ${(oberBunCy - 6 * g).toFixed(1)}
                                Q ${(cx + breite * 0.3).toFixed(1)} ${(oberBunCy + 2 * g).toFixed(1)} ${(cx + breite * 0.7).toFixed(1)} ${(oberBunCy - 6 * g).toFixed(1)}"
                                stroke="#c0301a" stroke-width="${2.4 * g}" fill="none" stroke-linecap="round"/>`;

    // Jedes Patty bekommt seine eigene Käsescheibe obendrauf (Cheeseburger
    // -> Doublecheese -> Triplecheese -> ... — auf Wunsch des Users "fünf
    // Pattys mit Käse", nicht nur eine einzelne Scheibe oben auf dem Stapel).
    function kaeseFuerPatty(py) {
      return `<path d="M ${cx - breite + 2 * g} ${py - pattyDicke}
                      Q ${cx - breite * 0.4} ${py - pattyDicke + 8 * g} ${cx - breite * 0.1} ${py - pattyDicke}
                      Q ${cx + breite * 0.3} ${py - pattyDicke + 7 * g} ${cx + breite - 2 * g} ${py - pattyDicke}
                      L ${cx + breite - 2 * g} ${py - pattyDicke - 6 * g}
                      L ${cx - breite + 2 * g} ${py - pattyDicke - 6 * g} Z" fill="#f0c020"/>`;
    }

    const pattySchichten = pattyCys
      .map((py) => `<ellipse cx="${cx}" cy="${py}" rx="${breite - 3 * g}" ry="${pattyDicke}" fill="${pattyFarbe}"/>`)
      .join('');
    // Käse wird GANZ ZULETZT gezeichnet (siehe Aufbau unten) — sonst
    // verschwindet die oberste Scheibe unterm oberen Brötchen, weil das
    // sonst als letztes über sie gemalt würde. So liegt der Käse sichtbar
    // über dem Bun-Rand, wie geschmolzener Käse an einem echten Burger.
    const kaeseSchichten = pattyCys.map((py) => kaeseFuerPatty(py)).join('');

    const salatCy = oberBunCy + 8 * g;
    const salatHtml = hatSalat
      ? `<path d="M ${cx - breite - 6 * g} ${salatCy + 4 * g}
                 Q ${cx - breite * 0.4} ${salatCy - 8 * g} ${cx} ${salatCy}
                 Q ${cx + breite * 0.4} ${salatCy - 8 * g} ${cx + breite + 6 * g} ${salatCy + 4 * g}
                 L ${cx + breite + 4 * g} ${salatCy + 12 * g}
                 Q ${cx} ${salatCy + 4 * g} ${cx - breite - 4 * g} ${salatCy + 12 * g} Z" fill="#5a9a3a"/>`
      : '';

    const tomateHtml = hatTomate
      ? `<circle cx="${cx - breite - 3 * g}" cy="${unterstesPattyCy}" r="${6 * g}" fill="#c0301a"/>
         <circle cx="${cx + breite + 3 * g}" cy="${unterstesPattyCy}" r="${6 * g}" fill="#c0301a"/>`
      : '';

    let sesam = '';
    for (let i = 0; i < 5; i++) {
      const sx = cx - breite * 0.6 + (i * (breite * 1.2)) / 4;
      sesam += `<ellipse cx="${sx.toFixed(1)}" cy="${(oberBunCy - 8 * g).toFixed(1)}" rx="${2 * g}" ry="${1.2 * g}" fill="#fff6dc"/>`;
    }

    const flammeHtml = hatFlamme
      ? `<g stroke="#ff8020" stroke-width="${2.4 * g}" fill="none" opacity="0.85">
           <path d="M ${cx - 16 * g} ${oberBunCy - 14 * g} Q ${cx - 22 * g} ${oberBunCy - 28 * g} ${cx - 14 * g} ${oberBunCy - 40 * g}"/>
           <path d="M ${cx + 16 * g} ${oberBunCy - 14 * g} Q ${cx + 22 * g} ${oberBunCy - 28 * g} ${cx + 14 * g} ${oberBunCy - 40 * g}"/>
         </g>`
      : '';

    const gesichtCy = pattyStartCy;

    return `
      <svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${namen[idx].name}">
        ${flammeHtml}
        <!-- Acht Gliedmaßen (Krabben-Optik), hinter dem Burger -->
        ${gliedmassen}
        <!-- Unteres Brötchen -->
        <ellipse cx="${cx}" cy="${unterBunCy}" rx="${breite}" ry="${9 * g}" fill="${bunFarbe}"/>
        <!-- Patty(s), Tomate, Salat -->
        ${pattySchichten}
        ${tomateHtml}
        ${salatHtml}
        <!-- Oberes Brötchen (Kuppel) mit Sesam -->
        <ellipse cx="${cx}" cy="${oberBunCy}" rx="${breite - 2 * g}" ry="${13 * g}" fill="${bunFarbe}"/>
        ${sesam}
        <!-- Käse zuletzt: liegt sichtbar über dem Bun-Rand -->
        ${kaeseSchichten}
        ${soesseHtml}
        <!-- Böses Gesicht auf dem obersten Patty -->
        <g fill="#f0d840">
          <circle cx="${cx - 9 * g}" cy="${gesichtCy}" r="${3 * g}"/>
          <circle cx="${cx + 9 * g}" cy="${gesichtCy}" r="${3 * g}"/>
        </g>
        <g fill="#14100c">
          <circle cx="${cx - 9 * g}" cy="${gesichtCy}" r="${1.3 * g}"/>
          <circle cx="${cx + 9 * g}" cy="${gesichtCy}" r="${1.3 * g}"/>
        </g>
        <path d="M ${cx - 7 * g} ${gesichtCy + 8 * g} Q ${cx} ${gesichtCy + 3 * g} ${cx + 7 * g} ${gesichtCy + 8 * g}" stroke="#2a1608" stroke-width="${2 * g}" fill="none"/>
      </svg>
    `;
  }

  // Döner-Spieß: ein simpler Metallspieß mit einem Fleisch-Kegel drumrum
  // (User-Wunsch: "kann das einfach ein Spieß sein und Fleisch drum
  // rum?"), der mit jeder Stufe spürbar dicker wird — abgelöst vom
  // vorherigen Design mit spiralig gewickelten Fleisch-Segmenten und
  // Schlangenkopf.
  function renderKebabSnake(stufe) {
    const farben = ['#8a4a2a', '#9a3a1a', '#a82a10', '#b81a08', '#c80800'];
    const namen = FAMILIEN.killer_kebab_snakes.stufen;
    const idx = stufe - 1;
    const farbe = farben[idx];
    const g = groesseFuer(stufe);
    const cx = 80;
    const spiessSpitze = 24;
    const spiessUnten = 208;
    const fleischOben = 50;
    const fleischUnten = 200;

    // Radius wächst direkt mit der Stufe (nicht nur mit der generellen
    // Größenskalierung g) — damit der Dickenzuwachs deutlich sichtbar ist.
    // Echter Dönerspieß: oben dicker, unten dünner (User-Korrektur).
    const radiusOben = (16 + stufe * 6) * g;
    const radiusUnten = (8 + stufe * 2) * g;

    const kegelPfad = `M ${cx - radiusOben} ${fleischOben}
                        L ${cx + radiusOben} ${fleischOben}
                        L ${cx + radiusUnten} ${fleischUnten}
                        L ${cx - radiusUnten} ${fleischUnten} Z`;

    // Waagerechte Schnittlinien wie bei abgeschnittenem Dönerfleisch —
    // mehr Schichten je dicker der Spieß.
    let schichten = '';
    const anzahlSchichten = 3 + stufe;
    for (let i = 1; i < anzahlSchichten; i++) {
      const t = i / anzahlSchichten;
      const y = fleischOben + t * (fleischUnten - fleischOben);
      const r = radiusOben + t * (radiusUnten - radiusOben);
      schichten += `<line x1="${(cx - r).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(cx + r).toFixed(1)}" y2="${y.toFixed(1)}" stroke="#4a1408" stroke-width="1.5" opacity="0.6"/>`;
    }

    const augeCy = fleischOben + 16 * g;

    return `
      <svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${namen[idx].name}">
        <!-- Fleisch-Kegel -->
        <path d="${kegelPfad}" fill="${farbe}"/>
        ${schichten}
        <!-- Spieß, oben und unten überstehend -->
        <rect x="${cx - 2}" y="${spiessSpitze}" width="4" height="${spiessUnten - spiessSpitze}" fill="#b0a898"/>
        <polygon points="${cx - 5},${spiessSpitze} ${cx + 5},${spiessSpitze} ${cx},${spiessSpitze - 14}" fill="#8a8070"/>
        <!-- Augen -->
        <g fill="#e8d840">
          <circle cx="${cx - 7 * g}" cy="${augeCy}" r="${2.8 * g}"/>
          <circle cx="${cx + 7 * g}" cy="${augeCy}" r="${2.8 * g}"/>
        </g>
        <g fill="#14100c">
          <circle cx="${cx - 7 * g}" cy="${augeCy}" r="${1.2 * g}"/>
          <circle cx="${cx + 7 * g}" cy="${augeCy}" r="${1.2 * g}"/>
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

  // Plumpi: die "alte Kreatur" (ursprünglich unter "creatures" laufend,
  // bevor die Familie zu Burger umgestaltet wurde) — zu goldig zum
  // Verschrotten, jetzt als eigene 7. Familie wiederbelebt. Amorpher
  // lila Blob mit Tentakel-Armen und großem Auge, unverändert vom
  // Original-Design übernommen.
  function renderPlumpi(stufe) {
    const farben = ['#5a3a8a', '#6a2a9a', '#7a1aa8', '#8a10b0', '#a008c0'];
    const namen = FAMILIEN.plumpi.stufen;
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

  const RENDERER = {
    squat_goblin: renderSquatGoblin,
    pusher_demon: renderPusherDemon,
    dumplings: renderDumpling,
    creatures: renderCreature,
    killer_kebab_snakes: renderKebabSnake,
    knoedel: renderKnoedel,
    plumpi: renderPlumpi,
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
    zufallsSpruch,
  };
})();
