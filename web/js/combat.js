/**
 * combat.js — Kampf-Modal + Belohnungssystem + Streetfighter-Overlay
 * (Punkt 5.4/5.5/5.6 + Punkt 6 + Punkt 5.3 + Punkt 8, Schritte 6/7/9/10/13/14)
 *
 * VS-Intro, Attack-Choreografie mit Combo-Tracking und K.O.-Sequenz
 * laufen rein CSS-animiert; die Reflow-Trick-Helper (triggerCss) sorgen
 * dafür, dass Animationen bei schnellen Klicks jedes Mal neu starten.
 *
 * Normale Mob-Kämpfe und Boss-Kämpfe teilen sich dieselbe UI-Logik über
 * ein gemeinsames "aktuellePhase"-Objekt {uebung, repZiel, einheit,
 * bonusStat} — bei Mobs ist das einfach der Monster-Datensatz selbst,
 * bei Bossen eine von mehreren Phasen (Punkt 5.3: "mehrphasig, 2-3
 * verschiedene Übungen nacheinander").
 *
 * Optionaler Sensor-Modus (Punkt 8, siehe sensor.js) für Bosse mit
 * boss.sensorFaehig: ruft bei erkannter Bewegung einfach dieselbe
 * repPlus()-Funktion wie ein manueller Klick auf — kein separater
 * Code-Pfad nötig.
 *
 * Sounds (Punkt 6.5) laufen über sound.js. Special-Moves nach 5er-Combo
 * sind bewusst noch nicht gebaut (späterer Feinschliff, auf Wunsch des
 * Users erstmal zurückgestellt).
 */

