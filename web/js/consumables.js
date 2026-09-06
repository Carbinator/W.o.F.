/**
 * consumables.js — Verbrauchsgüter/Supplements (eigene Erweiterung von
 * Punkt 5.5, auf Wunsch des Users)
 *
 * Vier Verbrauchsgüter, die Kämpfe/Bosse zusätzlich zur normalen
 * Ausrüstung droppen können. Beheben eine echte Lücke im ursprünglichen
 * Design: "Regeneration/Heilung" ergab erst Sinn, nachdem eine
 * Erschöpfungs-Mechanik (Energie-System, siehe state.js) existierte.
 *
 * Bewusst NICHT als Sieg/Niederlage-Mechanik gebaut (Punkt 6.5: keine
 * Boss-Gegenangriffe) — niedrige Energie ist nie ein Blocker, nur ein
 * sanfter Anreiz.
 */

const WoFConsumables = (() => {
  const SUPPLEMENTE = {
    eiweissshake: {
      id: 'eiweissshake',
      name: 'Eiweißshake',
      emoji: '🥤',
      beschreibung: 'Regeneration — füllt sofort 30 Energie auf.',
      dropGewichtMob: 25,
      dropGewichtBoss: 40,
      anwenden: (character) => {
        WoFState.energieAendern(character, 30);
        return '+30 Energie';
      },
    },
    omega3: {
      id: 'omega3',
      name: 'Omega-3 Kapsel',
      emoji: '🐟',
      beschreibung: 'Geistige Klarheit — +15% XP für die nächsten 3 Kämpfe.',
      dropGewichtMob: 10,
      dropGewichtBoss: 20,
      anwenden: (character) => {
        character.buffs.xpBonus = { kaempfeUebrig: 3, prozent: 15 };
        return '+15% XP für 3 Kämpfe';
      },
    },
    kreatin: {
      id: 'kreatin',
      name: 'Kreatin',
      emoji: '💊',
      beschreibung: 'Energie-Booster — +15% Stat-Zuwachs für die nächsten 3 Kämpfe.',
      dropGewichtMob: 10,
      dropGewichtBoss: 20,
      anwenden: (character) => {
        character.buffs.statBonus = { kaempfeUebrig: 3, prozent: 15 };
        return '+15% Stat-Zuwachs für 3 Kämpfe';
      },
    },
    swoley_shake: {
      id: 'swoley_shake',
      name: 'Swoley Shake',
      emoji: '🧪',
      beschreibung: 'XP-Elixier — volle Energie + beide Buffs auf +20% für 3 Kämpfe.',
      dropGewichtMob: 2,
      dropGewichtBoss: 8,
      anwenden: (character) => {
        WoFState.energieAendern(character, WoFState.ENERGIE_MAX);
        character.buffs.xpBonus = { kaempfeUebrig: 3, prozent: 20 };
        character.buffs.statBonus = { kaempfeUebrig: 3, prozent: 20 };
        return 'Volle Energie + beide Buffs auf +20% für 3 Kämpfe';
      },
    },
  };

  // Jedes Supplement wird UNABHÄNGIG gewürfelt (mehrere Drops pro Kampf
  // möglich) — eigene Annahme, im HANDOVER nicht spezifiziert. Boss-Kämpfe
  // haben durchgehend höhere Gewichte, passend zu "Endbosse sind wichtig".
  function wuerfleDrops(istBoss) {
    const gedroppt = [];
    Object.values(SUPPLEMENTE).forEach((supplement) => {
      const gewicht = istBoss ? supplement.dropGewichtBoss : supplement.dropGewichtMob;
      if (Math.random() * 100 < gewicht) {
        gedroppt.push(supplement.id);
      }
    });
    return gedroppt;
  }

  function gutschreiben(character, supplementIds) {
    supplementIds.forEach((id) => {
      character.consumables[id] = (character.consumables[id] || 0) + 1;
    });
  }

  function verbrauchen(character, supplementId) {
    const supplement = SUPPLEMENTE[supplementId];
    if (!supplement) return null;
    if (!character.consumables[supplementId]) return null;
    character.consumables[supplementId] -= 1;
    WoFState.aktualisiereEnergiePassiv(character);
    return supplement.anwenden(character);
  }

  return { SUPPLEMENTE, wuerfleDrops, gutschreiben, verbrauchen };
})();
