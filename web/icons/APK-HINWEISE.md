# Hinweise für den Android-Wrapper (an den Bekannten)

Dieser `web/`-Ordner ist als Drop-in-Replacement für den bestehenden
WebView-Wrapper gedacht (siehe `ANLEITUNG_1.md` aus der vorherigen
Version). Ein paar Dinge, die der Wrapper für diese Version braucht:

## App-Icon

`icon-512.png` in diesem Ordner ist das Quellbild fürs native
Launcher-Icon. In Android Studio: Rechtsklick auf `res/` → New → Image
Asset → `icon-512.png` als Quelle wählen, Adaptive-Icon-Vordergrund
etwas verkleinern (die Kreis-Umrandung geht sonst beim Zuschneiden
verloren). `icon-192.png`/`favicon-*.png` sind nur fürs Web/PWA-Verhalten
gedacht (Manifest, Browser-Tab), nicht fürs native Icon.

## WebView-Einstellungen (im Wrapper-Code)

Diese App braucht zwingend:

- `setJavaScriptEnabled(true)`
- `setDomStorageEnabled(true)` — ohne das funktioniert localStorage
  nicht, und der komplette Spielstand (Charakter, Inventar, Talente,
  Boss-Cooldowns) geht bei jedem Neustart verloren
- `setGeolocationEnabled(true)` + `onGeolocationPermissionsShowPrompt`
  überschreiben (für die Karte, Punkt 7)
- Mixed-Content ist kein Thema, alles läuft über HTTPS (OSM-Tiles,
  Overpass-API, Google Fonts, Leaflet-CDN)

## Android-Berechtigungen (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

Ohne Internet-Berechtigung laden weder die Kartenkacheln noch Fonts
noch Leaflet selbst (Punkt 2: bewusst kein Vendoring, alles per
Script-Tag/CDN zur Laufzeit geladen).

## Sensor (Schritt 14, Zuckerhydra-Boss)

Braucht keine zusätzliche Android-Berechtigung (Accelerometer ist ein
"normal permission"-Sensor), funktioniert im WebView automatisch über
`DeviceMotionEvent`, sofern JavaScript aktiviert ist.

## Was NICHT hier drin ist

Kein Build-Schritt, kein `node_modules`, keine `.apk`-Signierung — das
bleibt wie gehabt euer Job im `android/`-Projekt. Dieser Ordner ist nur
die reine Web-App.
