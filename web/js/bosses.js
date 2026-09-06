/**
 * bosses.js — Einzigartige Bosse mit Cooldowns (Punkt 5.1B/5.3, Schritt 13)
 *
 * Alle Bosse erst ab Char-Lvl 10 spawnbar (Punkt 5.3). Jeder Boss hat
 * 2-3 Phasen (verschiedene Übungen nacheinander) — die konkrete
 * Phasen-Aufteilung war im HANDOVER nicht bis ins Detail spezifiziert
 * (nur je 1 Signature-Übung genannt); hier thematisch passend auf
 * 2-3 Phasen erweitert, wie Punkt 5.3 es explizit verlangt
 * ("Boss-Kämpfe sollten mehrphasig sein").
 *
 * Nevill/Sugartooth Devil ist laut Klärung (siehe HANDOVER Punkt 11.1)
 * NICHT hier drin — das ist ein eigenständiges Wesen für eine spätere
 * Content-Runde. Battering Ram dagegen schon (war die eigentliche
 * Auflösung der Nevill-Frage).
 */

const WoFBosses = (() => {
  // Eigene Annahme (im HANDOVER nicht spezifiziert): Basiswerte pro Tier.
  const TIER_BASIS = {
    klein: { cooldownStunden: 12, xpBasis: 400, goldBasis: 100, lootRarityMin: 'selten' },
    mittel: { cooldownStunden: 24, xpBasis: 700, goldBasis: 180, lootRarityMin: 'selten' },
    gross: { cooldownStunden: 48, xpBasis: 1500, goldBasis: 400, lootRarityMin: 'episch' },
  };

  const MIN_CHAR_LEVEL = 10;

  function phase(uebung, repZiel, bonusStat, einheit) {
    return { uebung, repZiel, bonusStat, einheit: einheit || 'reps' };
  }

  const BOSSE = {
    // ---- Kleine Bosse (12h Cooldown) ----------------------------------
    cornpop: {
      id: 'cornpop', name: 'Cornpop', tier: 'klein', ...TIER_BASIS.klein, minCharLevel: MIN_CHAR_LEVEL,
      phasen: [phase('Jumping Jacks', 20, 'ausdauer'), phase('Squat Jumps', 15, 'muskelaufbau')],
    },
    marsh_the_mallow: {
      id: 'marsh_the_mallow', name: 'Marsh the Mallow', tier: 'klein', ...TIER_BASIS.klein, minCharLevel: MIN_CHAR_LEVEL,
      phasen: [phase('Rolling Sit-Ups', 20, 'muskelaufbau'), phase('Hollow Body Hold', 20, 'willenskraft', 'sekunden')],
    },
    pan_doro: {
      id: 'pan_doro', name: 'Pan Doro', tier: 'klein', ...TIER_BASIS.klein, minCharLevel: MIN_CHAR_LEVEL,
      phasen: [phase('Tiefe Squats', 20, 'kraft'), phase('Wall Sit', 25, 'willenskraft', 'sekunden')],
    },
    pasta_busta: {
      id: 'pasta_busta', name: 'Pasta Busta', tier: 'klein', ...TIER_BASIS.klein, minCharLevel: MIN_CHAR_LEVEL,
      phasen: [phase('Sprints (High Knees)', 25, 'ausdauer'), phase('Burpees', 12, 'ausdauer')],
    },
    nutcruncher: {
      id: 'nutcruncher', name: 'Nutcruncher', tier: 'klein', ...TIER_BASIS.klein, minCharLevel: MIN_CHAR_LEVEL,
      phasen: [phase('Punches', 30, 'kraft'), phase('Mountain Climbers', 20, 'ausdauer')],
    },

    // ---- Mittlere Bosse (24h Cooldown) ---------------------------------
    fleur_the_flourduster: {
      id: 'fleur_the_flourduster', name: 'Fleur the Flourduster', tier: 'mittel', ...TIER_BASIS.mittel, minCharLevel: MIN_CHAR_LEVEL,
      phasen: [phase('High Knees', 30, 'ausdauer'), phase('Burpees', 15, 'ausdauer')],
    },
    daemoniz: {
      id: 'daemoniz', name: 'Deniz / Daemoniz', tier: 'mittel', ...TIER_BASIS.mittel, minCharLevel: MIN_CHAR_LEVEL,
      phasen: [phase('Superman Hold', 25, 'willenskraft', 'sekunden'), phase('Hollow Body Hold', 25, 'willenskraft', 'sekunden')],
    },
    nightshade_the_carbmaid: {
      id: 'nightshade_the_carbmaid', name: 'Nightshade the Carbmaid', tier: 'mittel', ...TIER_BASIS.mittel, minCharLevel: MIN_CHAR_LEVEL,
      phasen: [phase('Plank', 30, 'willenskraft', 'sekunden'), phase('Side Plank', 20, 'willenskraft', 'sekunden')],
    },
    chap_the_fruit_monk: {
      id: 'chap_the_fruit_monk', name: 'Chap the Fruit Monk', tier: 'mittel', ...TIER_BASIS.mittel, minCharLevel: MIN_CHAR_LEVEL,
      phasen: [phase('Burpees', 15, 'ausdauer'), phase('Mountain Climbers', 25, 'ausdauer')],
    },
    jack_the_2nd_fruit_monk: {
      id: 'jack_the_2nd_fruit_monk', name: 'Jack the 2nd Fruit Monk', tier: 'mittel', ...TIER_BASIS.mittel, minCharLevel: MIN_CHAR_LEVEL,
      phasen: [phase('Heavy Squats', 25, 'kraft'), phase('Lunges', 20, 'kraft')],
    },
    le_tofu_bunnay: {
      id: 'le_tofu_bunnay', name: 'Le Tofu Bunnay', tier: 'mittel', ...TIER_BASIS.mittel, minCharLevel: MIN_CHAR_LEVEL,
      phasen: [phase('Jump Squats', 20, 'muskelaufbau'), phase('High Knees', 25, 'ausdauer')],
    },
    battering_ram: {
      id: 'battering_ram', name: 'Battering Ram', tier: 'mittel', ...TIER_BASIS.mittel, minCharLevel: MIN_CHAR_LEVEL,
      flavorText: 'Zuckerdiamant-Zähne, Wächter des Buttercup Palace — kalorienfrei, aber zäh.',
      phasen: [phase('Sprint-Intervalle (High Knees)', 25, 'ausdauer'), phase('Push-Ups', 20, 'kraft')],
    },

    // ---- Große Endbosse (48h Cooldown) ---------------------------------
    sugarking_kane: {
      id: 'sugarking_kane', name: 'Sugarking Kane', tier: 'gross', ...TIER_BASIS.gross, minCharLevel: MIN_CHAR_LEVEL,
      flavorText: 'Kalorienbombe erlegt — Carbinator hätte sich hier den ganzen Tag gestärkt.',
      phasen: [phase('Squats', 30, 'muskelaufbau'), phase('Push-Ups', 25, 'kraft'), phase('Plank', 40, 'willenskraft', 'sekunden')],
    },
    vee_gain_le_fay: {
      id: 'vee_gain_le_fay', name: 'Vee Gain Le Fay / Firestorm', tier: 'gross', ...TIER_BASIS.gross, minCharLevel: MIN_CHAR_LEVEL,
      flavorText: 'Acht Beine, null Zucker mehr übrig — Carbinator nickt anerkennend.',
      phasen: [phase('Mountain Climbers', 30, 'ausdauer'), phase('Bear Crawls', 20, 'beweglichkeit'), phase('Plank', 35, 'willenskraft', 'sekunden')],
    },
    ed_the_fat: {
      id: 'ed_the_fat', name: 'Ed the Fat', tier: 'gross', ...TIER_BASIS.gross, minCharLevel: MIN_CHAR_LEVEL,
      flavorText: 'Ein Marathon gegen das Fett-Wesen — kalorienreich, aber besiegt.',
      phasen: [phase('Jumping Jacks', 35, 'ausdauer'), phase('High Knees', 35, 'ausdauer'), phase('Burpees', 20, 'ausdauer')],
    },
    zuckerhydra: {
      id: 'zuckerhydra', name: 'Zuckerhydra', tier: 'gross', ...TIER_BASIS.gross, minCharLevel: MIN_CHAR_LEVEL,
      flavorText: 'Jeder Kopf ein Zuckerschock — alle drei liegen flach.',
      // HIIT-Modus (Punkt 8): Sensor-basierte Bewegungserkennung optional
      // zuschaltbar (Schritt 14, siehe sensor.js). Manueller Rep-Counter
      // bleibt parallel immer nutzbar.
      sensorFaehig: true,
      phasen: [phase('Squat Jumps', 25, 'muskelaufbau'), phase('Burpees', 20, 'ausdauer'), phase('Mountain Climbers', 30, 'beweglichkeit')],
    },
  };

  // ---- Verfügbarkeit / Cooldown -----------------------------------------

  function istAufCooldown(character, bossId) {
    const bis = (character.bossCooldowns || {})[bossId];
    if (!bis) return false;
    return new Date(bis).getTime() > Date.now();
  }

  function setzeCooldown(character, bossId) {
    const boss = BOSSE[bossId];
    const bis = new Date(Date.now() + boss.cooldownStunden * 60 * 60 * 1000);
    character.bossCooldowns = character.bossCooldowns || {};
    character.bossCooldowns[bossId] = bis.toISOString();
  }

  function verfuegbareBosse(character) {
    if (character.level < MIN_CHAR_LEVEL) return [];
    return Object.values(BOSSE).filter((boss) => !istAufCooldown(character, boss.id));
  }

  function zufallsBoss(character) {
    const kandidaten = verfuegbareBosse(character);
    if (kandidaten.length === 0) return null;
    return kandidaten[Math.floor(Math.random() * kandidaten.length)];
  }

  // ---- SVG-Rendering ------------------------------------------------------
  // Eigenständiges Artwork pro Boss (kein Stufen-Scaling wie bei
  // Mob-Familien — ein Boss ist immer "eine" Erscheinung). Endbosse
  // (Punkt 15: "Endbosse sind wichtig") bekommen bewusst mehr Details.

  function renderCornpop() {
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cornpop">
      <g fill="#f0d878">
        <path d="M80 60 L60 90 L70 85 L65 110 L80 95 L95 115 L88 88 L100 92 Z"/>
        <path d="M55 100 L40 130 L52 122 L46 150 L60 132 L72 152 L64 122 L78 128 Z"/>
        <path d="M105 100 L120 130 L108 122 L114 150 L100 132 L88 152 L96 122 L82 128 Z"/>
      </g>
      <circle cx="80" cy="95" r="8" fill="#14100c"/>
      <circle cx="80" cy="95" r="8" fill="none" stroke="#8a5a10" stroke-width="2"/>
      <g fill="#14100c"><circle cx="72" cy="92" r="3"/><circle cx="88" cy="92" r="3"/></g>
    </svg>`;
  }

  function renderMarshTheMallow() {
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Marsh the Mallow">
      <rect x="45" y="70" width="70" height="90" rx="24" fill="#fdf6f0"/>
      <rect x="45" y="70" width="70" height="90" rx="24" fill="none" stroke="#e0c8b0" stroke-width="3"/>
      <g fill="#14100c"><circle cx="65" cy="105" r="3.5"/><circle cx="95" cy="105" r="3.5"/></g>
      <path d="M65 125 Q80 135 95 125" stroke="#b88860" stroke-width="3" fill="none"/>
      <circle cx="65" cy="112" r="6" fill="#f4b8c0" opacity="0.6"/>
      <circle cx="95" cy="112" r="6" fill="#f4b8c0" opacity="0.6"/>
    </svg>`;
  }

  function renderPanDoro() {
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pan Doro">
      <polygon points="80,50 115,150 45,150" fill="#e8b048"/>
      <polygon points="80,50 115,150 45,150" fill="none" stroke="#a87020" stroke-width="3"/>
      <line x1="80" y1="60" x2="80" y2="150" stroke="#c89038" stroke-width="3"/>
      <line x1="62" y1="80" x2="50" y2="150" stroke="#c89038" stroke-width="3"/>
      <line x1="98" y1="80" x2="110" y2="150" stroke="#c89038" stroke-width="3"/>
      <g fill="#14100c"><circle cx="70" cy="120" r="3.5"/><circle cx="90" cy="120" r="3.5"/></g>
      <path d="M70 135 Q80 128 90 135" stroke="#5a3a10" stroke-width="3" fill="none"/>
    </svg>`;
  }

  function renderPastaBusta() {
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pasta Busta">
      <g fill="none" stroke="#f0d8a0" stroke-width="8" stroke-linecap="round">
        <path d="M50 60 Q70 90 50 120 Q30 150 55 175"/>
        <path d="M80 55 Q100 85 80 115 Q60 145 85 172"/>
        <path d="M110 60 Q130 90 110 120 Q90 150 112 175"/>
      </g>
      <g fill="#14100c"><circle cx="72" cy="70" r="3"/><circle cx="88" cy="70" r="3"/></g>
    </svg>`;
  }

  function renderNutcruncher() {
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Nutcruncher">
      <ellipse cx="80" cy="110" rx="38" ry="44" fill="#8a5a2a"/>
      <ellipse cx="80" cy="110" rx="38" ry="44" fill="none" stroke="#5a3610" stroke-width="3"/>
      <path d="M80 66 Q70 110 80 154 Q90 110 80 66" stroke="#5a3610" stroke-width="2" fill="none"/>
      <g fill="#14100c"><circle cx="68" cy="100" r="4"/><circle cx="92" cy="100" r="4"/></g>
      <path d="M65 125 L95 125 L88 138 L72 138 Z" fill="#3a2408"/>
      <!-- Minigun-Arme -->
      <rect x="30" y="105" width="26" height="10" rx="4" fill="#909090"/>
      <rect x="104" y="105" width="26" height="10" rx="4" fill="#909090"/>
    </svg>`;
  }

  function renderFleurTheFlourduster() {
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Fleur the Flourduster">
      <g fill="#f5f0e0" opacity="0.9">
        <circle cx="50" cy="70" r="14"/><circle cx="70" cy="55" r="16"/><circle cx="95" cy="60" r="14"/>
        <circle cx="112" cy="78" r="12"/><circle cx="60" cy="85" r="13"/><circle cx="90" cy="88" r="15"/>
      </g>
      <ellipse cx="80" cy="130" rx="34" ry="38" fill="#fffaf0"/>
      <g fill="#14100c"><circle cx="70" cy="122" r="3.5"/><circle cx="90" cy="122" r="3.5"/></g>
      <path d="M68 140 Q80 148 92 140" stroke="#c0a878" stroke-width="3" fill="none"/>
    </svg>`;
  }

  function renderDaemoniz() {
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Deniz / Daemoniz">
      <path d="M40 170 Q40 60 80 60 Q120 60 120 170" fill="none" stroke="#2a6a3a" stroke-width="16" stroke-linecap="round"/>
      <circle cx="80" cy="55" r="20" fill="#3a8a4a"/>
      <g fill="#e8d840"><circle cx="73" cy="52" r="3"/><circle cx="87" cy="52" r="3"/></g>
      <path d="M78 62 L74 70 L82 70 Z" fill="#a01818"/>
    </svg>`;
  }

  function renderNightshadeTheCarbmaid() {
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Nightshade the Carbmaid">
      <path d="M80 55 C50 55 45 90 55 130 C60 155 100 155 105 130 C115 90 110 55 80 55 Z" fill="#3a1a4a"/>
      <path d="M80 55 C50 55 45 90 55 130 C60 155 100 155 105 130 C115 90 110 55 80 55 Z" fill="none" stroke="#6a2a8a" stroke-width="3"/>
      <g fill="#c060e0"><circle cx="70" cy="95" r="4"/><circle cx="90" cy="95" r="4"/></g>
      <path d="M68 115 Q80 108 92 115" stroke="#c060e0" stroke-width="3" fill="none"/>
      <path d="M60 60 L45 40 M100 60 L115 40" stroke="#2a1030" stroke-width="6" stroke-linecap="round"/>
    </svg>`;
  }

  function renderChapTheFruitMonk() {
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chap the Fruit Monk">
      <path d="M80 60 C50 60 45 100 55 140 C62 165 98 165 105 140 C115 100 110 60 80 60 Z" fill="#c02818"/>
      <path d="M78 58 Q80 45 88 40" stroke="#2a6a2a" stroke-width="4" fill="none"/>
      <g fill="#14100c"><circle cx="70" cy="105" r="4"/><circle cx="90" cy="105" r="4"/></g>
      <path d="M68 125 Q80 135 92 125" stroke="#5a1008" stroke-width="3" fill="none"/>
    </svg>`;
  }

  function renderJackThe2ndFruitMonk() {
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Jack the 2nd Fruit Monk">
      <ellipse cx="80" cy="120" rx="46" ry="52" fill="#d89020"/>
      <ellipse cx="80" cy="120" rx="46" ry="52" fill="none" stroke="#8a5a08" stroke-width="4"/>
      <path d="M40 100 Q80 90 120 100" stroke="#8a5a08" stroke-width="2" fill="none"/>
      <path d="M40 130 Q80 140 120 130" stroke="#8a5a08" stroke-width="2" fill="none"/>
      <g fill="#14100c"><circle cx="65" cy="110" r="5"/><circle cx="95" cy="110" r="5"/></g>
      <path d="M62 135 Q80 148 98 135" stroke="#5a3608" stroke-width="4" fill="none"/>
    </svg>`;
  }

  function renderLeTofuBunnay() {
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Le Tofu Bunnay">
      <rect x="46" y="90" width="68" height="70" rx="8" fill="#f5f5f0"/>
      <rect x="46" y="90" width="68" height="70" rx="8" fill="none" stroke="#d0d0c8" stroke-width="3"/>
      <rect x="58" y="40" width="12" height="50" rx="6" fill="#f5f5f0" stroke="#d0d0c8" stroke-width="2"/>
      <rect x="90" y="40" width="12" height="50" rx="6" fill="#f5f5f0" stroke="#d0d0c8" stroke-width="2"/>
      <g fill="#14100c"><circle cx="68" cy="115" r="3.5"/><circle cx="92" cy="115" r="3.5"/></g>
      <circle cx="80" cy="130" r="4" fill="#e8a0b0"/>
    </svg>`;
  }

  function renderBatteringRam() {
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Battering Ram">
      <ellipse cx="80" cy="130" rx="42" ry="34" fill="#7a6048"/>
      <path d="M40 120 Q30 130 40 145" stroke="#4a3a28" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M120 120 Q130 130 120 145" stroke="#4a3a28" stroke-width="10" fill="none" stroke-linecap="round"/>
      <circle cx="80" cy="95" r="26" fill="#8a7058"/>
      <path d="M60 78 L48 58 M100 78 L112 58" stroke="#5a4a38" stroke-width="8" stroke-linecap="round"/>
      <g fill="#e8d040"><circle cx="70" cy="92" r="4"/><circle cx="90" cy="92" r="4"/></g>
      <g fill="#e0e0f8">
        <polygon points="66,108 70,120 74,108"/>
        <polygon points="76,110 80,122 84,110"/>
        <polygon points="86,108 90,120 94,108"/>
      </g>
    </svg>`;
  }

  // ---- Endbosse (Punkt 15: "Endbosse sind wichtig") — mehr Details -------

  function renderSugarkingKane() {
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sugarking Kane">
      <ellipse cx="80" cy="140" rx="52" ry="46" fill="#c08020"/>
      <ellipse cx="80" cy="140" rx="52" ry="46" fill="none" stroke="#7a4a08" stroke-width="4"/>
      <path d="M40 100 L48 70 L62 92 L80 62 L98 92 L112 70 L120 100 Z" fill="#e8c040" stroke="#a87818" stroke-width="3"/>
      <circle cx="52" cy="72" r="5" fill="#e0304a"/>
      <circle cx="80" cy="62" r="6" fill="#4090e0"/>
      <circle cx="108" cy="72" r="5" fill="#40b060"/>
      <g fill="#14100c"><circle cx="65" cy="130" r="6"/><circle cx="95" cy="130" r="6"/></g>
      <path d="M58 155 Q80 172 102 155" stroke="#5a3608" stroke-width="5" fill="none"/>
      <g fill="#f0ead6"><polygon points="66,148 70,162 74,148"/><polygon points="86,148 90,162 94,148"/></g>
    </svg>`;
  }

  function renderVeeGainLeFay() {
    let beine = '';
    const seiten = [-1, 1];
    seiten.forEach((seite) => {
      for (let i = 0; i < 4; i++) {
        const y = 95 + i * 16;
        const x2 = 80 + seite * 70;
        beine += `<path d="M${80 + seite * 20} ${y} Q${80 + seite * 50} ${y - 8} ${x2} ${y + 10}" stroke="#2a1030" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      }
    });
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vee Gain Le Fay / Firestorm">
      <g>${beine}</g>
      <ellipse cx="80" cy="130" rx="30" ry="34" fill="#3a1030"/>
      <circle cx="80" cy="90" r="20" fill="#5a1848"/>
      <g fill="#e04040">
        <circle cx="72" cy="86" r="3"/><circle cx="88" cy="86" r="3"/>
        <circle cx="68" cy="94" r="2.5"/><circle cx="92" cy="94" r="2.5"/>
      </g>
      <path d="M80 130 L80 165" stroke="#c02840" stroke-width="4" stroke-dasharray="2,4"/>
      <circle cx="80" cy="170" r="6" fill="#e05070"/>
    </svg>`;
  }

  function renderEdTheFat() {
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ed the Fat">
      <ellipse cx="80" cy="140" rx="58" ry="52" fill="#e0b090"/>
      <ellipse cx="80" cy="140" rx="58" ry="52" fill="none" stroke="#a87858" stroke-width="4"/>
      <circle cx="80" cy="75" r="26" fill="#e8c0a0"/>
      <g fill="#14100c"><circle cx="70" cy="70" r="4"/><circle cx="90" cy="70" r="4"/></g>
      <path d="M65 88 Q80 98 95 88" stroke="#8a5a3a" stroke-width="3" fill="none"/>
      <path d="M30 130 Q20 140 30 155" stroke="#a87858" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M130 130 Q140 140 130 155" stroke="#a87858" stroke-width="10" fill="none" stroke-linecap="round"/>
      <ellipse cx="60" cy="145" rx="8" ry="5" fill="#c88868" opacity="0.6"/>
      <ellipse cx="100" cy="145" rx="8" ry="5" fill="#c88868" opacity="0.6"/>
    </svg>`;
  }

  function renderZuckerhydra() {
    const koepfe = [-40, 0, 40].map((dx, i) => {
      const farbe = ['#3a8a4a', '#8a3a4a', '#3a4a8a'][i];
      return `
        <g>
          <path d="M80 140 Q${80 + dx * 0.5} 100 ${80 + dx} 70" stroke="${farbe}" stroke-width="10" fill="none" stroke-linecap="round"/>
          <circle cx="${80 + dx}" cy="60" r="16" fill="${farbe}"/>
          <g fill="#e8d840"><circle cx="${74 + dx}" cy="57" r="2.5"/><circle cx="${86 + dx}" cy="57" r="2.5"/></g>
        </g>`;
    }).join('');
    return `<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zuckerhydra">
      <ellipse cx="80" cy="165" rx="44" ry="32" fill="#4a6a3a"/>
      ${koepfe}
    </svg>`;
  }

  const RENDERER = {
    cornpop: renderCornpop,
    marsh_the_mallow: renderMarshTheMallow,
    pan_doro: renderPanDoro,
    pasta_busta: renderPastaBusta,
    nutcruncher: renderNutcruncher,
    fleur_the_flourduster: renderFleurTheFlourduster,
    daemoniz: renderDaemoniz,
    nightshade_the_carbmaid: renderNightshadeTheCarbmaid,
    chap_the_fruit_monk: renderChapTheFruitMonk,
    jack_the_2nd_fruit_monk: renderJackThe2ndFruitMonk,
    le_tofu_bunnay: renderLeTofuBunnay,
    battering_ram: renderBatteringRam,
    sugarking_kane: renderSugarkingKane,
    vee_gain_le_fay: renderVeeGainLeFay,
    ed_the_fat: renderEdTheFat,
    zuckerhydra: renderZuckerhydra,
  };

  function renderBossSVG(bossId) {
    const renderer = RENDERER[bossId];
    if (!renderer) throw new Error('Kein Renderer für Boss: ' + bossId);
    return renderer();
  }

  return {
    BOSSE,
    MIN_CHAR_LEVEL,
    istAufCooldown,
    setzeCooldown,
    verfuegbareBosse,
    zufallsBoss,
    renderBossSVG,
  };
})();
