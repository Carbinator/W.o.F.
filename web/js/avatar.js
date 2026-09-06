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

  function haarPfad(frisur) {
    const { cx, cy, r } = HEAD;
    switch (frisur) {
      case 'kahl':
        return '';
      case 'kurz':
        return `<path d="M ${cx - r} ${cy - 2} A ${r} ${r} 0 0 1 ${cx + r} ${cy - 2}
                        A ${r + 3} ${r + 3} 0 0 0 ${cx - r} ${cy - 2} Z"/>`;
      case 'mittel':
        return `<path d="M ${cx - r - 2} ${cy + 8} A ${r + 3} ${r + 3} 0 0 1 ${cx + r + 2} ${cy + 8}
                        L ${cx + r} ${cy - 4} A ${r} ${r} 0 0 0 ${cx - r} ${cy - 4} Z"/>`;
      case 'lang':
        return `<path d="M ${cx - r - 3} ${cy + 46} A ${r + 4} ${r + 4} 0 0 1 ${cx + r + 3} ${cy + 46}
                        L ${cx + r + 1} ${cy - 6} A ${r + 1} ${r + 1} 0 0 0 ${cx - r - 1} ${cy - 6} Z"/>`;
      case 'zopf':
        return `
          <path d="M ${cx - r} ${cy - 2} A ${r} ${r} 0 0 1 ${cx + r} ${cy - 2}
                   A ${r + 3} ${r + 3} 0 0 0 ${cx - r} ${cy - 2} Z"/>
          <path d="M ${cx} ${cy + r - 2} q 6 14 -2 30 q -6 -2 -4 -16 Z"/>
        `;
      case 'dutt':
        return `
          <path d="M ${cx - r} ${cy - 2} A ${r} ${r} 0 0 1 ${cx + r} ${cy - 2}
                   A ${r + 3} ${r + 3} 0 0 0 ${cx - r} ${cy - 2} Z"/>
          <circle cx="${cx}" cy="${cy - r - 6}" r="7"/>
        `;
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
