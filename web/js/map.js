/**
 * map.js — Karten-System mit Leaflet + OSM (Punkt 7 aus HANDOVER.md)
 *
 * Monster-Spawn (7.3) inkl. Boss-Spawn (5.3, Schritt 13) sowie die
 * Overpass-Trainingsplätze (7.2) sind enthalten.
 */

const WoFMap = (() => {
  const SPAWN_RADIUS_M = 500;
  const MAX_MONSTER = 6;
  const INTERACT_RADIUS_M = 30;
  const FALLBACK_POS = { lat: 52.52, lng: 13.405 }; // Berlin — falls keine Geolocation verfügbar ist
  // Punkt 7.3: "Bosse sehr selten (1x wenn verfügbar)" — eigene Umsetzung:
  // 12% Spawn-Chance pro freiem Slot (Mitte von Punkt 5.3s "10-15%"), und
  // nie mehr als ein Boss gleichzeitig auf der Karte.
  const BOSS_SPAWN_CHANCE = 0.12;

  // Punkt 7.2: echte Trainingsplätze aus OpenStreetMap via Overpass API.
  const TRAININGSPLATZ_RADIUS_M = 500; // gleicher Umkreis wie Monster-Spawns
  const TRAININGSPLATZ_NAEHE_M = 50; // "im 50m-Radius" -> Bonus gilt
  // Overpass ist ein geteilter Gratis-Dienst ohne Key — bewusst sparsam
  // abfragen statt bei jedem GPS-Tick: erst wenn sich der Spieler spürbar
  // bewegt hat UND seit der letzten Abfrage genug Zeit vergangen ist.
  const TRAININGSPLATZ_MIN_FETCH_ABSTAND_M = 300;
  const TRAININGSPLATZ_MIN_FETCH_INTERVALL_MS = 2 * 60 * 1000;

  const TRAININGSPLATZ_TYP_LABEL = {
    fitness_station: '🏋️ Fitness-Station',
    calisthenics: '🤸 Calisthenics-Park',
    fitness_centre: '🏢 Fitnessstudio',
    track: '🏃 Laufbahn',
    pitch: '⚽ Sportplatz',
  };

  let map = null;
  let playerPos = { ...FALLBACK_POS };
  let playerMarker = null;
  let monster = []; // { id, istBoss, familyId?, stufe?, bossId?, lat, lng, marker }
  let trainingsplaetze = []; // { lat, lng, name, typ, marker }
  let letzterTrainingsplatzFetch = { pos: null, zeit: 0 };
  let vorfuehrmodus = false;
  let character = null;
  let onFightEnded = null;

  function metersZuGrad(lat) {
    // Grobe Umrechnung Meter -> Grad, ausreichend für lokale Spawns.
    return {
      lat: 1 / 111320,
      lng: 1 / (111320 * Math.cos((lat * Math.PI) / 180)),
    };
  }

  function zufallsOffset(radiusM, lat) {
    const winkel = Math.random() * 2 * Math.PI;
    // Wurzel ziehen für flächengleichmäßige Verteilung im Kreis — sonst
    // häuft sich rund die Hälfte aller Spawns im inneren Viertel der
    // Fläche (r < radius/2), weil die Fläche eines Rings mit r wächst.
    const distanz = radiusM * Math.sqrt(Math.random());
    const grad = metersZuGrad(lat);
    return {
      lat: distanz * Math.sin(winkel) * grad.lat,
      lng: distanz * Math.cos(winkel) * grad.lng,
    };
  }

  function distanzMeter(a, b) {
    const R = 6371000;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function monsterIcon(familyId, stufe) {
    const svg = WoFMonsters.renderMonsterSVG(familyId, stufe);
    return L.divIcon({
      className: 'monster-marker',
      html: `<div class="monster-marker-inner">${svg}</div>`,
      iconSize: [40, 48],
      iconAnchor: [20, 48],
    });
  }

  function bossIcon(bossId) {
    const svg = WoFBosses.renderBossSVG(bossId);
    return L.divIcon({
      className: 'boss-marker',
      html: `<div class="boss-marker-inner">${svg}</div><div class="boss-marker-krone">👑</div>`,
      iconSize: [56, 64],
      iconAnchor: [28, 64],
    });
  }

  function versucheBossSpawn() {
    const bereitsAufKarte = monster.some((m) => m.istBoss);
    if (bereitsAufKarte) return null;
    if (Math.random() > BOSS_SPAWN_CHANCE) return null;
    // WoFBosses.zufallsBoss filtert intern schon nach Charakterlevel
    // (pro Boss über boss.minCharLevel) und Cooldown — liefert bei
    // Unterlevel oder lauter Cooldowns einfach null.
    return WoFBosses.zufallsBoss(character);
  }

  function spawneMonster() {
    if (monster.length >= MAX_MONSTER) return;
    const offset = zufallsOffset(SPAWN_RADIUS_M, playerPos.lat);
    const lat = playerPos.lat + offset.lat;
    const lng = playerPos.lng + offset.lng;
    const id = WoFState.cryptoId();

    const boss = versucheBossSpawn();
    let marker;
    let eintrag;
    if (boss) {
      marker = L.marker([lat, lng], { icon: bossIcon(boss.id) }).addTo(map);
      eintrag = { id, istBoss: true, bossId: boss.id, lat, lng, marker };
    } else {
      const familyId = WoFMonsters.zufallsFamilie();
      const stufe = WoFMonsters.zufallsStufe(character.level);
      marker = L.marker([lat, lng], { icon: monsterIcon(familyId, stufe) }).addTo(map);
      eintrag = { id, istBoss: false, familyId, stufe, lat, lng, marker };
    }
    marker.on('click', () => versucheKampf(id));
    monster.push(eintrag);
  }

  function fuelleSpawns() {
    while (monster.length < MAX_MONSTER) {
      spawneMonster();
    }
  }

  function entferneMonster(id) {
    const idx = monster.findIndex((m) => m.id === id);
    if (idx === -1) return;
    map.removeLayer(monster[idx].marker);
    monster.splice(idx, 1);
  }

  function entferneAlleMonster() {
    monster.forEach((m) => map.removeLayer(m.marker));
    monster = [];
  }

  function versucheKampf(id) {
    const m = monster.find((x) => x.id === id);
    if (!m) return;

    const distanz = distanzMeter(playerPos, { lat: m.lat, lng: m.lng });
    if (!vorfuehrmodus && distanz > INTERACT_RADIUS_M) {
      alert(
        `Zu weit weg! Du musst näher als ${INTERACT_RADIUS_M}m ran (aktuell ${Math.round(distanz)}m). ` +
          `Vorführmodus in den Einstellungen umgeht das zum Testen.`
      );
      return;
    }

    if (m.istBoss) {
      const boss = WoFBosses.BOSSE[m.bossId];
      WoFCombat.starteBosskampf(character, boss, (ergebnis) => {
        if (!ergebnis.geflohen) {
          entferneMonster(id);
          spawneMonster(); // Slot wird neu befüllt — dieser Boss selbst ist erst nach Cooldown wieder verfügbar
        }
        if (onFightEnded) onFightEnded(ergebnis);
      });
      return;
    }

    const monsterDaten = WoFMonsters.monsterDaten(m.familyId, m.stufe);
    WoFCombat.starteKampf(character, monsterDaten, (ergebnis) => {
      if (!ergebnis.geflohen) {
        entferneMonster(id);
        spawneMonster(); // Respawn nach Sieg (Punkt 5.1)
      }
      if (onFightEnded) onFightEnded(ergebnis);
    });
  }

  // ---- Trainingsplätze (Punkt 7.2) --------------------------------------

  function trainingsplatzIcon(typ) {
    const emoji = (TRAININGSPLATZ_TYP_LABEL[typ] || '🏋️ Trainingsplatz').split(' ')[0];
    return L.divIcon({
      className: 'trainingsplatz-marker',
      html: `<div class="trainingsplatz-marker-inner">${emoji}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });
  }

  function typVonOverpassElement(element) {
    const tags = element.tags || {};
    if (tags.leisure === 'fitness_station') return 'fitness_station';
    if (tags.sport === 'calisthenics') return 'calisthenics';
    if (tags.leisure === 'fitness_centre') return 'fitness_centre';
    if (tags.leisure === 'track') return 'track';
    if (tags.leisure === 'pitch') return 'pitch';
    return 'fitness_station';
  }

  function baueOverpassQuery(lat, lng, radius) {
    // Query exakt wie in HANDOVER 7.2 spezifiziert.
    return `[out:json][timeout:15];(
      node["leisure"="fitness_station"](around:${radius},${lat},${lng});
      node["sport"="calisthenics"](around:${radius},${lat},${lng});
      way["leisure"="fitness_centre"](around:${radius},${lat},${lng});
      way["leisure"="track"](around:${radius},${lat},${lng});
      node["leisure"="pitch"]["sport"~"soccer|basketball"](around:${radius},${lat},${lng});
    );out center;`;
  }

  function entferneAlleTrainingsplaetze() {
    trainingsplaetze.forEach((t) => map.removeLayer(t.marker));
    trainingsplaetze = [];
  }

  async function ladeTrainingsplaetze() {
    const jetzt = Date.now();
    if (letzterTrainingsplatzFetch.pos) {
      const abstand = distanzMeter(letzterTrainingsplatzFetch.pos, playerPos);
      const seitLetztemFetch = jetzt - letzterTrainingsplatzFetch.zeit;
      if (
        abstand < TRAININGSPLATZ_MIN_FETCH_ABSTAND_M &&
        seitLetztemFetch < TRAININGSPLATZ_MIN_FETCH_INTERVALL_MS
      ) {
        return;
      }
    }
    letzterTrainingsplatzFetch = { pos: { ...playerPos }, zeit: jetzt };

    const query = baueOverpassQuery(playerPos.lat, playerPos.lng, TRAININGSPLATZ_RADIUS_M);
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
      });
      if (!response.ok) return;
      const daten = await response.json();
      entferneAlleTrainingsplaetze();
      (daten.elements || []).forEach((element) => {
        const lat = element.lat !== undefined ? element.lat : element.center && element.center.lat;
        const lng = element.lon !== undefined ? element.lon : element.center && element.center.lon;
        if (lat === undefined || lng === undefined) return;
        const typ = typVonOverpassElement(element);
        const name = (element.tags && element.tags.name) || TRAININGSPLATZ_TYP_LABEL[typ];
        const marker = L.marker([lat, lng], { icon: trainingsplatzIcon(typ) }).addTo(map);
        marker.bindPopup(name);
        trainingsplaetze.push({ lat, lng, name, typ, marker });
      });
    } catch (e) {
      // Kein Netz, Overpass down, oder CORS blockiert -> stiller Fallback.
      // Die manuelle Checkbox im Trainings-Formular bleibt die Notlösung,
      // das Spiel bleibt ohne echte Trainingsplätze trotzdem voll spielbar.
      console.warn('WoF: Trainingsplätze konnten nicht geladen werden', e);
    }
  }

  // Für main.js: ist der Spieler gerade an einem bekannten echten
  // Trainingsplatz (Punkt 7.2: "im 50m-Radius")? Liefert auch den
  // nächstgelegenen zurück, wenn der Spieler (noch) zu weit weg ist —
  // damit die UI z.B. "Laufbahn, 180m entfernt" anzeigen kann.
  function pruefeTrainingsplatzNaehe() {
    let naechster = null;
    let naechsteDistanz = Infinity;
    trainingsplaetze.forEach((t) => {
      const d = distanzMeter(playerPos, t);
      if (d < naechsteDistanz) {
        naechsteDistanz = d;
        naechster = t;
      }
    });
    if (!naechster) return { angeschlagen: false };
    return {
      angeschlagen: naechsteDistanz <= TRAININGSPLATZ_NAEHE_M,
      name: naechster.name,
      distanz: Math.round(naechsteDistanz),
    };
  }

  function setzePlayerPosition(lat, lng) {
    playerPos = { lat, lng };
    if (!playerMarker) {
      playerMarker = L.marker([lat, lng], {
        icon: L.divIcon({ className: 'player-marker', html: '📍', iconSize: [24, 24] }),
      }).addTo(map);
    } else {
      playerMarker.setLatLng([lat, lng]);
    }
  }

  function starteGeolocation() {
    // Wird true, sobald der erste ECHTE GPS-Fix eintrifft (nicht die
    // Fallback-Position). Verhindert, dass die App bei einem langsamen
    // Kaltstart-Fix (Timeout, häufig drinnen) für immer auf Berlin
    // einrastet: kommt der echte Fix später doch noch rein, zentriert
    // die Karte dann alsdoch neu und respawnt die Monster dort.
    let echtePositionErhalten = false;

    if (!navigator.geolocation) {
      map.setView([playerPos.lat, playerPos.lng], 16);
      fuelleSpawns();
      ladeTrainingsplaetze();
      return;
    }
    navigator.geolocation.watchPosition(
      (pos) => {
        const neu = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setzePlayerPosition(neu.lat, neu.lng);
        if (!echtePositionErhalten) {
          echtePositionErhalten = true;
          map.setView([neu.lat, neu.lng], 16);
          entferneAlleMonster();
          fuelleSpawns();
        }
        ladeTrainingsplaetze(); // intern gedrosselt, kann bei jedem Fix aufgerufen werden
      },
      () => {
        // Keine Berechtigung / kein Signal (noch) -> Fallback-Position
        // nur nutzen, wenn wir noch gar keinen Marker haben. Ein echter
        // Fix, der später eintrifft, überschreibt das oben trotzdem noch.
        if (!playerMarker) {
          setzePlayerPosition(playerPos.lat, playerPos.lng);
          map.setView([playerPos.lat, playerPos.lng], 16);
          fuelleSpawns();
          ladeTrainingsplaetze();
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
    );
  }

  function setVorfuehrmodus(aktiv) {
    vorfuehrmodus = aktiv;
  }

  function init(elementId, char, callbacks) {
    character = char;
    onFightEnded = (callbacks && callbacks.onFightEnded) || null;

    map = L.map(elementId);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap-Mitwirkende',
      maxZoom: 19,
    }).addTo(map);

    map.setView([playerPos.lat, playerPos.lng], 16);
    starteGeolocation();
  }

  return { init, setVorfuehrmodus, distanzMeter, pruefeTrainingsplatzNaehe };
})();
