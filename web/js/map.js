/**
 * map.js — Karten-System mit Leaflet + OSM (Punkt 7 aus HANDOVER.md)
 *
 * Enthält aus Schritt 1 nur die Grundstruktur; Monster-Spawn (7.3) wird
 * hier ergänzt, weil ohne ihn kein Testkampf möglich wäre (Ziel dieser
 * Iteration laut Startprompt). Overpass-Trainingsplätze (7.2) sind noch
 * TODO für eine spätere Iteration.
 */

const WoFMap = (() => {
  const SPAWN_RADIUS_M = 500;
  const MAX_MONSTER = 6;
  const INTERACT_RADIUS_M = 30;
  const FALLBACK_POS = { lat: 52.52, lng: 13.405 }; // Berlin — falls keine Geolocation verfügbar ist

  let map = null;
  let playerPos = { ...FALLBACK_POS };
  let playerMarker = null;
  let monster = []; // { id, familyId, stufe, lat, lng, marker }
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
    const distanz = Math.random() * radiusM;
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

  function goblinIcon(stufe) {
    const svg = WoFMonsters.renderMonsterSVG('squat_goblin', stufe);
    return L.divIcon({
      className: 'monster-marker',
      html: `<div class="monster-marker-inner">${svg}</div>`,
      iconSize: [40, 48],
      iconAnchor: [20, 48],
    });
  }

  function spawneMonster() {
    if (monster.length >= MAX_MONSTER) return;
    const offset = zufallsOffset(SPAWN_RADIUS_M, playerPos.lat);
    const lat = playerPos.lat + offset.lat;
    const lng = playerPos.lng + offset.lng;
    const stufe = WoFMonsters.zufallsStufe(character.level);
    const id = WoFState.cryptoId();

    const marker = L.marker([lat, lng], { icon: goblinIcon(stufe) }).addTo(map);
    marker.on('click', () => versucheKampf(id));

    monster.push({ id, familyId: 'squat_goblin', stufe, lat, lng, marker });
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
    if (!navigator.geolocation) {
      map.setView([playerPos.lat, playerPos.lng], 16);
      fuelleSpawns();
      return;
    }
    navigator.geolocation.watchPosition(
      (pos) => {
        const neu = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const erstesMal = !playerMarker;
        setzePlayerPosition(neu.lat, neu.lng);
        if (erstesMal) {
          map.setView([neu.lat, neu.lng], 16);
          fuelleSpawns();
        }
      },
      () => {
        // Keine Berechtigung / kein Signal -> Fallback-Position nutzen (Test/Desktop)
        setzePlayerPosition(playerPos.lat, playerPos.lng);
        map.setView([playerPos.lat, playerPos.lng], 16);
        fuelleSpawns();
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
