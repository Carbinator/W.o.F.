/**
 * avatar.js — modularer SVG-Avatar-Generator (Punkt 4.3 aus HANDOVER.md)
 *
 * renderAvatarSVG(params) baut zur Laufzeit ein SVG aus den
 * Charakter-Editor-Parametern zusammen. Wird im Editor (Live-Vorschau),
 * im Held-Tab und im Kampf-Modal wiederverwendet.
 */

const WoFAvatar = (() => {
  const VIEWBOX = { w: 160, h: 220 };
  const HEAD = { cx: 80, cy: 52, r: 22 };

  // Geschlecht beeinflusst Schulter-/Hüftbreite (Punkt 4.3)
  const GESCHLECHT_PROFILE = {
    male: { schulter: 34, huefte: 22 },
    diverse: { schulter: 28, huefte: 26 },
    female: { schulter: 24, huefte: 30 },
  };

  // Körperbau beeinflusst Gesamtbreite (Punkt 4.3)
  const KOERPERBAU_SKALIERUNG = {
    ecto: 0.82,
    meso: 1.0,
    endo: 1.22,
  };

  const OUTFIT_FARBE = {
    barbar: '#5a2a1a',
    paladin: '#3a4a5a',
    elf: '#2d4a2d',
    waldlaeufer: '#4a3a1a',
  };

  const HOSEN_FARBE = '#241a12';

  function profilFuer(params) {
    const geschlecht = GESCHLECHT_PROFILE[params.geschlecht] || GESCHLECHT_PROFILE.diverse;
    const skalierung = KOERPERBAU_SKALIERUNG[params.koerperbau] || 1.0;
    return {
      schulterHalb: (geschlecht.schulter * skalierung) / 2,
      hueftHalb: (geschlecht.huefte * skalierung) / 2,
    };
  }

  function torsoPfad(profil) {
    const cx = HEAD.cx;
    const schulterY = 74;
    const hueftY = 138;
    const sHalb = profil.schulterHalb;
    const hHalb = profil.hueftHalb;
    return `M ${cx - sHalb} ${schulterY}
            Q ${cx - sHalb - 4} ${(schulterY + hueftY) / 2} ${cx - hHalb} ${hueftY}
            L ${cx + hHalb} ${hueftY}
            Q ${cx + sHalb + 4} ${(schulterY + hueftY) / 2} ${cx + sHalb} ${schulterY}
            Z`;
  }

  function armePfad(profil) {
    const cx = HEAD.cx;
    const schulterY = 78;
    const handY = 136;
    const sHalb = profil.schulterHalb;
    return `
      <rect x="${cx - sHalb - 9}" y="${schulterY}" width="9" height="${handY - schulterY}" rx="4"/>
      <rect x="${cx + sHalb}" y="${schulterY}" width="9" height="${handY - schulterY}" rx="4"/>
    `;
  }

  function beinePfad(profil) {
    const cx = HEAD.cx;
    const hueftY = 136;
    const fussY = 210;
    const hHalb = profil.hueftHalb;
    return `
      <rect x="${cx - hHalb}" y="${hueftY}" width="${hHalb - 2}" height="${fussY - hueftY}" rx="3"/>
      <rect x="${cx + 2}" y="${hueftY}" width="${hHalb - 2}" height="${fussY - hueftY}" rx="3"/>
    `;
  }

  // Kurzer Deckhaar-Kappenbogen, liegt komplett oberhalb der Augenlinie
  // (cy+2) — Basis für alle Frisuren außer "kahl", damit das Gesicht nie
  // verdeckt wird.
  function haarKappe(cx, cy, r) {
    return `<path d="M ${cx - r} ${cy - 2} A ${r} ${r} 0 0 1 ${cx + r} ${cy - 2}
                    A ${r + 3} ${r + 3} 0 0 0 ${cx - r} ${cy - 2} Z"/>`;
  }

  // Seitliche Haarsträhnen links/rechts außerhalb des Gesichts (die Augen
  // sitzen bei cx∓8 — die Strähnen bleiben bei cx∓(r+...), also klar
  // außerhalb) statt eines Blocks quer übers Gesicht.
  function haarStraehnen(cx, cy, r, laenge) {
    return `
      <rect x="${cx - r - 3}" y="${cy - 4}" width="8" height="${laenge}" rx="4"/>
      <rect x="${cx + r - 5}" y="${cy - 4}" width="8" height="${laenge}" rx="4"/>
    `;
  }

  function haarPfad(frisur) {
    const { cx, cy, r } = HEAD;
    switch (frisur) {
      case 'kahl':
        return '';
      case 'kurz':
        return haarKappe(cx, cy, r);
      case 'mittel':
        return haarKappe(cx, cy, r) + haarStraehnen(cx, cy, r, 28);
      case 'lang':
        return haarKappe(cx, cy, r) + haarStraehnen(cx, cy, r, 56);
      case 'zopf':
        return `
          ${haarKappe(cx, cy, r)}
          <path d="M ${cx} ${cy + r - 2} q 6 14 -2 30 q -6 -2 -4 -16 Z"/>
        `;
      case 'dutt':
        return `
          ${haarKappe(cx, cy, r)}
          <circle cx="${cx}" cy="${cy - r - 6}" r="7"/>
        `;
      case 'irokese': {
        // Zackiger Haarkamm mittig über dem Kopf, Seiten bleiben frei
        // (kein haarKappe() hier, sonst wäre es kein Irokesenschnitt).
        // Mehrere überlappende Zacken statt einer einzelnen dünnen Spitze,
        // damit die Frisur auch klein (Kampf-Modal, Held-Tab) klar als
        // Irokese erkennbar bleibt.
        const versatz = [-9, -3, 3, 9];
        const zacken = versatz
          .map((dx) => {
            const hoehe = 30 - Math.abs(dx) * 1.6;
            return `M ${cx + dx - 5} ${cy - r + 8} L ${cx + dx} ${cy - r - hoehe} L ${cx + dx + 5} ${cy - r + 8} Z`;
          })
          .join(' ');
        return `<path d="${zacken}"/>`;
      }
      case 'saiyajin': {
        // Dragonball-artige Stachelfrisur: Zacken-Kranz vom linken über
        // den oberen Kopfrand bis zum rechten Ohr (Grad 180 -> 360, geht
        // durch 270 = "oben"), Gesicht/Kinn bleiben frei. Wechselnde
        // Längen für den typischen chaotisch-dynamischen Anime-Look.
        const anzahlZacken = 9;
        const startGrad = 180;
        const endGrad = 360;
        const laengenFaktor = [1.9, 1.1, 1.6, 1.0, 2.1, 1.0, 1.6, 1.1, 1.9];
        let zacken2 = '';
        for (let i = 0; i < anzahlZacken; i++) {
          const t = i / (anzahlZacken - 1);
          const winkel = ((startGrad + t * (endGrad - startGrad)) * Math.PI) / 180;
          const laenge = r * laengenFaktor[i];
          const basisR = r - 2;
          const breite = 0.16;
          const b1x = cx + Math.cos(winkel - breite) * basisR;
          const b1y = cy + Math.sin(winkel - breite) * basisR;
          const b2x = cx + Math.cos(winkel + breite) * basisR;
          const b2y = cy + Math.sin(winkel + breite) * basisR;
          const spitzeX = cx + Math.cos(winkel) * (basisR + laenge);
          const spitzeY = cy + Math.sin(winkel) * (basisR + laenge);
          zacken2 += `M ${b1x.toFixed(1)} ${b1y.toFixed(1)} L ${spitzeX.toFixed(1)} ${spitzeY.toFixed(1)} L ${b2x.toFixed(1)} ${b2y.toFixed(1)} Z `;
        }
        return `<path d="${zacken2}"/>`;
      }
      default:
        return '';
    }
  }

  function renderAvatarSVG(params) {
    const profil = profilFuer(params);
    const hautton = params.hautton || '#e8b48a';
    const haarfarbe = params.haarfarbe || '#1a1008';
    const outfit = OUTFIT_FARBE[params.klasse] || '#3a2a1a';

    return `
      <svg viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Charakter-Avatar">
        <g fill="${HOSEN_FARBE}">${beinePfad(profil)}</g>
        <g fill="${outfit}">
          <path d="${torsoPfad(profil)}"/>
        </g>
        <g fill="${hautton}">${armePfad(profil)}</g>
        <circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${HEAD.r}" fill="${hautton}"/>
        <g fill="#14100c">
          <circle cx="${HEAD.cx - 8}" cy="${HEAD.cy + 2}" r="2"/>
          <circle cx="${HEAD.cx + 8}" cy="${HEAD.cy + 2}" r="2"/>
        </g>
        <g fill="${haarfarbe}">${haarPfad(params.frisur)}</g>
      </svg>
    `;
  }

  return { renderAvatarSVG };
})();
