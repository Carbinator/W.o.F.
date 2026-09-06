/**
 * combat.js — Kampf-Modal + Belohnungssystem + Streetfighter-Overlay
 * (Punkt 5.4/5.5/5.6 + Punkt 6 + Punkt 5.3, Schritte 6/7/9/10/13)
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
 * Sounds (Punkt 6.5) und Special-Moves nach 5er-Combo sind bewusst noch
 * nicht gebaut (späterer Feinschliff).
 */

const WoFCombat = (() => {
  const RARITAETEN = ['gewöhnlich', 'ungewöhnlich', 'selten', 'episch', 'legendär'];

  // ---- Belohnungslogik: Mob-Kämpfe (Punkt 5.4) ---------------------------

  function klassenBonusAktiv(character, bonusStat) {
    const klasse = WoFState.KLASSEN[character.klasse];
    return klasse.bonusStat === bonusStat;
  }

  function ueberperformanceFaktor(reps, ziel) {
    if (reps <= ziel) return 0;
    const zusatzAnteil = (reps - ziel) / ziel;
    return Math.min(0.5, zusatzAnteil * 0.5);
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

  function generiereItem(rarity, stufe) {
    const rarityIndex = RARITAETEN.indexOf(rarity);
    const anzahlStats = 1 + Math.floor(rarityIndex / 2);
    const statPool = [...WoFState.STATS].sort(() => Math.random() - 0.5).slice(0, anzahlStats);
    const bonuses = {};
    statPool.forEach((stat) => {
      bonuses[stat] = 1 + rarityIndex + Math.floor(stufe / 2);
    });
    const slots = ['armor', 'weapon', 'amulet'];
    const slot = slots[Math.floor(Math.random() * slots.length)];
    return {
      id: WoFState.cryptoId(),
      type: 'item',
      slot,
      rarity,
      name: `${rarity} ${slot === 'armor' ? 'Rüstungsteil' : slot === 'weapon' ? 'Waffe' : 'Amulett'}`,
      bonuses,
    };
  }

  function berechneBelohnung(character, monster, reps) {
    const talentBoni = WoFState.berechneTalentBoni(character);
    const klassenBonus = klassenBonusAktiv(character, monster.bonusStat) ? 1.25 : 1.0;
    const talentMultiplikator = 1 + talentBoni.combatXpBonus; // Talent-Ast "Angriffslust" (Punkt 4.6)
    const ueberperformung = 1 + ueberperformanceFaktor(reps, monster.repZiel);
    const xp = monster.xpBasis * klassenBonus * talentMultiplikator * ueberperformung;

    const streakMultiplikator = 1 + Math.min(character.streak.count, 20) * 0.02;
    const gold = monster.goldBasis * streakMultiplikator;

    const statBetrag = Math.max(1, Math.floor(reps / 5));
    const loot = lootWuerfeln(monster.stufe, talentBoni.lootChanceBonus);

    return { xp, gold, statBetrag, stat: monster.bonusStat, loot, klassenBonusAktiv: klassenBonus > 1 };
  }

  function abschliessen(character, monster, reps) {
    const belohnung = berechneBelohnung(character, monster, reps);
    const levelUps = WoFState.xpHinzufuegen(character, belohnung.xp);
    WoFState.goldHinzufuegen(character, belohnung.gold);
    WoFState.statErhoehen(character, belohnung.stat, belohnung.statBetrag);
    WoFState.streakAktualisieren(character);
    if (belohnung.loot) {
      character.inventory.push(belohnung.loot);
    }
    character.besiegteMonster.push({
      familyId: monster.familyId,
      stufe: monster.stufe,
      zeitpunkt: new Date().toISOString(),
    });
    WoFState.speichern(character);
    return { belohnung, levelUps };
  }

  // ---- Belohnungslogik: Boss-Kämpfe (Punkt 5.3/5.4) ----------------------
  // Eigene eigene Vereinfachung ggü. Mob-Kämpfen: kein Überperformance-Bonus
  // (bei 2-3 Phasen mit je eigenem Ziel wäre das nicht eindeutig zuordenbar),
  // dafür Stat-Zuwachs pro Phase (jede Übung trainiert ihren eigenen Stat).
  const BOSS_STUFE_PROXY = { klein: 3, mittel: 4, gross: 5 };

  function berechneBossBelohnung(character, boss) {
    const talentBoni = WoFState.berechneTalentBoni(character);
    const klassenBonusAktivFlag = boss.phasen.some((p) => klassenBonusAktiv(character, p.bonusStat));
    const klassenBonus = klassenBonusAktivFlag ? 1.25 : 1.0;
    const talentMultiplikator = 1 + talentBoni.combatXpBonus;
    const xp = boss.xpBasis * klassenBonus * talentMultiplikator;

    const streakMultiplikator = 1 + Math.min(character.streak.count, 20) * 0.02;
    const gold = boss.goldBasis * streakMultiplikator;

    const stufeProxy = BOSS_STUFE_PROXY[boss.tier] || 4;
    const loot = generiereGarantiertesLoot(boss.lootRarityMin, stufeProxy);

    return { xp, gold, loot, klassenBonusAktiv: klassenBonusAktivFlag };
  }

  function schliesseBossKampfAb(character, boss) {
    const belohnung = berechneBossBelohnung(character, boss);
    const levelUps = WoFState.xpHinzufuegen(character, belohnung.xp);
    WoFState.goldHinzufuegen(character, belohnung.gold);
    WoFState.streakAktualisieren(character);
    character.inventory.push(belohnung.loot);
    character.besiegteMonster.push({
      familyId: boss.id,
      stufe: null,
      istBoss: true,
      tier: boss.tier,
      zeitpunkt: new Date().toISOString(),
    });
    WoFBosses.setzeCooldown(character, boss.id);
    WoFState.speichern(character);
    return { belohnung, levelUps };
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
    };

    el('combat-monster-name').textContent = monster.name;
    el('combat-monster-svg').innerHTML = WoFMonsters.renderMonsterSVG(monster.familyId, monster.stufe);
    el('combat-phase-indicator').classList.add('hidden');
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
    };

    el('combat-monster-name').textContent = boss.name;
    el('combat-monster-svg').innerHTML = WoFBosses.renderBossSVG(boss.id);
    aktualisierePhaseIndikator();
    el('combat-phase-indicator').classList.remove('hidden');
    oeffneKampfModal(character, boss.name);
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

    el('combat-modal').classList.remove('hidden');
    spieleVSIntro(gegnerName, () => {
      if (aktuellerKampf) el('combat-controls').classList.remove('hidden');
    });
  }

  function aktualisierePhaseIndikator() {
    const { boss, phaseIndex } = aktuellerKampf;
    el('combat-phase-indicator').textContent = `Phase ${phaseIndex + 1} von ${boss.phasen.length}`;
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

    const { aktuellePhase } = aktuellerKampf;
    const basisSchaden = Math.max(1, Math.round(100 / aktuellePhase.repZiel));
    const schaden = istCrit ? Math.round(basisSchaden * 1.5) : basisSchaden;

    spawnEffekt('impact-star', '💥', false);
    spawnEffekt('damage-number', `-${schaden}`, istCrit);
    if (istCrit) zeigePopupText(`COMBO x${aktuellerKampf.combo.anzahl}!`);
  }

  function repPlus() {
    if (!aktuellerKampf || aktuellerKampf.abgeschlossen) return;
    if (aktuellerKampf.reps >= aktuellerKampf.aktuellePhase.repZiel) return;

    const jetzt = Date.now();
    const combo = aktuellerKampf.combo;
    if (combo.letzterKlick && jetzt - combo.letzterKlick < COMBO_FENSTER_MS) {
      combo.anzahl += 1;
    } else {
      combo.anzahl = 1;
    }
    combo.letzterKlick = jetzt;

    aktuellerKampf.reps = Math.min(aktuellerKampf.reps + 1, aktuellerKampf.aktuellePhase.repZiel);
    aktualisiereCounter();
    spieleAngriffsAnimation(combo.anzahl >= COMBO_SCHWELLE);
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
    const { onClose } = aktuellerKampf;
    el('combat-modal').classList.add('hidden');
    aktuellerKampf = null;
    if (onClose) onClose({ geflohen: true });
  }

  function spieleKOSequenz(callback) {
    aktuellerKampf.abgeschlossen = true;
    triggerCss('combat-monster-svg', 'boss-ko');
    triggerCss('combat-modal-content', 'shake-final');

    setTimeout(() => {
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
      const { belohnung, levelUps } = abschliessen(character, monster, reps);
      zeigeErgebnis({
        character,
        titel: 'K.O.!',
        zeilen: [
          `+${Math.round(belohnung.xp)} XP${belohnung.klassenBonusAktiv ? ' (Klassen-Bonus!)' : ''}`,
          `+${Math.round(belohnung.gold)} Gold`,
          `+${belohnung.statBetrag} ${belohnung.stat}`,
        ],
        loot: belohnung.loot,
        levelUps,
        onWeiter: () => onClose({ geflohen: false, belohnung, levelUps }),
      });
    });
  }

  // Eine Boss-Phase geschafft: Stat sofort gutschreiben (jede Übung
  // trainiert ihren eigenen Stat), dann entweder zur nächsten Phase
  // oder — bei der letzten Phase — die volle K.O.-Sequenz + Belohnung.
  function fertigBossPhase() {
    const { character, aktuellePhase, reps, boss, phaseIndex, onClose } = aktuellerKampf;
    const statBetrag = Math.max(1, Math.floor(reps / 5));
    WoFState.statErhoehen(character, aktuellePhase.bonusStat, statBetrag);
    aktuellerKampf.gesammelteStatBoni[aktuellePhase.bonusStat] =
      (aktuellerKampf.gesammelteStatBoni[aktuellePhase.bonusStat] || 0) + statBetrag;

    const istLetztePhase = phaseIndex >= boss.phasen.length - 1;

    if (!istLetztePhase) {
      el('combat-controls').classList.add('hidden');
      zeigePopupText(`Phase ${phaseIndex + 1} geschafft!`);
      setTimeout(() => {
        if (!aktuellerKampf) return;
        aktuellerKampf.phaseIndex += 1;
        aktuellerKampf.aktuellePhase = boss.phasen[aktuellerKampf.phaseIndex];
        aktuellerKampf.reps = 0;
        aktuellerKampf.combo = { anzahl: 0, letzterKlick: 0 };
        aktualisierePhaseIndikator();
        aktualisiereExerciseUI();
        aktualisiereCounter();
        el('combat-controls').classList.remove('hidden');
      }, 1000);
      return;
    }

    el('combat-controls').classList.add('hidden');
    spieleKOSequenz(() => {
      const { belohnung, levelUps } = schliesseBossKampfAb(character, boss);
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
        ],
        loot: belohnung.loot,
        levelUps,
        flavorText: boss.flavorText,
        onWeiter: () => onClose({ geflohen: false, belohnung, levelUps }),
      });
    });
  }

  function zeigeErgebnis({ character, titel, zeilen, loot, levelUps, flavorText, onWeiter }) {
    const result = el('combat-result');
    result.classList.remove('hidden');
    result.innerHTML = `
      <h3>${titel}</h3>
      ${zeilen.map((z) => `<p>${z}</p>`).join('')}
      ${loot ? `<p class="loot">Beute: ${loot.rarity} — ${loot.name}</p>` : '<p>Kein Beutefund diesmal.</p>'}
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
  }

  return { starteKampf, starteBosskampf, initUI, berechneBelohnung };
})();
