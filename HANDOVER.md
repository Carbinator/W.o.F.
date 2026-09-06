# WoF — Handover-Dokument für Claude Code (Neuaufbau)

**Kontext:** Diese Datei fasst alle Design-Entscheidungen, Content-Kanon und offenen Fragen zusammen, die in einer vorherigen Chat-Session mit Claude besprochen wurden. Nutze sie als Referenz beim Neuaufbau der App als Client-Only-Web-App.

---

## Status für die Übergabe (Stand 2026-09-06, nach finalem Testdurchlauf)

**Fertig & automatisiert getestet** (Playwright, 50+ Checks, 0 offene Fehler, 0 JS-Exceptions):
- Kompletter Charakter-Flow: Erstellung, Bearbeiten, SVG-Avatar (4 Klassen × Geschlecht × Körperbau × 6 Hauttöne × 10 Haarfarben × 6 Frisuren)
- Alle 6 Monster-Familien (je 5 Stufen) + alle 16 Bosse — eigenes Hand-SVG-Design pro Familie/Boss, eigener Kampfspruch (siehe 6.6)
- Streetfighter-Kampf-Overlay (VS-Intro, Combo-System, K.O.-Sequenz, Sound-Effekte), inkl. Fliehen und direktem Neustart danach
- Belohnungssystem: XP/Gold/Loot/Überperformance-Bonus, Talente (3 Äste × 3 Stufen/Klasse, Effekte geprüft), Streak + Grace-Tage, Boss-Cooldowns
- Energie-System + 4 Verbrauchsgüter (Erschöpfung ohne Kampf-Niederlage, siehe 5.7)
- Freies Training (alle 7 Typen) + eigener Wochenplan (9.1) + Trainingslog (5.8)
- Echte Trainingsplätze via Overpass API mit Rate-Limiting (7.2)
- Sensor-Modus für die Zuckerhydra mit iOS-Permission-Handling (Punkt 8)
- Spielstand-Migration: auch sehr alte Saves mit mehreren gleichzeitig fehlenden Feldern laden ohne Datenverlust

**Sicherheitsfix (im finalen Review gefunden und behoben):** `map.js` übergab OSM-Trainingsplatz-Namen — frei editierbare Fremddaten — ungefiltert an Leaflets `bindPopup()`, was eine echte XSS-Lücke war (Leaflet interpretiert einen übergebenen String dort als HTML). Behoben durch einen `textContent`-basierten DOM-Node statt eines rohen Strings; mit einem gezielten Exploit-Test verifiziert (manipulierter `<img onerror=...>`-Name löst nichts aus).

**NICHT auf echtem Gerät getestet** (diese Session hatte nur einen Sandbox-Browser, kein echtes Handy/Netz):
- Echtes GPS (nur simulierte Koordinaten in Tests)
- Echte Overpass-Antworten (die API ist in dieser Sandbox netzwerkseitig blockiert — Fehlerfall/Fallback ist aber getestet, siehe 7.2)
- Echter Bewegungssensor/Accelerometer (Permission-Flow + Logik geprüft, aber ohne echte Bewegungsdaten)
- `alert()`-Dialoge im WebView-Wrapper — ob die sichtbar sind, hängt davon ab, ob der Wrapper `WebChromeClient.onJsAlert` implementiert (siehe `web/icons/APK-HINWEISE.md`)
- Reales Rendering/Performance/Touch-Verhalten im Android-WebView

**Bewusst nicht gebaut:** Special-Moves nach Combo (6.5), Boss-Gegenangriffe (6.5, Design-Entscheidung), Sugartooth Devil (11.1), Multiplayer (13).

**Für die Weiterarbeit offen:**
- Kampfsprüche sind aktuell Claude-Platzhalter — der User schreibt Namen/Sprüche selbst, siehe 6.6. Nicht einfach durch neue KI-Vorschläge ersetzen.
- Kein UI für Spielstand-Reset (`WoFState.zuruecksetzen()` existiert als Funktion, ist aber an keinen Button angebunden)
- Kein Verkaufen/Wegwerfen von Loot — Inventar wächst unbegrenzt (kein Crash-Risiko mehr, `speichern()` fängt localStorage-Fehler jetzt ab, aber irgendwann UX-relevant)

---

## 1. Vision & Ziel

**WoF** (World of Fitness) ist eine Fitness-Gamification-App im Stil von Ingress/Pokemon Go, aber im Solo-Modus. Der Spieler bewegt sich real durch seine Umgebung, trifft auf gespawnte Monster und wird durch echtes Training belohnt.

**Kernmechanik:** Monster sind Trigger für Selbsttraining, kein Sammel-Grinding. Der Spieler geht zu einem Monster (30m Reichweite), macht die geforderte Übung selbst, bestätigt die Wiederholungen und bekommt XP + Loot.

