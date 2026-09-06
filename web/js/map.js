/**
 * map.js — Karten-System mit Leaflet + OSM (Punkt 7 aus HANDOVER.md)
 *
 * Monster-Spawn (7.3) inkl. Boss-Spawn (5.3, Schritt 13) ist enthalten,
 * weil ohne ihn kein Testkampf möglich wäre. Overpass-Trainingsplätze
 * (7.2) sind noch TODO für eine spätere Iteration.
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

  let map = null;
  let playerPos = { ...FALLBACK_POS };
  let playerMarker = null;
  let monster = []; // { id, istBoss, familyId?, stufe?, bossId?, lat, lng, marker }
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
      },
      () => {
        // Keine Berechtigung / kein Signal (noch) -> Fallback-Position
        // nur nutzen, wenn wir noch gar keinen Marker haben. Ein echter
        // Fix, der später eintrifft, überschreibt das oben trotzdem noch.
        if (!playerMarker) {
          setzePlayerPosition(playerPos.lat, playerPos.lng);
          map.setView([playerPos.lat, playerPos.lng], 16);
          fuelleSpawns();
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

  return { init, setVorfuehrmodus, distanzMeter };
})();