const WoFCombat = (() => {
  const RARITAETEN = ['gewöhnlich', 'ungewöhnlich', 'selten', 'episch', 'legendär'];

  // ---- Belohnungslogik: Mob-Kämpfe (Punkt 5.4) ---------------------------

  function klassenBonusAktiv(character, bonusStat) {
    const klasse = WoFState.KLASSEN[character.klasse];
    return klasse.bonusStat === bonusStat;
  }

  // Von Mob- und Boss-Belohnung geteilt, damit eine künftige
  // Balance-Änderung (z.B. an der Streak-Formel) nicht an zwei Stellen
  // synchron gehalten werden muss.
  function gemeinsameMultiplikatoren(character) {
    const talentBoni = WoFState.berechneTalentBoni(character);
    WoFState.aktualisiereEnergiePassiv(character);
    // Energie-System (eigene Erweiterung): niedriger Stand -> sanfter
    // XP-Malus, NIE ein Blocker fürs Weiterspielen. Omega-3/Kreatin-Buffs
    // wirken hier direkt mit rein.
    const energieMultiplikator = WoFState.energieMalusAktiv(character) ? 0.8 : 1.0;
    const xpBuffMultiplikator = 1 + (character.buffs.xpBonus.prozent || 0) / 100;
    const statBuffMultiplikator = 1 + (character.buffs.statBonus.prozent || 0) / 100;
    return {
      talentBoni,
      talentMultiplikator: (1 + talentBoni.combatXpBonus) * energieMultiplikator * xpBuffMultiplikator, // Talent-Ast "Angriffslust" (Punkt 4.6)
      streakMultiplikator: 1 + Math.min(character.streak.count, 20) * 0.02,
      statBuffMultiplikator,
    };
  }

  // Fisher-Yates statt sort(() => Math.random()-0.5) — letzteres liefert
  // keine gleichverteilte Permutation und würde manche Stats auf
  // Mehrfach-Stat-Loot systematisch bevorzugen.
  function mische(array) {
    const kopie = [...array];
    for (let i = kopie.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
    }
    return kopie;
  }

  function ueberperformanceFaktor(reps, ziel) {
    if (reps <= ziel) return 0;
    const zusatzAnteil = (reps - ziel) / ziel;
    return Math.min(0.5, zusatzAnteil * 0.5);
  }

  // Der XP-Bonus aus ueberperformanceFaktor sättigt bei reps=2*ziel (dann
  // ist der +50%-Deckel erreicht). statBetrag hing bisher direkt und OHNE
  // Deckel an reps — seit der Rep-Counter nicht mehr bei repZiel anschlägt
  // (Fix für den toten Überperformance-Bonus), ließe sich Stat-Wachstum
  // sonst durch stures Weiterklicken beliebig aufblähen. Gleicher Deckel
  // wie bei der XP, damit Überperformance belohnt wird, aber begrenzt bleibt.
  function effektiveRepsFuerStat(reps, ziel) {
    return Math.min(reps, ziel * 2);
  }

  function lootWuerfeln(stufe, lootChanceBonus) {
    // Normale Monster: 20-60% Chance je nach Level (Punkt 5.4), linear über 5 Stufen.
    // Talent-Ast "Beute" (Punkt 4.6) legt bis zu +20% obendrauf.
    const chance = Math.min(0.95, 0.2 + (stufe - 1) * 0.1 + lootChanceBonus);
    if (Math.random() > chance) return null;
    return generiereItem(wuerfleRarity(stufe), stufe);
  }

  function wuerfleRarity(stufe) {
    // Rarity-Gewichtung: höhere Stufe verschiebt Wahrscheinlichkeit nach oben.
    // Eigene Annahme, im HANDOVER nicht exakt spezifiziert.
    const gewichte = [50, 30, 14, 5, 1].map((g, i) => g + stufe * (i * 1.5));
    const summe = gewichte.reduce((a, b) => a + b, 0);
    let roll = Math.random() * summe;
    for (let i = 0; i < gewichte.length; i++) {
      roll -= gewichte[i];
      if (roll <= 0) return RARITAETEN[i];
    }
    return RARITAETEN[0];
  }

  // Boss-Loot ist garantiert (Punkt 5.4) mit forcierter Mindest-Rarität.
  // Eigene Ausweitung: Endbosse (Tier "gross") verlangen mindestens "episch"
  // statt nur "selten", damit sie sich lohnender anfühlen (Punkt 15: "Endbosse
  // sind wichtig").
  function generiereGarantiertesLoot(minRarity, stufeProxy) {
    const minIndex = RARITAETEN.indexOf(minRarity);
    // Gewichtung bevorzugt die Mindest-Rarität, lässt aber Luft nach oben.
    const gewichte = RARITAETEN.map((_, i) => (i < minIndex ? 0 : i === minIndex ? 55 : 45 / (i - minIndex + 1)));
    const summe = gewichte.reduce((a, b) => a + b, 0);
    let roll = Math.random() * summe;
    let rarityIndex = minIndex;
    for (let i = 0; i < gewichte.length; i++) {
      roll -= gewichte[i];
      if (roll <= 0) {
        rarityIndex = i;
        break;
      }
    }
    return generiereItem(RARITAETEN[rarityIndex], stufeProxy);
  }

  // Konkrete, sportlich-realistische Item-Namen statt generischer
  // Platzhalter ("Rüstungsteil"/"Waffe"/"Amulett") — auf Wunsch des
  // Users. Betrifft nur zufällig gedroppten Loot; die Klassen-
  // Startausrüstung (Punkt 4.5, z.B. "Wildling-Fell") bleibt als
  // gesetzte Klassen-Identität unangetastet.
  const LOOT_NAMEN = {
    armor: ['Trainingsjacke', 'Kompressions-Shirt', 'Lauf-Leggings', 'Sport-Weste', 'Thermo-Unterhemd'],
    weapon: ['Sportschuhe', 'Springseil', 'Trainingshandschuhe', 'Griffbänder', 'Sprintschuhe'],
    amulet: ['Fitness-Armband', 'Pulsmesser-Armband', 'Sport-Armband mit Trittzähler', 'Smartwatch-Armband', 'Schweißband fürs Handgelenk'],
  };

  function generiereItem(rarity, stufe) {
    const rarityIndex = RARITAETEN.indexOf(rarity);
    const anzahlStats = 1 + Math.floor(rarityIndex / 2);
    const statPool = mische(WoFState.STATS).slice(0, anzahlStats);
    const bonuses = {};
    statPool.forEach((stat) => {
      bonuses[stat] = 1 + rarityIndex + Math.floor(stufe / 2);
    });
    const slots = ['armor', 'weapon', 'amulet'];
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const gegenstand = LOOT_NAMEN[slot][Math.floor(Math.random() * LOOT_NAMEN[slot].length)];
    return {
      id: WoFState.cryptoId(),
      type: 'item',
      slot,
      rarity,
      name: `${gegenstand} (${rarity})`, // "legendär Sportschuhe" wäre grammatikalisch falsch (Genus/Numerus)
      bonuses,
    };
  }

  function berechneBelohnung(character, monster, reps) {
    const { talentBoni, talentMultiplikator, streakMultiplikator, statBuffMultiplikator } = gemeinsameMultiplikatoren(character);
    const klassenBonus = klassenBonusAktiv(character, monster.bonusStat) ? 1.25 : 1.0;
    const ueberperformung = 1 + ueberperformanceFaktor(reps, monster.repZiel);
    const xp = monster.xpBasis * klassenBonus * talentMultiplikator * ueberperformung;
    const gold = monster.goldBasis * streakMultiplikator;

    const statRoh = Math.max(1, Math.floor(effektiveRepsFuerStat(reps, monster.repZiel) / 5));
    const statBetrag = Math.max(1, Math.round(statRoh * statBuffMultiplikator));
    const loot = lootWuerfeln(monster.stufe, talentBoni.lootChanceBonus);

    return { xp, gold, statBetrag, stat: monster.bonusStat, loot, klassenBonusAktiv: klassenBonus > 1 };
  }

  function abschliessen(character, monster, reps) {
    // ERST die Streak für heute aktualisieren, DANN die Belohnung berechnen —
    // sonst zahlt der erste Kampf eines neuen Streak-Tages noch zum
    // Vortages-Bonus aus, obwohl der Held-Tab direkt danach schon den
    // erhöhten Streak-Wert zeigt.
    WoFState.streakAktualisieren(character);
    const belohnung = berechneBelohnung(character, monster, reps);
    const levelUps = WoFState.xpHinzufuegen(character, belohnung.xp);
    WoFState.goldHinzufuegen(character, belohnung.gold);
    WoFState.statErhoehen(character, belohnung.stat, belohnung.statBetrag);
    if (belohnung.loot) {
      character.inventory.push(belohnung.loot);
    }
    character.besiegteMonster.push({
      familyId: monster.familyId,
      stufe: monster.stufe,
      zeitpunkt: new Date().toISOString(),
    });
    WoFState.energieFuerKampfVerbrauchen(character, monster.repZiel);
    WoFState.buffsNachKampfAktualisieren(character);
    const supplementDrops = WoFConsumables.wuerfleDrops(false);
    WoFConsumables.gutschreiben(character, supplementDrops);
    WoFState.protokolliere(character, {
      typ: 'monster',
      gegner: monster.name,
      uebung: monster.uebung,
      reps,
      repZiel: monster.repZiel,
      einheit: monster.einheit,
      xp: Math.round(belohnung.xp),
      gold: Math.round(belohnung.gold),
      statBoni: { [belohnung.stat]: belohnung.statBetrag },
    });
    WoFState.speichern(character);
    return { belohnung, levelUps, supplementDrops };
  }

  // ---- Belohnungslogik: Boss-Kämpfe (Punkt 5.3/5.4) ----------------------
  // Eigene eigene Vereinfachung ggü. Mob-Kämpfen: kein Überperformance-Bonus
  // (bei 2-3 Phasen mit je eigenem Ziel wäre das nicht eindeutig zuordenbar),
  // dafür Stat-Zuwachs pro Phase (jede Übung trainiert ihren eigenen Stat).
  const BOSS_STUFE_PROXY = { klein: 3, mittel: 4, gross: 5 };

  function berechneBossBelohnung(character, boss) {
    const { talentMultiplikator, streakMultiplikator } = gemeinsameMultiplikatoren(character);
    const klassenBonusAktivFlag = boss.phasen.some((p) => klassenBonusAktiv(character, p.bonusStat));
    const klassenBonus = klassenBonusAktivFlag ? 1.25 : 1.0;
    const xp = boss.xpBasis * klassenBonus * talentMultiplikator;
    const gold = boss.goldBasis * streakMultiplikator;

    const stufeProxy = BOSS_STUFE_PROXY[boss.tier] || 4;
    const loot = generiereGarantiertesLoot(boss.lootRarityMin, stufeProxy);

    return { xp, gold, loot, klassenBonusAktiv: klassenBonusAktivFlag };
  }

  function schliesseBossKampfAb(character, boss, gesammelteStatBoni) {
    WoFState.streakAktualisieren(character); // siehe Kommentar in abschliessen()
    const belohnung = berechneBossBelohnung(character, boss);
    const levelUps = WoFState.xpHinzufuegen(character, belohnung.xp);
    WoFState.goldHinzufuegen(character, belohnung.gold);
    character.inventory.push(belohnung.loot);
    character.besiegteMonster.push({
      familyId: boss.id,
      stufe: null,
      istBoss: true,
      tier: boss.tier,
      zeitpunkt: new Date().toISOString(),
    });
    WoFBosses.setzeCooldown(character, boss.id);
    WoFState.buffsNachKampfAktualisieren(character); // einmal pro ganzem Boss-Kampf, nicht pro Phase
    const supplementDrops = WoFConsumables.wuerfleDrops(true);
    WoFConsumables.gutschreiben(character, supplementDrops);
    WoFState.protokolliere(character, {
      typ: 'boss',
      gegner: boss.name,
      uebungen: boss.phasen.map((p) => p.uebung),
      xp: Math.round(belohnung.xp),
      gold: Math.round(belohnung.gold),
      statBoni: gesammelteStatBoni,
    });
    WoFState.speichern(character);
    return { belohnung, levelUps, supplementDrops };
  }

  // ---- Modal-UI -----------------------------------------------------------

  const COMBO_FENSTER_MS = 1200; // Punkt 6.3: <1200ms Abstand zählt als Combo
  const COMBO_SCHWELLE = 3; // ab 3x Combo: goldener Popup + Crit-Schadenszahlen

  // aktuellerKampf: { typ: 'monster'|'boss', character, monster?, boss?,
  //   phaseIndex, aktuellePhase, gesammelteStatBoni, reps, combo, abgeschlossen, onClose }
  let aktuellerKampf = null;

  function el(id) {
    return document.getElementById(id);
  }

  // Erzwingt einen Reflow, damit eine CSS-Animation bei schnell
  // aufeinanderfolgenden Klicks jedes Mal neu von vorne abspielt.
  function triggerCss(id, klasse) {
    const elem = el(id);
    elem.classList.remove(klasse);
    void elem.offsetWidth;
    elem.classList.add(klasse);
  }

  function starteKampf(character, monster, onClose) {
    aktuellerKampf = {
      typ: 'monster',
      character,
      monster,
      phaseIndex: 0,
      aktuellePhase: monster,
      reps: 0,
      onClose,
      combo: { anzahl: 0, letzterKlick: 0 },
      abgeschlossen: false,
      sensorStop: null,
      sensorStartZeit: null,
      sensorIntervalId: null,
      sensorAnfrageLaeuft: false,
      phasenUebergangLaeuft: false,
    };

    el('combat-monster-name').textContent = monster.name;
    el('combat-monster-svg').innerHTML = WoFMonsters.renderMonsterSVG(monster.familyId, monster.stufe);
    el('combat-phase-indicator').classList.add('hidden');
    zeigeSpruch(WoFMonsters.zufallsSpruch(WoFMonsters.FAMILIEN[monster.familyId].sprueche));
    oeffneKampfModal(character, monster.name);
  }

  function starteBosskampf(character, boss, onClose) {
    aktuellerKampf = {
      typ: 'boss',
      character,
      boss,
      phaseIndex: 0,
      aktuellePhase: boss.phasen[0],
      gesammelteStatBoni: {},
      reps: 0,
      onClose,
      combo: { anzahl: 0, letzterKlick: 0 },
      abgeschlossen: false,
      sensorStop: null,
      sensorStartZeit: null,
      sensorIntervalId: null,
      sensorAnfrageLaeuft: false,
      phasenUebergangLaeuft: false,
    };

    el('combat-monster-name').textContent = boss.name;
    el('combat-monster-svg').innerHTML = WoFBosses.renderBossSVG(boss.id);
    aktualisierePhaseIndikator();
    el('combat-phase-indicator').classList.remove('hidden');
    zeigeSpruch(WoFMonsters.zufallsSpruch(boss.sprueche));
    oeffneKampfModal(character, boss.name);
  }

  function zeigeSpruch(spruch) {
    const spruchEl = el('combat-spruch');
    spruchEl.textContent = spruch || '';
    spruchEl.classList.toggle('hidden', !spruch);
  }

  function oeffneKampfModal(character, gegnerName) {
    el('combat-monster-svg').className = 'combat-fighter';
    el('combat-player-svg').innerHTML = WoFAvatar.renderAvatarSVG(character);
    el('combat-player-svg').className = 'combat-fighter';
    el('combat-monster-effects').innerHTML = '';
    el('combat-result').classList.add('hidden');
    el('combat-controls').classList.add('hidden');
    el('combat-ko-overlay').classList.add('hidden');
    el('combat-ko-overlay').classList.remove('play');
    aktualisiereExerciseUI();
    aktualisiereCounter();
    stoppeSensor();
    aktualisiereSensorUI();

    el('combat-modal').classList.remove('hidden');
    spieleVSIntro(gegnerName, () => {
      if (aktuellerKampf) el('combat-controls').classList.remove('hidden');
    });
  }

  function aktualisierePhaseIndikator() {
    const { boss, phaseIndex } = aktuellerKampf;
    el('combat-phase-indicator').textContent = `Phase ${phaseIndex + 1} von ${boss.phasen.length}`;
  }

  // ---- Sensor-Modus (Punkt 8, Schritt 14) --------------------------------

  function istSensorFaehig() {
    return !!aktuellerKampf && aktuellerKampf.typ === 'boss' && !!aktuellerKampf.boss.sensorFaehig;
  }

  function aktualisiereSensorUI() {
    el('combat-sensor-bar').classList.toggle('hidden', !istSensorFaehig());
  }

  function stoppeSensor() {
    if (!aktuellerKampf) return;
    if (aktuellerKampf.sensorStop) {
      aktuellerKampf.sensorStop();
      aktuellerKampf.sensorStop = null;
    }
    if (aktuellerKampf.sensorIntervalId) {
      clearInterval(aktuellerKampf.sensorIntervalId);
      aktuellerKampf.sensorIntervalId = null;
    }
    const btn = el('combat-sensor-toggle-btn');
    btn.textContent = '📱 Sensor-Modus (HIIT)';
    btn.classList.remove('aktiv');
    const timerEl = el('combat-sensor-timer');
    timerEl.classList.add('hidden');
    timerEl.textContent = '⏱️ 0:00'; // sonst blitzt beim nächsten Start kurz die alte Zeit auf
  }

  async function toggleSensor() {
    if (!aktuellerKampf) return;
    if (aktuellerKampf.sensorStop) {
      stoppeSensor();
      return;
    }
    // Ohne diese Sperre könnte ein zweiter Klick/Touch VOR Auflösung des
    // await unten hier nochmal reinlaufen (sensorStop ist ja erst NACH
    // dem await gesetzt) und einen zweiten, nicht mehr referenzierbaren
    // devicemotion-Listener + Interval erzeugen (Leak: jede Bewegung
    // würde repPlus() doppelt auslösen).
    if (aktuellerKampf.sensorAnfrageLaeuft) return;
    if (!WoFSensor.istVerfuegbar()) {
      alert('Dieses Gerät hat keinen Bewegungssensor. Zähle einfach manuell weiter.');
      return;
    }
    aktuellerKampf.sensorAnfrageLaeuft = true;
    const erlaubt = await WoFSensor.anfragenBerechtigung();
    if (!aktuellerKampf) return; // Kampf könnte während der Anfrage beendet worden sein (z.B. geflohen)
    aktuellerKampf.sensorAnfrageLaeuft = false;
    if (!erlaubt) {
      alert('Sensor-Zugriff wurde nicht erlaubt. Du kannst trotzdem manuell weiterzählen.');
      return;
    }

    aktuellerKampf.sensorStop = WoFSensor.starteErkennung(() => repPlus());
    aktuellerKampf.sensorStartZeit = Date.now();
    const btn = el('combat-sensor-toggle-btn');
    btn.textContent = '📱 Sensor läuft — Stop';
    btn.classList.add('aktiv');
    const timerEl = el('combat-sensor-timer');
    timerEl.classList.remove('hidden');
    aktuellerKampf.sensorIntervalId = setInterval(() => {
      if (!aktuellerKampf || !aktuellerKampf.sensorStartZeit) return;
      const sekunden = Math.floor((Date.now() - aktuellerKampf.sensorStartZeit) / 1000);
      const min = Math.floor(sekunden / 60);
      const sek = sekunden % 60;
      timerEl.textContent = `⏱️ ${min}:${String(sek).padStart(2, '0')}`;
    }, 1000);
  }

  function aktualisiereExerciseUI() {
    const { aktuellePhase } = aktuellerKampf;
    el('combat-exercise').textContent = aktuellePhase.uebung;
    const istZeit = aktuellePhase.einheit === 'sekunden';
    el('combat-plus-btn').textContent = istZeit ? 'Halten! ⏱️' : 'Rep! 💪';
  }

  function spieleVSIntro(gegnerName, onDone) {
    const intro = el('combat-intro');
    el('combat-intro-monster-name').textContent = gegnerName.toUpperCase();
    el('combat-intro-fight').classList.add('hidden');
    intro.classList.remove('hidden');
    intro.classList.remove('play');
    void intro.offsetWidth;
    intro.classList.add('play');

    setTimeout(() => {
      if (!aktuellerKampf) return;
      el('combat-intro-fight').classList.remove('hidden');
    }, 1900);

    setTimeout(() => {
      intro.classList.add('hidden');
      if (aktuellerKampf) onDone();
    }, 2600);
  }

  function aktualisiereCounter() {
    const { reps, aktuellePhase } = aktuellerKampf;
    const einheitLabel = aktuellePhase.einheit === 'sekunden' ? 'Sek.' : '';
    el('combat-counter').textContent = `${reps} / ${aktuellePhase.repZiel} ${einheitLabel}`.trim();
    const fertigBtn = el('combat-fertig-btn');
    const geschafft = reps >= aktuellePhase.repZiel;
    fertigBtn.disabled = !geschafft;
    fertigBtn.classList.toggle('bereit', geschafft);

    const hpAnteil = Math.max(0, 1 - reps / aktuellePhase.repZiel);
    el('combat-monster-hp-fill').style.width = `${hpAnteil * 100}%`;
  }

  function spawnEffekt(klasse, text, istCrit) {
    const layer = el('combat-monster-effects');
    const node = document.createElement('div');
    node.className = klasse + (istCrit ? ' crit' : '');
    node.textContent = text;
    node.style.left = `${30 + Math.random() * 40}%`;
    layer.appendChild(node);
    setTimeout(() => node.remove(), 900);
  }

  function zeigePopupText(text) {
    const popup = el('combat-combo-popup');
    popup.textContent = text;
    popup.classList.remove('show');
    void popup.offsetWidth;
    popup.classList.add('show');
  }

  function spieleAngriffsAnimation(istCrit) {
    triggerCss('combat-player-svg', 'lunge');
    triggerCss('combat-monster-svg', 'hit');
    triggerCss('combat-modal-content', 'shake');

    const { aktuellePhase, character } = aktuellerKampf;
    // Punkt 5.6: Streak soll auch den Combat-Damage erhöhen. Da "Schaden"
    // hier rein kosmetisch ist (die echte Belohnung hängt an Reps/XP-
    // Formel, nicht an diesen Zahlen), fließt der Streak-Bonus nur in die
    // Anzeige ein — Cap bei Streak 20 wie beim Gold-Multiplikator.
    const streakBonus = 1 + Math.min(character.streak.count, 20) * 0.01;
    const basisSchaden = Math.max(1, Math.round((100 / aktuellePhase.repZiel) * streakBonus));
    const schaden = istCrit ? Math.round(basisSchaden * 1.5) : basisSchaden;

    spawnEffekt('impact-star', '💥', false);
    spawnEffekt('damage-number', `-${schaden}`, istCrit);
    if (istCrit) zeigePopupText(`COMBO x${aktuellerKampf.combo.anzahl}!`);
  }

  function repPlus() {
    if (!aktuellerKampf || aktuellerKampf.abgeschlossen) return;
    // Bewusst KEIN Anschlag bei repZiel — Punkt 5.4 "Überperformance-Bonus:
    // mehr Reps als nötig -> bis zu +50% Basis-XP" braucht Reps über das
    // Ziel hinaus, um überhaupt greifen zu können.

    const jetzt = Date.now();
    const combo = aktuellerKampf.combo;
    if (combo.letzterKlick && jetzt - combo.letzterKlick < COMBO_FENSTER_MS) {
      combo.anzahl += 1;
    } else {
      combo.anzahl = 1;
    }
    combo.letzterKlick = jetzt;

    aktuellerKampf.reps += 1;
    aktualisiereCounter();
    const istCrit = combo.anzahl >= COMBO_SCHWELLE;
    spieleAngriffsAnimation(istCrit);
    WoFSound.spieleHit();
    if (istCrit) WoFSound.spieleCombo();
  }

  function repMinus() {
    if (!aktuellerKampf || aktuellerKampf.abgeschlossen) return;
    aktuellerKampf.reps = Math.max(aktuellerKampf.reps - 1, 0);
    aktuellerKampf.combo.anzahl = 0;
    aktuellerKampf.combo.letzterKlick = 0;
    aktualisiereCounter();
  }

  function fliehen() {
    if (!aktuellerKampf) return;
    stoppeSensor();
    const { onClose } = aktuellerKampf;
    el('combat-modal').classList.add('hidden');
    aktuellerKampf = null;
    if (onClose) onClose({ geflohen: true });
  }

  function spieleKOSequenz(callback) {
    stoppeSensor();
    aktuellerKampf.abgeschlossen = true;
    triggerCss('combat-monster-svg', 'boss-ko');
    triggerCss('combat-modal-content', 'shake-final');

    setTimeout(() => {
      WoFSound.spieleSieg();
      const overlay = el('combat-ko-overlay');
      overlay.classList.remove('hidden');
      overlay.classList.remove('play');
      void overlay.offsetWidth;
      overlay.classList.add('play');

      setTimeout(() => {
        overlay.classList.add('hidden');
        callback();
      }, 1100);
    }, 700);
  }

  function fertig() {
    if (!aktuellerKampf || aktuellerKampf.abgeschlossen) return;
    if (aktuellerKampf.phasenUebergangLaeuft) return; // Doppel-Klick während des Phasenwechsels ignorieren
    const { reps, aktuellePhase } = aktuellerKampf;
    if (reps < aktuellePhase.repZiel) return;

    if (aktuellerKampf.typ === 'monster') {
      fertigMonster();
    } else {
      fertigBossPhase();
    }
  }

  function fertigMonster() {
    const { character, monster, reps, onClose } = aktuellerKampf;
    el('combat-controls').classList.add('hidden');

    spieleKOSequenz(() => {
      const { belohnung, levelUps, supplementDrops } = abschliessen(character, monster, reps);
      zeigeErgebnis({
        character,
        titel: 'K.O.!',
        zeilen: [
          `+${Math.round(belohnung.xp)} XP${belohnung.klassenBonusAktiv ? ' (Klassen-Bonus!)' : ''}`,
          `+${Math.round(belohnung.gold)} Gold`,
          `+${belohnung.statBetrag} ${belohnung.stat}`,
          ...formatiereSupplementZeilen(supplementDrops),
        ],
        loot: belohnung.loot,
        levelUps,
        onWeiter: () => onClose({ geflohen: false, belohnung, levelUps }),
      });
    });
  }

  function formatiereSupplementZeilen(supplementDrops) {
    return supplementDrops.map((id) => {
      const s = WoFConsumables.SUPPLEMENTE[id];
      return `${s.emoji} +1 ${s.name}`;
    });
  }

  // Eine Boss-Phase geschafft: Stat sofort gutschreiben (jede Übung
  // trainiert ihren eigenen Stat), dann entweder zur nächsten Phase
  // oder — bei der letzten Phase — die volle K.O.-Sequenz + Belohnung.
  function fertigBossPhase() {
    const { character, aktuellePhase, reps, boss, phaseIndex, onClose } = aktuellerKampf;
    const { statBuffMultiplikator } = gemeinsameMultiplikatoren(character);
    const statRoh = Math.max(1, Math.floor(effektiveRepsFuerStat(reps, aktuellePhase.repZiel) / 5));
    const statBetrag = Math.max(1, Math.round(statRoh * statBuffMultiplikator));
    WoFState.statErhoehen(character, aktuellePhase.bonusStat, statBetrag);
    aktuellerKampf.gesammelteStatBoni[aktuellePhase.bonusStat] =
      (aktuellerKampf.gesammelteStatBoni[aktuellePhase.bonusStat] || 0) + statBetrag;
    WoFState.energieFuerKampfVerbrauchen(character, aktuellePhase.repZiel);

    const istLetztePhase = phaseIndex >= boss.phasen.length - 1;
    stoppeSensor(); // pro Phase neu aktivieren (neue Übung, neue Bewegung)

    if (!istLetztePhase) {
      aktuellerKampf.phasenUebergangLaeuft = true; // gegen doppelt gefeuerte Klicks/Touch-Events
      el('combat-controls').classList.add('hidden');
      zeigePopupText(`Phase ${phaseIndex + 1} geschafft!`);
      setTimeout(() => {
        if (!aktuellerKampf) return;
        aktuellerKampf.phaseIndex += 1;
        aktuellerKampf.aktuellePhase = boss.phasen[aktuellerKampf.phaseIndex];
        aktuellerKampf.reps = 0;
        aktuellerKampf.combo = { anzahl: 0, letzterKlick: 0 };
        aktuellerKampf.phasenUebergangLaeuft = false;
        aktualisierePhaseIndikator();
        aktualisiereExerciseUI();
        aktualisiereCounter();
        el('combat-controls').classList.remove('hidden');
      }, 1000);
      return;
    }

    el('combat-controls').classList.add('hidden');
    spieleKOSequenz(() => {
      const { belohnung, levelUps, supplementDrops } = schliesseBossKampfAb(character, boss, aktuellerKampf.gesammelteStatBoni);
      const statZeilen = Object.entries(aktuellerKampf.gesammelteStatBoni).map(
        ([stat, betrag]) => `+${betrag} ${stat}`
      );
      zeigeErgebnis({
        character,
        titel: 'BOSS BESIEGT!',
        zeilen: [
          `+${Math.round(belohnung.xp)} XP${belohnung.klassenBonusAktiv ? ' (Klassen-Bonus!)' : ''}`,
          `+${Math.round(belohnung.gold)} Gold`,
          ...statZeilen,
          ...formatiereSupplementZeilen(supplementDrops),
        ],
        loot: belohnung.loot,
        levelUps,
        flavorText: boss.flavorText,
        onWeiter: () => onClose({ geflohen: false, belohnung, levelUps }),
      });
    });
  }

  function zeigeErgebnis({ character, titel, zeilen, loot, levelUps, flavorText, onWeiter }) {
    if (loot) WoFSound.spieleLoot();
    if (levelUps.length) WoFSound.spieleLevelUp();
    const result = el('combat-result');
    result.classList.remove('hidden');
    result.innerHTML = `
      <h3>${titel}</h3>
      ${zeilen.map((z) => `<p>${z}</p>`).join('')}
      ${loot ? `<p class="loot">Beute: ${loot.name}</p>` : '<p>Kein Beutefund diesmal.</p>'}
      ${levelUps.length ? `<p class="levelup">Level Up! Jetzt Stufe ${character.level}</p>` : ''}
      ${flavorText ? `<p class="field-hint">${flavorText}</p>` : ''}
      <button id="combat-weiter-btn" class="btn-primary">Weiter</button>
    `;
    el('combat-weiter-btn').addEventListener('click', () => {
      el('combat-modal').classList.add('hidden');
      aktuellerKampf = null;
      onWeiter();
    });
  }

  function initUI() {
    el('combat-plus-btn').addEventListener('click', repPlus);
    el('combat-minus-btn').addEventListener('click', repMinus);
    el('combat-flee-btn').addEventListener('click', fliehen);
    el('combat-fertig-btn').addEventListener('click', fertig);
    el('combat-sensor-toggle-btn').addEventListener('click', toggleSensor);
  }

  return { starteKampf, starteBosskampf, initUI, berechneBelohnung };
})();