**Zielplattform:** Android. Umsetzung als reine Client-Only-Web-App (HTML/CSS/JavaScript, State via localStorage), die später über einen WebView-Wrapper zur APK gebaut wird. Der frühere Bekannte hat dafür ein Android-Studio-Template gebaut (siehe Punkt 12).

**Langfrist-Nordstern: WoF Multiplayer** — Erweiterung der aktuellen Solo-App zum Fitness-MMO mit Fraktionen (Carbinator's Way vs. King Kones) und Ingress-artigem Territorial-System für öffentliche Trainingsplätze. Aktuelle App soll dieses Ziel architekturell nicht verbauen (State-Management sauber trennen), aber nichts davon jetzt implementieren.

## 2. Architektur-Prinzipien

- **Kein Backend, kein Server** — reine Client-Side JavaScript
- **localStorage** für Spielstand (Charakter, Inventar, besiegte Monster, Streak, Statistiken)
- **Overpass API** (öffentlich, kein Key) für echte Trainingsplätze im Umkreis
- **OpenStreetMap Tiles** über Leaflet.js für die Karte
- **Kein Build-Schritt nötig** — der Bekannte packt die Web-Files direkt als Assets in die APK. Wenn möglich, kein Webpack/Vite/etc.
- **Kein npm-Ökosystem** wenn vermeidbar — Vanilla JS oder wenige direkt eingebundene Libraries (Leaflet als Script-Tag)

## 3. Ästhetik

- **Dark Fantasy** — dunkler Hintergrund (#0a0806 bis #14100c), Gold-Akzente (#d4a44a)
- **Fonts:** Cinzel (für Display/Headings), Crimson Pro (für Fließtext), Fallback system-ui
- **Karten-Tiles:** sepia-getönte OSM-Tiles (CSS filter: sepia + hue-rotate)
- **Sprache aller Nutzertexte:** Deutsch
- **Icon-Sprache:** Emojis für Klassen und schnelle visuelle Hinweise, SVGs für aufwendige Artworks

## 4. Charakter-System

### 4.1 Klassen (fest, 4 Stück)

| Key | Name | Beschreibung | Bonus-Stat | Start-Stat-Verteilung |
|---|---|---|---|---|
| barbar | Barbar | Roher Kraftsport — Maximalkraft | kraft | Kraft 12, Rest 5-8 |
| paladin | Paladin | Muskelaufbau / Hypertrophie | muskelaufbau | Muskelaufbau 12, Rest 5-8 |
| elf | Elf | Beweglichkeit, Yoga, Mobility | beweglichkeit | Beweglichkeit 12, Rest 5-8 |
| waldlaeufer | Waldläufer | Ausdauer — Laufen, lange Distanzen | ausdauer | Ausdauer 12, Rest 5-8 |

**Nice-to-have später:** 5. Klasse "Mönch/Yogi" mit Bonus-Stat Willenskraft (aktuell hat kein Klassen-Bonus auf Willenskraft).

### 4.2 Stats (5 Stück)

1. **kraft** — Maximalkraft, wird durch schwere Bodyweight-Übungen (Pistol Squats, Handstand) trainiert
2. **muskelaufbau** — Hypertrophie, Push-Ups, moderate Squats
3. **ausdauer** — Laufen, HIIT, lange Übungen
4. **beweglichkeit** — Mobility, Yoga, Dehnen, dynamische Übungen
5. **willenskraft** — Zeit-Halte-Übungen (Plank, Wall Sit), lange Streaks

Formel für Charakter-Power im Kampf: Summe aller Stats + Ausrüstungs-Boni + Talent-Boni.

### 4.3 Charakter-Editor mit SVG-Avatar

- **Name** (Text, max 24 Zeichen)
- **Klasse** (siehe 4.1)
- **Geschlecht:** female / diverse / male (beeinflusst Silhouette/Schultern/Hüfte)
- **Körperbau:** ecto (schlank) / meso (athletisch) / endo (stämmig) — beeinflusst Breite
- **Hautton:** 7 Presets (#f5d5b8, #e8b48a, #d19468, #a06a3a, #6b4020, #3a2010, #b8342a — letzterer ein "rothäutiger" Fantasy-Ton, Ergänzung 2026-09-06 auf User-Wunsch)
- **Haarfarbe:** 11 Presets (#1a1008, #3a2418, #6b4020, #a86828, #d4a44a, #e8dcc0, #c04040, #8a3060, #2050a0, #3d7a3d, #f0d020 — letzterer ein kräftiges Gelb, Ergänzung 2026-09-06 für die Saiyajin-Frisur)
- **Frisur:** 8 Varianten (kurz, mittel, lang, zopf, dutt, irokese, saiyajin, kahl). Irokese (Ergänzung 2026-09-06): zackiger Kamm mittig über dem Kopf, Seiten bleiben frei. Saiyajin (Ergänzung 2026-09-06, User-Wunsch "dragonball-artig"): Zacken-Kranz vom linken übers obere Kopfdrittel bis zum rechten Ohr, wechselnde Zackenlängen für den chaotischen Anime-Look — besonders in Gelb gedacht (Super-Saiyajin-Referenz).
- **Fitness-Startlevel:** 1-5

**Live-Vorschau** des Avatars im Editor. Modularer SVG-Generator der zur Laufzeit aus den Parametern das SVG baut. Avatar wird auch im Held-Tab und im Kampf-Modal angezeigt.

### 4.4 Fitness-Startlevel-Mapping

| Level | Label | Start-Char-Lvl | Stat-Bonus (auf jeden Stat) |
|---|---|---|---|
| 1 | Novice | 1 | +0 |
| 2 | Fortgeschritten | 3 | +5 |
| 3 | Meister | 6 | +12 |
| 4 | Super | 10 | +25 |
| 5 | Ultra | 15 | +45 |

Startet der Spieler höher, gibt es entsprechend Talent-Punkte (char_level - 1).

### 4.5 Klassen-spezifische Erstausstattung

Bei Charakter-Erstellung automatisch ins Inventar + direkt ausgerüstet:

| Klasse | Rüstung | Waffe/Accessoire |
|---|---|---|
| Barbar | Wildling-Fell (+3 kraft, +1 ausdauer) | Brechstangen-Faust (+2 kraft) |
| Paladin | Turnier-Kürass (+3 muskelaufbau, +1 willenskraft) | Trainings-Handschuh (+2 muskelaufbau) |
| Elf | Läufer-Sandalen (+3 beweglichkeit, +1 ausdauer) | Federleichter Umhang (+2 beweglichkeit) |
| Waldläufer | Läufer-Tuch (+3 ausdauer, +1 willenskraft) | Trink-Flakon (+2 ausdauer) |

### 4.6 Skilltree

Jede Klasse hat 3 Äste × 3 Stufen (9 Talente pro Klasse). Talent-Punkte kommen bei jedem Level-Up (+1). Talents geben Boni auf: XP-Multiplikator (pro Stat oder generell), Streak-Grace, Loot-Chance, Combat-Damage, Crit-Chance, Streak-Kombat-Multiplikator, etc.

Konkrete Skilltree-Inhalte kann Claude Code selbst entwerfen (Vorschlag: 3 Themen-Äste pro Klasse — z.B. Barbar: "Berserker" / "Bulle" / "Prügler").

## 5. Kampfmechanik

### 5.1 Zwei Arten von Gegnern

**A) Häufig-Spawner (Familien mit 5 Stufen)** — spawnen dauerhaft im 500m-Umkreis, respawnen nach Sieg. Jede Familie ist an eine Übung gebunden.

**B) Einzigartige Bosse** — spawnen sporadisch (10-15% Chance beim Weltspawn), erst ab Char-Lvl 10, Cooldown nach Sieg.

### 5.2 Häufig-Spawner-Familien

**✅ Umgesetzt, 7 Familien** (Stand nach mehreren Iterationen — "Creatures" wurde auf User-Wunsch zu "Burger" umbenannt/umgestaltet, die alte Kreatur lebt separat als "Plumpi" weiter, siehe `monsters.js`):

| Familie | Übung | Bonus-Stat |
|---|---|---|
| Squat Goblin | Kniebeugen | muskelaufbau |
| Pusher Demon | Liegestütze | kraft |
| Dumplings | Hampelmänner | muskelaufbau |
| Burger (intern weiterhin familyId `creatures`) | Crab Walks | ausdauer |
| Killer Kebab Snakes | Leg Raises | beweglichkeit |
| Knödel | Standing Arnold Press | willenskraft |
| Plumpi | Split Squats | kraft |

**Übungen-Update (2026-09-06):** Auf User-Rückmeldung ("die Übungen sind blöd... wir brauchen Übungen, die man überall ausführen kann") wurden Sit-Ups, Burpees und Russian Twists ersetzt — alles Übungen, die Bodenkontakt/Hinlegen brauchen und für unterwegs unpraktisch sind. Standing Arnold Press hat eine eigene Rep-Progression (10→20→40→100→200 statt Standard 5→10→20→50→100, User-Vorgabe "10 in der ersten Stufe").

**Plumpi (7. Familie, Ergänzung 2026-09-06):** Die ursprüngliche "Creatures"-Familie (lila amorpher Blob mit Tentakel-Armen und großem Auge) wurde beim Burger-Umbau aus Versehen mit-ersetzt. Der User wollte das Design behalten ("zu goldig um den verkommen zu lassen") — jetzt als eigenständige 7. Familie "Plumpi" (Stufen: Plumpi → Superplumpi → Ultraplumpi → Megaplumpi → Hyperplumpi) mit dem unveränderten Original-SVG.

Jede Familie hat 5 Stufen mit eigenem Hand-SVG-Design, das mit der Stufe wächst/eskaliert (z.B. Squat Goblin: Hellgrün→Grün→Dunkelgrün→Grün/Rot→Rot; Burger: mehr Patties+Käse pro Stufe, krabbenartig mit 8 Gliedmaßen; Knödel: eine Kugel mehr pro Stufe). Jede Familie hat außerdem 2 rotierende Kampfsprüche, die beim Kampfstart zufällig gezogen werden (siehe 6.6) — bei Plumpi noch leer, der User schreibt eigene.

**Rep-Progression:** 5 → 10 → 20 → 50 → 100 (Squats) oder ähnlich, jeweils angepasst an Übungsart. **Ausnahme:** Push-Ups skalieren schwerer (5 → 10 → 20 → 35 → 50). **Zeit-basierte Übungen** (Plank): in Sekunden statt Reps.

### 5.3 Einzigartige Bosse mit Cooldowns

Alle Bosse erst ab Char-Lvl 10 spawnbar. Nach Sieg: Cooldown, danach kann derselbe wieder auftauchen.

**Kleine Bosse (12h Cooldown):**
- Cornpop (Popcorn — springt/knallt → Jumping Jacks / Squat Jumps)
- Marsh the Mallow (weich → Rolling Sit-Ups)
- Pan Doro (italienischer Kuchen, haust in Höhle → Tiefe Squats)
- Pasta Busta (Nudel-Gegner, dünn → Cardio-Sprints)
- Nutcruncher (Karamell-Nuss-Minigun → Boxen/Punches)

**Mittlere Bosse (24h Cooldown):**
- Fleur the Flourduster (Mehlwolke → HIIT-Sprints)
- Deniz / Daemoniz (Schlangen-Leech → Superman Holds, Hollow-Body)
- Nightshade the Carbmaid (Belladonna, Dry-O-Mator → lange Planks)
- Chap the Fruit Monk (Chili → Burpees)
- Jack the 2nd Fruit Monk (Koloss → Heavy Squats/Lunges)
- Le Tofu Bunnay (Kaninchen → Springseil / Jump Squats)
- Battering Ram (Ramme mit Zuckerdiamant-Zähnen; Wächter des Buttercup Palace — Vorschlag: Sprint-Intervalle als Signature-Move, Details bei Boss-Umsetzung in Schritt 13)
- Sugartooth Devil (eigenständiges Wesen, losgelöst von Battering Ram — Konzept/Übung noch offen, kommt in einer späteren Content-Runde dazu)

**Große Endbosse (48h Cooldown):**
- Sugarking Kane (Multi-Phasen-Kampf, Full-Body: Squats + Push-Ups + Plank)
- Vee Gain Le Fay / Firestorm (Spinnenkreatur → komplexer Multi-Phasen-Kampf)
- Ed the Fat (Fettwesen → Cardio-Marathon)
- Zuckerhydra (Multi-Kopf → HIIT mit Sensor-basierter Bewegungserkennung)

Boss-Kämpfe sollten mehrphasig sein (2-3 verschiedene Übungen nacheinander) und garantiert Loot geben.

### 5.4 Belohnungssystem

**Bei erfolgreichem Kampf:**
- **XP** basierend auf Monster-Level (Basis-XP × Klassen-Bonus × Talent-Multiplikator)
- **Klassen-Bonus:** +25% XP wenn Monster-Stat = Klassen-Bonus-Stat
- **Überperformance-Bonus:** mehr Reps als nötig → bis zu +50% Basis-XP
- **Gold** (Basis-Gold + Streak-Multiplikator)
- **Stat-Erhöhung** (max(1, reps // 5))
- **Streak-Update** (siehe 5.6)

**Loot-Drop:**
- Normale Monster: 20-60% Chance je nach Level
- Boss-Monster: garantierter Loot mit forcierter Rarität "selten+"
- Rarity-Stufen: gewöhnlich → ungewöhnlich → selten → episch → legendär

### 5.5 Item-System

- **Slots:** armor, weapon, amulet (max 3 gleichzeitig ausgerüstet)
- **Bonus-Struktur:** dict von Stat → Wert (z.B. `{"kraft": 3, "ausdauer": 1}`)
- **Rarity** beeinflusst Bonus-Höhe und Anzahl der Stats
- **Item-Reward-Type** soll erweiterbar sein: `type: "item" | "voucher" | "xp" | "gold"` — für spätere Kooperationen mit Woop/Fitbit/More Nutrition/ESN/McFit als Voucher-Codes

### 5.6 Streak-Mechanik

- **Streak** = aufeinanderfolgende Tage mit mindestens 1 Training
- Streak steigt bei Training am gleichen Tag oder nächsten Tag
- **Streak-Grace** (aus Talent) erlaubt X Tage Auszeit ohne Streak-Verlust
- Streak-Boni: +Gold-Multiplikator, +Combat-Damage im Kampf

### 5.7 Energie-System + Verbrauchsgüter (Ergänzung vom 2026-09-06)

**Entscheidung:** Der User fragte, was beim Besiegen eines Mobs/Bosses eigentlich gelootet wird, und schlug 4 konkrete Supplements vor. Dabei fiel auf: "Regeneration/Heilung" ergab bis dahin keinen Sinn, weil es gar keine Erschöpfung gab (Charakter nach 100 Kniebeugen == Charakter davor). Deshalb zusätzlich ein Energie-System eingeführt — bewusst OHNE Kampf-Niederlage/-Blocker (passt zu Punkt 6.5: keine Boss-Gegenangriffe).

- **Energie-Leiste** (0-100): sinkt proportional zu geleisteten Reps pro Kampf/Training, regeneriert passiv mit +5/Stunde Realzeit. Unter 30 → sanfter XP-Malus (-20%), NIE ein Spielblocker.
- **Verbrauchsgüter** (neue Item-Kategorie, zusätzlich zur Ausrüstung aus 5.5, würfeln unabhängig von Ausrüstungs-Loot):

| Item | Drop-Chance (Mob/Boss) | Effekt |
|---|---|---|
| 🥤 Eiweißshake | 25% / 40% | Sofort +30 Energie |
| 🐟 Omega-3 Kapsel | 10% / 20% | +15% XP für 3 Kämpfe |
| 💊 Kreatin | 10% / 20% | +15% Stat-Zuwachs für 3 Kämpfe |
| 🧪 Swoley Shake | 2% / 8% | Volle Energie + beide Buffs auf +20% für 3 Kämpfe |

- **Sportlich-konkrete Loot-Namen:** Auf Wunsch des Users heißt zufällig gedropptes Ausrüstungs-Loot jetzt nicht mehr generisch "Rüstungsteil"/"Waffe"/"Amulett", sondern konkret (Sportschuhe, Trainingsjacke, Fitness-Armband, ...). Die Klassen-Startausrüstung aus 4.5 (Wildling-Fell etc.) bleibt als gesetzte Klassen-Identität unverändert.
- **Amulett-Slot → Fitness-Armband:** Der technische Slot heißt intern weiterhin `amulet` (kein Migrationsbedarf für bestehende Spielstände), aber sowohl die Item-Namen als auch das UI-Label wurden auf "Armband" umgestellt (Fitness-Armband, Pulsmesser-Armband, Sport-Armband mit Trittzähler, Smartwatch-Armband, Schweißband fürs Handgelenk) — passend zu einem echten am Handgelenk getragenen Fitness-Tracker statt eines Fantasy-Amuletts.

### 5.8 Trainingslog (eigene Ergänzung vom 2026-09-06, im HANDOVER nicht spezifiziert)

**Entscheidung:** User-Frage: "Haben wir eine Übungsliste, auf der der Trainierende ein bisschen tracken kann, was er da macht?" — bis dahin gab es keinen Verlauf, nur die aggregierten Werte (XP, Stats, Streak) änderten sich unsichtbar im Hintergrund.

- Jeder abgeschlossene Mob-Kampf, Boss-Kampf und jedes freie Training schreibt einen Eintrag in `character.trainingsLog` (neueste zuerst, auf 50 Einträge gedeckelt gegen unbegrenztes Wachstum im localStorage).
- Anzeige im Helden-Tab unter "Trainingslog": Zeitpunkt, Übung(en)/Gegner, Reps bzw. Dauer, erhaltene XP/Gold/Stat-Zuwächse.
- `state.js`: `WoFState.protokolliere(character, eintrag)`.

## 6. Streetfighter-Kampfsystem

**Ziel:** Vollflächen-Kampf-Overlay der aussieht und sich anfühlt wie ein 90er Streetfighter-Automat.

### 6.1 Layout

- **HUD oben:** HP-Balken beider Kämpfer, Portraits, Namen ("SPIELER" vs "MONSTER"), großes "VS" mittig
- **Arena mittig:** Split-Screen, Spieler-Avatar links (aus renderAvatar), Monster-SVG rechts
- **Effekt-Layer** (absolute positioniert): Impact-Sterne, Schadenszahlen, Combo-Popup
- **Controls unten:** Übungsname, Counter (aktuell/ziel), +/- Buttons (großer roter Plus-Button für "Rep gemacht"), Fliehen + "K.O.!" Erledigt-Button

### 6.2 VS-Intro (~2.6 Sekunden)

1. Namen fliegen von links/rechts rein (perspective transform)
2. "VS" ploppt in der Mitte mit rotem Text-Shadow und Rotation
3. "READY?" pulsiert
4. "FIGHT!" explodiert dramatisch
5. Klicks sind während der Zeit gesperrt

### 6.3 Attack-Choreografie (pro Rep-Klick)

- Spieler-Avatar schwingt nach vorne (CSS transform: translateX + scale)
- Boss-SVG zuckt zurück und wackelt (translateX + rotate)
- Impact-Stern erscheint an Kollisions-Punkt
- Schadenszahl fliegt hoch mit fade-out
- Screen-Shake (kurz, knackig)
- Combo-Counter tracked schnelle Klicks (<1200ms Abstand)
- Ab 3× Combo: goldener "COMBO x3!"-Popup, goldene Crit-Schadenszahlen

### 6.4 K.O.-Sequenz

- Boss dreht sich rotierend weg (bossKO keyframes)
- Screen-Shake final
- Dunkler Overlay
- Riesen-Cinzel-Text "K.O.!" mit Punch-Animation

### 6.5 Was NOCH FEHLT (Feinschliff für später)

- ~~Sounds via Web Audio API~~ ✅ implementiert (Ergänzung vom 2026-09-06, siehe `sound.js`): synthetische Töne per Oszillator für Treffer, Combo, Loot, Level-Up und Sieg, keine externen Audio-Dateien. Stummschalt-Button im Header.
- Special-Moves nach 5er-Combo — auf ausdrücklichen Wunsch des Users erstmal zurückgestellt ("brauchen wir jetzt noch nicht").
- Boss-Gegenangriffe (aktuell dominiert Spieler komplett — bewusste Design-Entscheidung, weil "vom Fitness-Boss besiegt werden" demotivierend wäre)

### 6.6 Kampfsprüche (eigene Ergänzung vom 2026-09-06, User-Wunsch)

Jede Monster-Familie (2 rotierende Sprüche) und jeder Boss (1 Spruch) hat einen kurzen, augenzwinkernden Kampfspruch (Vorbild: "Sei kein Knödel, mach Crunches!"), der beim Kampfstart zufällig gezogen und kursiv unter dem Gegnernamen angezeigt wird (`WoFMonsters.zufallsSpruch()`, Felder `sprueche` in `monsters.js`/`bosses.js`).

**Wichtig für die Weiterarbeit:** Die aktuellen Sprüche sind nur Platzhalter von Claude. Der User schreibt sich die finalen Sprüche (und ggf. auch Namen) selbst — nicht einfach durch neue KI-Vorschläge ersetzen, sondern auf seine Vorgaben warten.

## 7. Karten-System

### 7.1 Leaflet + OSM

```js
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 19
})
```

CSS-Filter für Sepia-Look: `filter: sepia(0.6) saturate(1.2) hue-rotate(-15deg)`

### 7.2 Overpass-Query für Trainingsplätze

```
[out:json][timeout:15];
(
  node["leisure"="fitness_station"](around:{radius},{lat},{lng});
  node["sport"="calisthenics"](around:{radius},{lat},{lng});
  way["leisure"="fitness_centre"](around:{radius},{lat},{lng});
  way["leisure"="track"](around:{radius},{lat},{lng});
  node["leisure"="pitch"]["sport"~"soccer|basketball"](around:{radius},{lat},{lng});
);
out center;
```

Ergebnisse als grüne Marker anzeigen. Wenn Spieler ein Training an einem POI absolviert (im 50m-Radius): +20% XP.

**✅ Implementiert (Ergänzung vom 2026-09-06, siehe `map.js`):** Query wird per POST an `https://overpass-api.de/api/interpreter` geschickt, gedrosselt auf max. 1 Anfrage pro 300m Bewegung UND min. 2 Minuten Abstand (Overpass ist ein geteilter Gratis-Dienst ohne Key). Ergebnisse werden als grüne Marker mit Typ-Emoji dargestellt. Die "An Trainingsplatz?"-Checkbox beim Freien Training (Punkt 9) wird beim Öffnen des Training-Tabs automatisch vorausgewählt, wenn der Spieler laut `pruefeTrainingsplatzNaehe()` im 50m-Radius eines geladenen POIs steht — bleibt aber manuell änderbar, falls die OSM-Daten unvollständig/veraltet sind. Fehlschläge (kein Netz, Overpass down, CORS) werden still abgefangen; die manuelle Checkbox bleibt dann die Notlösung.

### 7.3 Monster-Spawns

- **Spawn-Radius:** 500m um Spieler
- **Max Monster gleichzeitig:** 6
- **Interact-Radius:** 30m (Kampf erst startbar wenn in dieser Reichweite)
- **Spawn-Gewichtung:** niedrige Levels häufiger (Lvl 1 = 10× so wahrscheinlich wie Lvl 4), Bosse sehr selten (1× wenn verfügbar)

### 7.4 Vorführmodus

Aus der alten APK übernehmen: Ein Toggle in den Einstellungen, der die 30m-Reichweiten-Regel deaktiviert. So kann man die App zu Hause auf dem Sofa demonstrieren.

## 8. Sensor-Integration (für Special-Kämpfe)

Aus der alten APK: **DeviceMotionEvent** (Accelerometer) für Bewegungserkennung.

**iOS-Falle:** Ab iOS 13 muss man `DeviceMotionEvent.requestPermission()` explizit aufrufen (nach User-Interaktion, z.B. Button-Klick), sonst kommen keine Daten.

**Nutzung:**
- **Zucker-Hydra Boss:** HIIT-Modus — Sensor erkennt Sprünge/Squats/Burpees, zählt automatisch, Timer läuft
- **Alter Kaiser (falls beibehalten):** Kraft-Modus — Sensor erkennt langsame kontrollierte Bewegungen

Nicht bei jedem Kampf nötig — nur als Special-Feature für ausgewählte Bosse.

## 9. Freies Training (parallel zum Monster-System)

Der Spieler kann auch ohne Monster Training eintragen:

- **Typ:** Kraftsport (schwer/mittel/leicht), Cardio, Cross-Fit, Yoga/Mobility, HIIT
- **Dauer:** in Minuten
- **Intensität:** Leicht (×0.5) / Mittel (×1.0) / Schwer (×1.5) / Extrem (×2.0)
- **An Trainingsplatz?** Toggle → +20% XP
- Ergibt XP + Stat-Erhöhung passend zum Typ

**Wichtig:** Beides existiert parallel (Variante B aus früherer Diskussion). Monster sind Anreiz, freies Training bleibt die Basis.

### 9.1 Eigener Wochenplan (eigene Ergänzung vom 2026-09-06, im HANDOVER nicht spezifiziert)

**Entscheidung:** User-Frage: "Ist das so, dass man da auch seinen eigenen Trainingsplan integrieren [kann]?" — Rückfrage ergab: ein einfacher Wochenplan reicht (kein voller Sätze/Wiederholungen/Gewichte-Tracker).

- `character.wochenplan`: Objekt mit den 7 Wochentag-Kürzeln (`mo`...`so`) als Keys, Wert ist ein Typ-Key aus `WoFFreiesTraining.TYPEN` oder `null`/leer für Ruhetag.
- Editierbar im Training-Tab unter "Mein Wochenplan": 7 Dropdowns, einer pro Tag.
- Beim Öffnen des Training-Tabs zeigt ein Hinweis "Laut Plan ist heute dran: ..." und wählt den passenden Typ im Formular automatisch vor — bleibt aber jederzeit manuell änderbar, reiner Vorschlag statt Zwang (konsistent mit dem restlichen No-Defeat/No-Blocker-Design).
- `state.js`: `WoFState.WOCHENTAGE`, `WoFState.heutigerWochentagKey()`, `WoFState.setzeWochenplanTag(character, tag, typ)`.

## 10. Content: Bodyweight-Übungen (keine Utensilien!)

Alle Übungen müssen draußen ohne Ausrüstung machbar sein.

- **Kraft:** Push-Ups (Standard, Diamant, wide), Pistol Squats, Handstand Holds
- **Beine:** Squats, Lunges, Split Squats, Bulgarian Split Squats, Jump Squats, Cossack Squats
- **Cardio:** Burpees, Mountain Climbers, Jumping Jacks, High Knees, Sprints
- **Core:** Plank, Side Plank, Hollow Body Holds, Superman, Russian Twists, Leg Raises, V-Ups
- **Mobility:** Bear Crawls, Crab Walks, Deep Squat Hold, Cat-Cow, World's Greatest Stretch
- **Willenskraft (Zeit-halten):** Plank (Sekunden), Wall Sit, Hollow Body Hold

**AUSDRÜCKLICH RAUS:** Deadlifts, Kettlebell-Übungen, Klimmzüge (siehe Punkt 11.2 — endgültig raus, Ersatz: Split Squats), Bankdrücken, alles mit Gewichten.

## 11. Offene Design-Fragen (VOR Implementation klären!)

### 11.1 Nevill / Sugartooth Devil vs. Battering Ram — ✅ GEKLÄRT

**Entscheidung (2026-09-06):** Es gibt nur **eine** Kreatur, keine Mob-Familie + separaten Boss mehr. Sie heißt schlicht **Battering Ram** und ist ausschließlich ein mittlerer Boss (24h Cooldown). Die geplante häufig-spawnende "Battering Rams"-Familie aus Punkt 5.2 entfällt ersatzlos — das war dieselbe Kreatur.

Der Name "Sugartooth Devil" ist NICHT weggefallen, sondern für ein eigenständiges, später hinzuzufügendes Wesen reserviert (siehe Punkt 5.3 Mittlere Bosse) — das braucht noch eigenes Konzept/Übung und ist nicht Teil dieser Klärung.

### 11.2 Klimmzüge (Pull-Ups) — ✅ GEKLÄRT

**Entscheidung (2026-09-06):** Klimmzüge bleiben draußen (endgültig, nicht nur vorläufig). Als Ersatz für Content, der Klimmzüge genutzt hätte: **Split Squats** (bereits Teil des Bodyweight-Katalogs in Punkt 10, keine Utensilien nötig).

## 12. APK-Bau (Kontext vom Bekannten)

Der User hat einen Bekannten der die frühere Version bereits als APK gebaut hat. Details aus seiner ANLEITUNG_1.md:

- Zwei Ordner: `web/` (die App) + `android/` (WebView-Wrapper-Projekt)
- Wrapper mit Android Studio + Gradle-Build
- Signiert mit `fitquest.keystore`, Passwort `fitquest`
- Kein Server, kein Python, alles läuft lokal im WebView
- OSM/Overpass werden direkt vom WebView aus dem Netz geladen

**Ziel:** Diese neue Version soll wieder in seinen Wrapper passen. Also `web/`-Ordner-Struktur produzieren die er als Drop-in-Replacement nutzen kann.

**Nice-to-have:** Falls der Bekannte den Wrapper-Quellcode teilt, kann auch die APK-Build-Pipeline direkt eingebunden werden.

## 13. WoF Multiplayer — Langfristige Vision (Info-only, NICHT jetzt bauen)

Zukünftige Multiplayer-Erweiterung der Solo-App (der Name WoF ist eine Anspielung auf WoW):

- Multiplayer-Fitness-MMO
- Fraktionen: **Carbinator's Way** vs. **King Kones**
- Ingress-artiges Territorial-System: öffentliche Trainingsplätze als "Portale"
- Fraktionskampf um Kontrollzonen

**Braucht:** Datenbank, Auth, Cloud-Hosting, Anti-Cheat, Community-Ops.

**Für jetzt nur relevant für Architektur-Entscheidungen:** State-Management sauber trennen, damit später ein Backend-Sync einfach dazwischengeschoben werden kann. Kein Custom-Kram der Multiplayer verunmöglicht.

**Optionale Phase 2:** Personal-Cloud-Variante für Health-Coach-Nutzung mit Klient:innen (nicht Multiplayer, nur Cross-Device-Sync).

## 14. Lore-Referenz: Das Carbcore-Universum

Die Monster kommen aus einem parallelen Musik-Projekt des Users (K-AI, Metal-Konzeptalben "The Way of Carbcore"). Wenn Boss-Beschreibungen/Flavor-Texte thematisch stimmig sein sollen, ist der Held Carbinator (nährt sich von besiegten Gegnern für Energie, isst NUR pflanzliche/tierische Gegner, keine menschlichen).

Für die App selbst: Der Spieler ist **nicht** Carbinator sondern ein eigener Charakter (nach User-Entscheidung: "nur die Mobs, keine Story-Übernahme"). Aber Flavor-Texte à la "Carbinator hätte sich hier gestärkt" oder "kalorienfrei — kein Nutzen für Carbinator" als Wink an Album-Fans sind erwünscht.

**Wichtig:** Keine Übernahme der Ess-Mechanik aus den Songs. XP/Gold/Loot bleibt die Belohnungs-Metapher.

## 15. Empfohlene Bau-Reihenfolge

1. **Grundstruktur:** index.html + main.js + style.css + state.js (localStorage) + map.js (Leaflet)
2. **Charakter-System** (ohne Editor erstmal, Test-Charakter direkt): create/state/stats/level-up/XP-Formel
3. **Avatar-Renderer** (avatar.js — modularer SVG-Generator)
4. **Charakter-Editor** (mit Live-Vorschau)
5. **Monster-Familien-System** (1 Familie: Squat Goblin mit 5 Stufen + eigenen SVGs)
6. **Kampf-Modal** (schlichte Version: Counter + Erledigt-Button)
7. **Belohnungs-System** (XP + Gold + Loot + Streak)
8. **Freies Training** (parallel)
9. **Streetfighter-Overlay** (Split-Screen + HP-Balken + VS-Intro + Attack-Animation + K.O.)
10. **Combo-System + Effekte** (Impact-Stern, Screen-Shake, Damage-Numbers)
11. **Skilltree + Talents**
12. **Weitere Monster-Familien** (bis alle aus Liste)
13. **Einzigartige Bosse** (Nevill/Battering-Ram-Frage geklärt — siehe Punkt 11.1; Sugartooth Devil ist ein eigenständiges, noch zu konzipierendes Wesen für diesen Schritt)
14. **Sensor-Integration** für Special-Kämpfe (Zucker-Hydra)
15. **APK-Vorbereitung** (Icons, Manifest, WebView-Kompatibilität)

## 16. Ende — Los geht's

Frag den User bei allen offenen Punkten (Punkt 11), bevor du an den entsprechenden Stellen baust. Rest kannst du autonom vorschlagen — der User will kritische Ehrlichkeit, keine Ja-und-Amen-Antworten, und iteriert gerne.

Viel Erfolg! ⚔
