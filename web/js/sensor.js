/**
 * sensor.js — Sensor-Integration für Special-Kämpfe (Punkt 8 aus HANDOVER.md)
 *
 * DeviceMotionEvent (Accelerometer) zur automatischen Rep-Erkennung.
 * iOS-Falle (Punkt 8): Ab iOS 13 muss DeviceMotionEvent.requestPermission()
 * explizit nach einer User-Interaktion aufgerufen werden, sonst kommen
 * keine Daten — deshalb wird die Berechtigung erst beim Klick auf den
 * Sensor-Button angefragt, nie automatisch.
 *
 * Schwellenwerte für die Bewegungserkennung sind eine eigene Annahme
 * (im HANDOVER nicht spezifiziert) und müssten auf echten Geräten
 * feinjustiert werden — funktionieren hier als einfacher
 * Peak-Detektor auf der Beschleunigungs-Magnitude.
 *
 * Nicht bei jedem Kampf nötig — nur als Special-Feature für
 * ausgewählte Bosse (aktuell: Zuckerhydra). Manueller Rep-Counter
 * bleibt dabei immer zusätzlich bedienbar, falls die Erkennung mal
 * einen Rep verpasst.
 */

const WoFSensor = (() => {
  const RUHE_MAGNITUDE = 9.8; // Erdschwerkraft, grobe Kalibrierungs-Annahme
  const SCHWELLE = 3.0; // m/s² Abweichung von der Ruhelage, die als "Bewegung" zählt
  const RUECKFALL_SCHWELLE = SCHWELLE * 0.5; // Magnitude muss erst wieder absinken, bevor der nächste Peak zählt
  const MIN_ABSTAND_MS = 400; // Mindestabstand zwischen zwei erkannten Reps

  function istVerfuegbar() {
    return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
  }

  function brauchtBerechtigung() {
    return istVerfuegbar() && typeof DeviceMotionEvent.requestPermission === 'function';
  }

  // MUSS aus einem direkten User-Interaktions-Handler (Klick) aufgerufen
  // werden — sonst schlägt die Anfrage auf iOS stillschweigend fehl.
  async function anfragenBerechtigung() {
    if (!istVerfuegbar()) return false;
    if (!brauchtBerechtigung()) return true; // Android/Desktop kennen diese Anfrage nicht
    try {
      const ergebnis = await DeviceMotionEvent.requestPermission();
      return ergebnis === 'granted';
    } catch (e) {
      console.error('WoF: Sensor-Berechtigung fehlgeschlagen', e);
      return false;
    }
  }

  // Startet die Bewegungserkennung, ruft onRep() bei jedem erkannten
  // Ausschlag auf. Gibt eine stop()-Funktion zurück.
  function starteErkennung(onRep) {
    let ueberSchwelle = false;
    let letzterRepZeit = 0;

    function handleMotion(event) {
      const a = event.accelerationIncludingGravity || event.acceleration;
      if (!a || a.x === null) return;
      const magnitude = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
      const abweichung = Math.abs(magnitude - RUHE_MAGNITUDE);
      const jetzt = Date.now();

      if (!ueberSchwelle && abweichung > SCHWELLE && jetzt - letzterRepZeit > MIN_ABSTAND_MS) {
        ueberSchwelle = true;
        letzterRepZeit = jetzt;
        onRep();
      } else if (ueberSchwelle && abweichung < RUECKFALL_SCHWELLE) {
        ueberSchwelle = false;
      }
    }

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }

  return { istVerfuegbar, brauchtBerechtigung, anfragenBerechtigung, starteErkennung };
})();
