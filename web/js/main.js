/**
 * main.js — App-Bootstrap, Tab-Navigation, Charakter-Editor, Held-Tab
 * (Punkt 15 Schritte 1, 4, 6)
 */

(() => {
  let character = null;
  let editorModus = 'erstellen'; // 'erstellen' | 'bearbeiten'

  function el(id) {
    return document.getElementById(id);
  }

  // ---- Ansichten / Tabs -------------------------------------------------

  function zeigeView(name) {
    document.querySelectorAll('.view').forEach((v) => v.classList.add('hidden'));
    el('view-' + name).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === name);
    });
  }

  function initNav() {
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        zeigeView(btn.dataset.view);
        if (btn.dataset.view === 'held') renderHeldTab();
        if (btn.dataset.view === 'talente') renderTalenteTab();
      });
    });
  }

  // ---- Charakter-Editor (Punkt 4.3) --------------------------------------

  function initEditorStatischeFelder() {
    const klasseContainer = el('editor-klasse-optionen');
    Object.values(WoFState.KLASSEN).forEach((k) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'klasse-option';
      btn.dataset.klasse = k.key;
      btn.innerHTML = `<span class="klasse-emoji">${k.emoji}</span><span>${k.name}</span>`;
      btn.title = k.beschreibung;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.klasse-option').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        klasseContainer.dataset.value = k.key;
        aktualisiereLiveVorschau();
      });
      klasseContainer.appendChild(btn);
    });

    const hauttonContainer = el('editor-hautton-swatches');
    WoFState.HAUTTON_PRESETS.forEach((farbe) => {
      hauttonContainer.appendChild(erstelleSwatch(farbe, hauttonContainer));
    });

    const haarfarbeContainer = el('editor-haarfarbe-swatches');
    WoFState.HAARFARBE_PRESETS.forEach((farbe) => {
      haarfarbeContainer.appendChild(erstelleSwatch(farbe, haarfarbeContainer));
    });

    const frisurSelect = el('editor-frisur');
    WoFState.FRISUREN.forEach((f) => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f.charAt(0).toUpperCase() + f.slice(1);
      frisurSelect.appendChild(opt);
    });

    const fitnessSelect = el('editor-fitnessStartlevel');
    Object.entries(WoFState.FITNESS_STARTLEVEL).forEach(([stufe, info]) => {
      const opt = document.createElement('option');
      opt.value = stufe;
      opt.textContent = `${stufe} — ${info.label}`;
      fitnessSelect.appendChild(opt);
    });
    fitnessSelect.addEventListener('change', () => {
      const info = WoFState.FITNESS_STARTLEVEL[fitnessSelect.value];
      el('editor-fitness-hint').textContent =
        `Start-Charakterlevel ${info.startCharLvl}, +${info.statBonus} auf jeden Wert.`;
    });

    ['geschlecht', 'koerperbau', 'frisur', 'fitnessStartlevel', 'name'].forEach((feldId) => {
      el('editor-' + feldId).addEventListener('input', aktualisiereLiveVorschau);
    });
  }

  function erstelleSwatch(farbe, container) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch';
    btn.style.backgroundColor = farbe;
    btn.dataset.farbe = farbe;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.swatch').forEach((s) => s.classList.remove('selected'));
      btn.classList.add('selected');
      container.dataset.value = farbe;
      aktualisiereLiveVorschau();
    });
    return btn;
  }

  function leseEditorWerte() {
    return {
      name: el('editor-name').value.trim(),
      klasse: el('editor-klasse-optionen').dataset.value,
      geschlecht: el('editor-geschlecht').value,
      koerperbau: el('editor-koerperbau').value,
      hautton: el('editor-hautton-swatches').dataset.value,
      haarfarbe: el('editor-haarfarbe-swatches').dataset.value,
      frisur: el('editor-frisur').value,
      fitnessStartlevel: parseInt(el('editor-fitnessStartlevel').value, 10),
    };
  }

  function aktualisiereLiveVorschau() {
    const werte = leseEditorWerte();
    el('editor-avatar-svg').innerHTML = WoFAvatar.renderAvatarSVG(werte);
  }

  function setzeEditorDefaults(vorlage) {
    el('editor-name').value = vorlage ? vorlage.name : '';
    el('editor-geschlecht').value = vorlage ? vorlage.geschlecht : 'diverse';
    el('editor-koerperbau').value = vorlage ? vorlage.koerperbau : 'meso';
    el('editor-frisur').value = vorlage ? vorlage.frisur : 'kurz';

    const hautton = vorlage ? vorlage.hautton : WoFState.HAUTTON_PRESETS[0];
    const haarfarbe = vorlage ? vorlage.haarfarbe : WoFState.HAARFARBE_PRESETS[0];
    markiereSwatch('editor-hautton-swatches', hautton);
    markiereSwatch('editor-haarfarbe-swatches', haarfarbe);

    const klasse = vorlage ? vorlage.klasse : 'barbar';
    el('editor-klasse-optionen').dataset.value = klasse;
    document.querySelectorAll('.klasse-option').forEach((b) => {
      b.classList.toggle('selected', b.dataset.klasse === klasse);
    });

    el('editor-fitnessStartlevel').value = vorlage ? vorlage.fitnessStartlevel : 1;
    const info = WoFState.FITNESS_STARTLEVEL[vorlage ? vorlage.fitnessStartlevel : 1];
    el('editor-fitness-hint').textContent =
      `Start-Charakterlevel ${info.startCharLvl}, +${info.statBonus} auf jeden Wert.`;
  }

  function markiereSwatch(containerId, farbe) {
    const container = el(containerId);
    container.dataset.value = farbe;
    container.querySelectorAll('.swatch').forEach((s) => {
      s.classList.toggle('selected', s.dataset.farbe === farbe);
    });
  }

  function starteEditor(modus) {
    editorModus = modus;
    const istBearbeiten = modus === 'bearbeiten';

    el('editor-title').textContent = istBearbeiten ? 'Charakter bearbeiten' : 'Charakter erstellen';
    el('editor-submit-btn').textContent = istBearbeiten ? 'Speichern' : 'Charakter erstellen';
    el('editor-cancel-btn').classList.toggle('hidden', !istBearbeiten);

    el('editor-klasse-wrap').classList.toggle('hidden', istBearbeiten);
    el('editor-klasse-readonly').classList.toggle('hidden', !istBearbeiten);
    el('editor-fitness-wrap').classList.toggle('hidden', istBearbeiten);
    el('editor-fitness-readonly').classList.toggle('hidden', !istBearbeiten);

    if (istBearbeiten) {
      const klasse = WoFState.KLASSEN[character.klasse];
      el('editor-klasse-readonly').textContent = `Klasse: ${klasse.emoji} ${klasse.name} (nicht änderbar)`;
      const info = WoFState.FITNESS_STARTLEVEL[character.fitnessStartlevel];
      el('editor-fitness-readonly').textContent =
        `Fitness-Startlevel: ${info.label} (nur bei Erstellung wählbar)`;
    }

    setzeEditorDefaults(istBearbeiten ? character : null);
    aktualisiereLiveVorschau();
    zeigeView('editor');
  }

  function onEditorSubmit(evt) {
    evt.preventDefault();
    const werte = leseEditorWerte();

    if (editorModus === 'erstellen') {
      if (!werte.name) {
        alert('Bitte einen Namen eingeben.');
        return;
      }
      if (!werte.klasse) {
        alert('Bitte eine Klasse auswählen.');
        return;
      }
      character = WoFState.neuerCharakter(werte);
      WoFState.speichern(character);
      zeigeMainApp();
    } else {
      character.name = werte.name ? werte.name.slice(0, 24) : character.name;
      character.geschlecht = werte.geschlecht;
      character.koerperbau = werte.koerperbau;
      character.hautton = werte.hautton;
      character.haarfarbe = werte.haarfarbe;
      character.frisur = werte.frisur;
      WoFState.speichern(character);
      renderHeldTab();
      zeigeView('held');
    }
  }

  // ---- Held-Tab -----------------------------------------------------------

  function renderHeldTab() {
    if (!character) return;
    const klasse = WoFState.KLASSEN[character.klasse];

    el('held-avatar').innerHTML = WoFAvatar.renderAvatarSVG(character);
    el('held-name').textContent = character.name;
    el('held-klasse').textContent = `${klasse.emoji} ${klasse.name} — Level ${character.level}`;

    const bedarf = WoFState.xpFuerNaechstesLevel(character.level);
    el('held-xp-fill').style.width = `${Math.min(100, (character.xp / bedarf) * 100)}%`;
    const bosseBesiegt = character.besiegteMonster.filter((m) => m.istBoss).length;
    el('held-level-xp-text').textContent =
      `${character.xp} / ${bedarf} XP · Streak: ${character.streak.count} Tag(e) · 👑 ${bosseBesiegt} Boss(e) besiegt`;
    el('held-gold').textContent = `💰 ${character.gold} Gold · 🌳 ${character.talentPunkte} Talentpunkt(e)`;

    const effektiv = WoFState.effektiveStats(character);
    el('held-stats').innerHTML = WoFState.STATS.map(
      (s) => `<li><span>${s}</span><span>${effektiv[s]}</span></li>`
    ).join('');

    const ausruestungListe = Object.entries(character.equipped)
      .filter(([, item]) => item)
      .map(([slot, item]) => `
        <li>
          <span>${SLOT_NAMEN[slot] || slot}: ${item.name}</span>
          <span>${formatBoni(item.bonuses)}</span>
          <button class="btn-secondary ablegen-btn" data-slot="${slot}">Ablegen</button>
        </li>`)
      .join('');
    el('held-ausruestung').innerHTML = ausruestungListe || '<li>Nichts ausgerüstet</li>';
    el('held-ausruestung').querySelectorAll('.ablegen-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        WoFState.ablegen(character, btn.dataset.slot);
        WoFState.speichern(character);
        renderHeldTab();
      });
    });

    const inventarListe = character.inventory
      .map((item) => {
        const istAusgeruestet = character.equipped[item.slot] && character.equipped[item.slot].id === item.id;
        return `
          <li>
            <span>${item.name}${istAusgeruestet ? ' (ausgerüstet)' : ''}</span>
            <span>${formatBoni(item.bonuses)}</span>
            <button class="btn-secondary ausruesten-btn" data-id="${item.id}" ${istAusgeruestet ? 'disabled' : ''}>Ausrüsten</button>
          </li>`;
      })
      .join('');
    el('held-inventar').innerHTML = inventarListe || '<li>Inventar ist leer</li>';
    el('held-inventar').querySelectorAll('.ausruesten-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        WoFState.ausruesten(character, btn.dataset.id);
        WoFState.speichern(character);
        renderHeldTab();
      });
    });
  }

  const SLOT_NAMEN = { armor: 'Rüstung', weapon: 'Waffe', amulet: 'Amulett' };

  function formatBoni(bonuses) {
    return Object.entries(bonuses || {})
      .map(([stat, wert]) => `+${wert} ${stat}`)
      .join(', ');
  }

  // ---- Talente-Tab (Punkt 4.6) ----------------------------------------------

  function renderTalenteTab() {
    if (!character) return;
    el('talente-punkte-hint').textContent =
      `${character.talentPunkte} Talentpunkt(e) verfügbar — kommen bei jedem Level-Up dazu.`;

    const baeume = WoFState.talentbaumFuer(character.klasse);
    el('talente-baeume').innerHTML = baeume.map((ast) => {
      const stufe = character.talente[ast.astKey] || 0;
      const stufenHtml = ast.stufenWerte.map((_, i) => {
        const erreicht = i < stufe;
        return `<div class="talent-stufe ${erreicht ? 'erreicht' : ''}">${i + 1}</div>`;
      }).join('');

      const aktuelleBeschreibung = stufe > 0 ? ast.beschreibung(kumuliertBisStufe(ast, stufe)) : 'Noch keine Stufe';
      const naechsteBeschreibung = stufe < 3
        ? `Nächste Stufe: ${ast.beschreibung(kumuliertBisStufe(ast, stufe + 1))}`
        : 'Maximalstufe erreicht';

      return `
        <div class="talent-ast">
          <h3>${ast.name}</h3>
          <div class="talent-stufen">${stufenHtml}</div>
          <p class="field-hint">${aktuelleBeschreibung}</p>
          <p class="field-hint">${naechsteBeschreibung}</p>
          <button class="btn-secondary talent-btn" data-ast="${ast.astKey}" ${stufe >= 3 || character.talentPunkte <= 0 ? 'disabled' : ''}>
            Punkt investieren
          </button>
        </div>
      `;
    }).join('');

    el('talente-baeume').querySelectorAll('.talent-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (WoFState.talentAusgeben(character, btn.dataset.ast)) {
          WoFState.speichern(character);
          renderTalenteTab();
        }
      });
    });
  }

  function kumuliertBisStufe(ast, stufe) {
    return ast.stufenWerte.slice(0, stufe).reduce((sum, wert) => sum + wert, 0);
  }

  // ---- Freies Training (Punkt 9) -------------------------------------------

  function initTrainingForm() {
    const typSelect = el('training-typ');
    Object.entries(WoFFreiesTraining.TYPEN).forEach(([key, info]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = info.label;
      typSelect.appendChild(opt);
    });

    const intSelect = el('training-intensitaet');
    Object.entries(WoFFreiesTraining.INTENSITAETEN).forEach(([key, info]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = info.label;
      if (key === 'mittel') opt.selected = true;
      intSelect.appendChild(opt);
    });

    el('training-form').addEventListener('submit', onTrainingSubmit);
  }

  function onTrainingSubmit(evt) {
    evt.preventDefault();
    if (!character) return;

    const eingabe = {
      typ: el('training-typ').value,
      dauerMinuten: parseInt(el('training-dauer').value, 10),
      intensitaet: el('training-intensitaet').value,
      trainingsplatz: el('training-trainingsplatz').checked,
    };
    if (!eingabe.dauerMinuten || eingabe.dauerMinuten < 5) {
      alert('Bitte eine Dauer von mindestens 5 Minuten angeben.');
      return;
    }

    const { belohnung, levelUps } = WoFFreiesTraining.abschliessen(character, eingabe);

    const statText = Object.entries(belohnung.statBoni)
      .map(([stat, betrag]) => `+${betrag} ${stat}`)
      .join(', ');
    const result = el('training-result');
    result.classList.remove('hidden');
    result.innerHTML = `
      <p>Training eingetragen! +${Math.round(belohnung.xp)} XP, ${statText}</p>
      ${levelUps.length ? `<p class="levelup">Level Up! Jetzt Stufe ${character.level}</p>` : ''}
      <p class="field-hint">Streak: ${character.streak.count} Tag(e)</p>
    `;

    renderHeldTab();
  }

  // ---- App-Start ------------------------------------------------------------

  function zeigeMainApp() {
    el('app-header').classList.remove('hidden');
    zeigeView('karte');
    renderHeldTab();
    WoFMap.init('map', character, {
      onFightEnded: () => {
        WoFState.speichern(character);
        renderHeldTab();
      },
    });
  }

  function init() {
    character = WoFState.laden();

    initNav();
    initEditorStatischeFelder();
    initTrainingForm();
    el('editor-form').addEventListener('submit', onEditorSubmit);
    el('editor-cancel-btn').addEventListener('click', () => zeigeView('held'));
    el('held-edit-btn').addEventListener('click', () => starteEditor('bearbeiten'));
    el('vorfuehrmodus-toggle').addEventListener('change', (e) => WoFMap.setVorfuehrmodus(e.target.checked));

    WoFCombat.initUI();

    if (character) {
      zeigeMainApp();
    } else {
      starteEditor('erstellen');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
