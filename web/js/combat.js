/**
 * combat.js — Kampf-Modal + Belohnungssystem (Punkt 5.4/5.5/5.6 + Schritt 6)
 *
 * Schlichte Version laut Punkt 15 Schritt 6: Rep-Counter + Erledigt-Button.
 * Das volle Streetfighter-Overlay (Punkt 6) kommt erst in Schritt 9 —
 * bewusst noch nicht hier gebaut, damit der Zwischenstand testbar bleibt.
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

  function lootWuerfeln(stufe) {
    // Normale Monster: 20-60% Chance je nach Level (Punkt 5.4), linear über 5 Stufen.
    const chance = 0.2 + (stufe - 1) * 0.1;
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
    const klassenBonus = klassenBonusAktiv(character, monster) ? 1.25 : 1.0;
    const talentMultiplikator = 1.0; // TODO: Skilltree (Punkt 15 Schritt 11) noch nicht implementiert
    const ueberperformung = 1 + ueberperformanceFaktor(reps, monster.repZiel);
    const xp = monster.xpBasis * klassenBonus * talentMultiplikator * ueberperformung;

    const streakMultiplikator = 1 + Math.min(character.streak.count, 20) * 0.02;
    const gold = monster.goldBasis * streakMultiplikator;

    const statBetrag = Math.max(1, Math.floor(reps / 5));
    const loot = lootWuerfeln(monster.stufe);

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

  let aktuellerKampf = null; // { monster, reps, character, onClose }

  function el(id) {
    return document.getElementById(id);
  }

  function starteKampf(character, monster, onClose) {
    aktuellerKampf = { character, monster, reps: 0, onClose };

    el('combat-monster-name').textContent = monster.name;
    el('combat-monster-svg').innerHTML = WoFMonsters.renderMonsterSVG(monster.familyId, monster.stufe);
    el('combat-player-svg').innerHTML = WoFAvatar.renderAvatarSVG(character);
    el('combat-exercise').textContent = monster.uebung;
    el('combat-result').classList.add('hidden');
    el('combat-controls').classList.remove('hidden');
    aktualisiereCounter();

    el('combat-modal').classList.remove('hidden');
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

  function repPlus() {
    if (!aktuellerKampf) return;
    aktuellerKampf.reps = Math.min(aktuellerKampf.reps + 1, aktuellerKampf.monster.repZiel);
    aktualisiereCounter();
  }

  function repMinus() {
    if (!aktuellerKampf) return;
    aktuellerKampf.reps = Math.max(aktuellerKampf.reps - 1, 0);
    aktualisiereCounter();
  }

  function fliehen() {
    if (!aktuellerKampf) return;
    const { onClose } = aktuellerKampf;
    el('combat-modal').classList.add('hidden');
    aktuellerKampf = null;
    if (onClose) onClose({ geflohen: true });
  }

  function fertig() {
    if (!aktuellerKampf) return;
    const { character, monster, reps, onClose } = aktuellerKampf;
    if (reps < monster.repZiel) return;

    const { belohnung, levelUps } = abschliessen(character, monster, reps);

    el('combat-controls').classList.add('hidden');
    const result = el('combat-result');
    result.classList.remove('hidden');
    result.innerHTML = `
      <h3>K.O.!</h3>
      <p>+${Math.round(belohnung.xp)} XP${belohnung.klassenBonusAktiv ? ' (Klassen-Bonus!)' : ''}</p>
      <p>+${Math.round(belohnung.gold)} Gold</p>
      <p>+${belohnung.statBetrag} ${belohnung.stat}</p>
      ${belohnung.loot ? `<p class="loot">Beute: ${belohnung.loot.rarity} — ${belohnung.loot.name}</p>` : '<p>Kein Beutefund diesmal.</p>'}
      ${levelUps.length ? `<p class="levelup">Level Up! Jetzt Stufe ${character.level}</p>` : ''}
      <button id="combat-weiter-btn" class="btn-primary">Weiter</button>
    `;
    el('combat-weiter-btn').addEventListener('click', () => {
      el('combat-modal').classList.add('hidden');
      const kampf = aktuellerKampf;
      aktuellerKampf = null;
      if (kampf.onClose) kampf.onClose({ geflohen: false, belohnung, levelUps });
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
