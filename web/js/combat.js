/**
 * combat.js — Kampf-Modal + Belohnungssystem + Streetfighter-Overlay
 * (Punkt 5.4/5.5/5.6 + Punkt 6, Schritte 6/7/9/10)
 *
 * VS-Intro, Attack-Choreografie mit Combo-Tracking und K.O.-Sequenz
 * laufen rein CSS-animiert; die Reflow-Trick-Helper (triggerCss) sorgen
 * dafür, dass Animationen bei schnellen Klicks jedes Mal neu starten.
 * Sounds (Punkt 6.5) und Special-Moves nach 5er-Combo sind bewusst noch
 * nicht gebaut (späterer Feinschliff).
 */

const WoFCombat = (() => {
  const RARITAETEN = ['gewöhnlich', 'ungewöhnlich', 'selten', 'episch', 'legendär'];

  // ---- Belohnungslogik (Punkt 5.4) --------------------------------------

  function klassenBonusAktiv(character, monster) {
    const klasse = WoFState.KLASSEN[character.klasse];
    return klasse.bonusStat === monster.bonusStat;
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

    // Rarity-Gewichtung: höhere Stufe verschiebt Wahrscheinlichkeit nach oben.
    // Eigene Annahme, im HANDOVER nicht exakt spezifiziert.
    const gewichte = [50, 30, 14, 5, 1].map((g, i) => g + stufe * (i * 1.5));
    const summe = gewichte.reduce((a, b) => a + b, 0);
    let roll = Math.random() * summe;
    let rarityIndex = 0;
    for (let i = 0; i < gewichte.length; i++) {
      roll -= gewichte[i];
      if (roll <= 0) {
        rarityIndex = i;
        break;
      }
    }
    const rarity = RARITAETEN[rarityIndex];
    return generiereItem(rarity, stufe);
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
    const klassenBonus = klassenBonusAktiv(character, monster) ? 1.25 : 1.0;
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

  // ---- Modal-UI -----------------------------------------------------------

  const COMBO_FENSTER_MS = 1200; // Punkt 6.3: <1200ms Abstand zählt als Combo
  const COMBO_SCHWELLE = 3; // ab 3x Combo: goldener Popup + Crit-Schadenszahlen

  let aktuellerKampf = null; // { monster, reps, character, onClose, combo, abgeschlossen }

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
      character,
      monster,
      reps: 0,
      onClose,
      combo: { anzahl: 0, letzterKlick: 0 },
      abgeschlossen: false,
    };

    el('combat-monster-name').textContent = monster.name;
    el('combat-monster-svg').innerHTML = WoFMonsters.renderMonsterSVG(monster.familyId, monster.stufe);
    el('combat-monster-svg').className = 'combat-fighter';
    el('combat-player-svg').innerHTML = WoFAvatar.renderAvatarSVG(character);
    el('combat-player-svg').className = 'combat-fighter';
    el('combat-monster-effects').innerHTML = '';
    el('combat-exercise').textContent = monster.uebung;
    el('combat-result').classList.add('hidden');
    el('combat-controls').classList.add('hidden');
    el('combat-ko-overlay').classList.add('hidden');
    el('combat-ko-overlay').classList.remove('play');
    aktualisiereCounter();

    el('combat-modal').classList.remove('hidden');
    spieleVSIntro(monster, () => {
      if (aktuellerKampf) el('combat-controls').classList.remove('hidden');
    });
  }

  function spieleVSIntro(monster, onDone) {
    const intro = el('combat-intro');
    el('combat-intro-monster-name').textContent = monster.name.toUpperCase();
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
    const { reps, monster } = aktuellerKampf;
    el('combat-counter').textContent = `${reps} / ${monster.repZiel}`;
    const fertigBtn = el('combat-fertig-btn');
    const geschafft = reps >= monster.repZiel;
    fertigBtn.disabled = !geschafft;
    fertigBtn.classList.toggle('bereit', geschafft);

    const hpAnteil = Math.max(0, 1 - reps / monster.repZiel);
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

  function zeigeComboPopup(anzahl) {
    const popup = el('combat-combo-popup');
    popup.textContent = `COMBO x${anzahl}!`;
    popup.classList.remove('show');
    void popup.offsetWidth;
    popup.classList.add('show');
  }

  function spieleAngriffsAnimation(istCrit) {
    triggerCss('combat-player-svg', 'lunge');
    triggerCss('combat-monster-svg', 'hit');
    triggerCss('combat-modal-content', 'shake');

    const { monster } = aktuellerKampf;
    const basisSchaden = Math.max(1, Math.round(100 / monster.repZiel));
    const schaden = istCrit ? Math.round(basisSchaden * 1.5) : basisSchaden;

    spawnEffekt('impact-star', '💥', false);
    spawnEffekt('damage-number', `-${schaden}`, istCrit);
    if (istCrit) zeigeComboPopup(aktuellerKampf.combo.anzahl);
  }

  function repPlus() {
    if (!aktuellerKampf || aktuellerKampf.abgeschlossen) return;
    if (aktuellerKampf.reps >= aktuellerKampf.monster.repZiel) return;

    const jetzt = Date.now();
    const combo = aktuellerKampf.combo;
    if (combo.letzterKlick && jetzt - combo.letzterKlick < COMBO_FENSTER_MS) {
      combo.anzahl += 1;
    } else {
      combo.anzahl = 1;
    }
    combo.letzterKlick = jetzt;

    aktuellerKampf.reps = Math.min(aktuellerKampf.reps + 1, aktuellerKampf.monster.repZiel);
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
    const { character, monster, reps } = aktuellerKampf;
    if (reps < monster.repZiel) return;

    el('combat-controls').classList.add('hidden');

    spieleKOSequenz(() => {
      const { character: c, monster: m, reps: r, onClose } = aktuellerKampf;
      const { belohnung, levelUps } = abschliessen(c, m, r);

      const result = el('combat-result');
      result.classList.remove('hidden');
      result.innerHTML = `
        <h3>K.O.!</h3>
        <p>+${Math.round(belohnung.xp)} XP${belohnung.klassenBonusAktiv ? ' (Klassen-Bonus!)' : ''}</p>
        <p>+${Math.round(belohnung.gold)} Gold</p>
        <p>+${belohnung.statBetrag} ${belohnung.stat}</p>
        ${belohnung.loot ? `<p class="loot">Beute: ${belohnung.loot.rarity} — ${belohnung.loot.name}</p>` : '<p>Kein Beutefund diesmal.</p>'}
        ${levelUps.length ? `<p class="levelup">Level Up! Jetzt Stufe ${c.level}</p>` : ''}
        <button id="combat-weiter-btn" class="btn-primary">Weiter</button>
      `;
      el('combat-weiter-btn').addEventListener('click', () => {
        el('combat-modal').classList.add('hidden');
        aktuellerKampf = null;
        if (onClose) onClose({ geflohen: false, belohnung, levelUps });
      });
    });
  }

  function initUI() {
    el('combat-plus-btn').addEventListener('click', repPlus);
    el('combat-minus-btn').addEventListener('click', repMinus);
    el('combat-flee-btn').addEventListener('click', fliehen);
    el('combat-fertig-btn').addEventListener('click', fertig);
  }

  return { starteKampf, initUI, berechneBelohnung };
})();
