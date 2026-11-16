import type { resolveGarmentAppearance } from './garment-appearance';

export const REFINED_GARMENT_TYPES = ['short-sleeve-tee', 'shirt', 'sweatshirt', 'puffer', 'jeans', 'sneakers'] as const;
type Appearance = ReturnType<typeof resolveGarmentAppearance>;
interface Panel { d: string; tone: 'body' | 'accent' | 'shade' | 'light'; opacity?: number; outside: boolean }
export interface GarmentIllustration {
  body: string[];
  seams: string[];
  neck: string[];
  stitches: string[];
  folds: string[];
  panels: Panel[];
  buttons: { cx: number; cy: number; r: number }[];
}

/** Six original front/profile studies. Geometry is illustrative, never a product specification. */
export function garmentIllustration(a: Appearance): GarmentIllustration | undefined {
  if (!REFINED_GARMENT_TYPES.some(type => type === a.type)) return undefined;
  const v = a.design?.variant ?? 0;
  const art: GarmentIllustration = { body: [], seams: [], neck: [], stitches: [], folds: [], panels: [], buttons: [] };
  const panel = (d: string, tone: Panel['tone'] = 'body', opacity?: number, outside = false) => art.panels.push({ d, tone, opacity, outside });
  const pocket = (x: number, y: number, width = 24, height = 29) => {
    art.seams.push(`M${x} ${y}H${x + width}V${y + height - 5}Q${x + width / 2} ${y + height + 5} ${x} ${y + height - 5}Z`);
    art.stitches.push(`M${x + 3} ${y + 4}H${x + width - 3}`);
  };

  if (a.type === 'jeans') {
    const hem = a.length === 'cropped' ? 179 : a.length === 'long' ? 220 : 212;
    const outer = a.fit === 'slim' ? 68 : a.fit === 'oversized' ? 40 : a.fit === 'relaxed' ? 48 : 57;
    const inner = a.fit === 'oversized' ? 87 : 92;
    const knee = v === 3 ? 65 : outer + 2;
    art.body = [`M60 31Q100 37 140 31L148 73Q149 96 145 118L${200 - knee} 155 ${200 - outer} ${hem}Q${(400 - inner - outer) / 2} ${hem + 4} ${200 - inner} ${hem}L106 117 100 99 94 117 ${inner} ${hem}Q${(inner + outer) / 2} ${hem + 4} ${outer} ${hem}L${knee} 155 55 118Q51 96 52 73Z`];
    panel(`M59 38Q100 44 141 38L143 50Q100 55 57 50Z`, 'shade', .14);
    art.seams.push('M58 49Q100 56 142 49M100 47V91Q110 91 110 77V52', 'M58 56Q62 80 83 79M142 56Q138 80 117 79');
    art.stitches.push(`M59 76Q56 116 ${outer + 5} ${hem - 6}M141 76Q144 116 ${195 - outer} ${hem - 6}`, `M${outer + 1} ${hem - 7}H${inner - 1}M${201 - inner} ${hem - 7}H${199 - outer}`, 'M67 35V51M83 37V52M117 37V52M133 35V51');
    art.buttons.push({ cx: 104, cy: 43, r: 2.1 }, { cx: 62, cy: 58, r: 1.2 }, { cx: 138, cy: 58, r: 1.2 });
    art.folds.push(`M68 99L84 105M132 99L116 105M${outer + 6} ${hem - 20}L${inner - 4} ${hem - 25}`);
    panel(`M85 104L94 117 ${inner} ${hem} ${inner - 6} ${hem}Z`, 'shade', .12);
    if (v === 4) { pocket(55, 115, 26, 31); pocket(119, 115, 26, 31); art.seams.push('M55 121H81M119 121H145'); }
    else { pocket(122, 58, 12, 11); }
    return art;
  }

  if (a.type === 'sneakers') {
    const high = v === 1, chunky = v === 3;
    art.body = [high
      ? 'M29 154L39 65Q55 61 74 69L88 104 113 127Q137 137 162 141Q179 143 182 158L180 177Q105 190 25 175Z'
      : v === 2 ? 'M26 153L38 106Q45 100 58 111L81 102Q90 103 94 117L114 133Q143 142 165 143Q180 147 182 161L180 177Q105 190 25 175Z'
      : `M26 153L39 101Q45 95 59 108L76 94Q86 95 95 112L116 131Q138 141 162 142Q179 144 182 158L180 ${chunky ? 185 : 177}Q105 ${chunky ? 196 : 190} 25 ${chunky ? 183 : 175}Z`];
    panel(`M26 164Q100 177 181 161L180 ${chunky ? 185 : 177}Q104 ${chunky ? 196 : 190} 25 ${chunky ? 183 : 175}Z`, 'accent');
    panel(high ? 'M40 68Q55 64 70 71L76 84Q54 77 39 83Z' : 'M40 103Q46 101 59 112L70 107 75 116Q55 122 38 113Z', 'shade', .55);
    panel('M116 137Q140 143 164 146Q174 150 177 160L131 164Z', 'light', .22);
    art.seams.push('M28 165Q102 179 180 163', 'M38 116L54 142Q68 144 76 157', 'M126 141Q124 151 131 164');
    art.stitches.push('M30 172Q103 186 178 170', 'M39 124L48 145Q59 150 67 158');
    if (v === 2) { art.seams.push('M62 113L55 132M85 111L90 137'); panel('M57 119L84 113 104 139 77 143Z', 'shade', .13); }
    else if (v === 4) {
      panel('M58 118L94 120 101 130 57 127Z', 'accent'); panel('M62 134L107 137 115 147 66 143Z', 'accent');
      art.seams.push('M58 127L101 130M66 143L115 147');
    } else {
      art.seams.push(high ? 'M66 81L89 119 115 143' : 'M76 101L69 123 104 148');
      const rows = high ? [[54, 85, 71, 88], [55, 97, 77, 101], [59, 110, 87, 115], [67, 124, 98, 130]] : [[70, 118, 91, 114], [77, 129, 101, 125], [85, 140, 111, 136]];
      rows.forEach(([x, y, endX, endY]) => { art.seams.push(`M${x} ${y}L${endX} ${endY}`); art.buttons.push({ cx: x - 1, cy: y, r: 1.6 }, { cx: endX + 1, cy: endY, r: 1.6 }); });
    }
    if (chunky) { art.seams.push('M36 174L47 183M68 178L78 188M109 178L116 187M147 173L154 182'); panel('M46 142L63 131 82 152 106 145 128 162 104 168 78 161Z', 'accent', .36); }
    return art;
  }

  const tee = a.type === 'short-sleeve-tee', shirt = a.type === 'shirt', puffer = a.type === 'puffer';
  const half = a.fit === 'slim' ? 31 : a.fit === 'relaxed' ? 42 : a.fit === 'oversized' ? 47 : shirt ? 36 : 38;
  const hem = a.length === 'cropped' ? 157 : a.length === 'long' ? 211 : shirt ? 196 : tee ? 186 : 190;
  const l = 100 - half, r = 100 + half;
  const openCollar = shirt && v === 2 && a.neckline === 'collar';
  const neck = openCollar ? 'M79 37L100 73 121 37' : a.neckline === 'v' ? 'M79 37L100 62 121 37' : 'M79 37Q100 52 121 37';
  const short = a.sleeve === 'short', none = a.sleeve === 'none';
  const sleeveEnd = a.sleeve === 'three-quarter' ? 135 : 173;
  if (puffer) {
    art.body = [`${neck}Q146 35 157 56C165 74 176 110 184 ${sleeveEnd - 8}L164 ${sleeveEnd + 2}Q153 146 ${r + 4} 105L${r + 5} ${hem - 10}Q${r + 4} ${hem + 5} 100 ${hem + 5}Q${l - 4} ${hem + 5} ${l - 5} ${hem - 10}L${l - 4} 105Q47 146 36 ${sleeveEnd + 2}L16 ${sleeveEnd - 8}C24 110 35 74 43 56Q54 35 79 37Z`];
    if (short) art.body = [`${neck}Q145 36 157 55L176 93 155 108 ${r + 3} 86 ${r + 5} ${hem - 8}Q100 ${hem + 12} ${l - 5} ${hem - 8}L${l - 3} 86 45 108 24 93 43 55Q55 36 79 37Z`];
    art.seams.push(`M99 57V${hem}M103 57V${hem}`, `M${l + 9} ${hem - 48}L${l + 23} ${hem - 58}M${r - 9} ${hem - 48}L${r - 23} ${hem - 58}`);
    for (let y = 76; y < hem - 10; y += 25) {
      const d = v === 1 ? `M${l - 3} ${y}L97 ${y + 13}M104 ${y + 13}L${r + 3} ${y}` : `M${l - 4} ${y}Q80 ${y + 5} 98 ${y}M104 ${y}Q122 ${y + 5} ${r + 4} ${y}`;
      art.seams.push(d); art.folds.push(d);
      panel(`M${l - 2} ${y + 3}Q80 ${y + 8} 96 ${y + 3}V${y + 9}Q80 ${y + 14} ${l - 2} ${y + 9}Z`, 'light', .13);
      panel(`M106 ${y + 3}Q124 ${y + 8} ${r + 2} ${y + 3}V${y + 9}Q124 ${y + 14} 106 ${y + 9}Z`, 'light', .13);
    }
    art.stitches.push(`M${l} ${hem - 5}Q100 ${hem + 3} ${r} ${hem - 5}`);
    if (!short) art.seams.push(`M22 ${sleeveEnd - 23}L44 ${sleeveEnd - 16}M28 ${sleeveEnd - 49}L53 ${sleeveEnd - 41}M156 ${sleeveEnd - 16}L178 ${sleeveEnd - 23}M147 ${sleeveEnd - 41}L172 ${sleeveEnd - 49}`);
  } else {
    const shoulder = a.fit === 'oversized' ? 151 : shirt ? 146 : 143;
    const sleeve = short ? `L180 84 160 101 ${r} 86` : `L184 ${sleeveEnd - 7} 164 ${sleeveEnd + 1} ${r} 92`;
    art.body = [none ? `${neck}L${r + 2} 48Q${r - 5} 74 ${r} 89L${r} ${hem}Q100 ${hem + 9} ${l} ${hem}L${l} 89Q${l + 5} 74 ${l - 2} 48Z`
      : `${neck}L${shoulder} 46${sleeve}L${r} ${hem}Q100 ${hem + (shirt ? 12 : 5)} ${l} ${hem}L${l} 92${short ? `L40 101 20 84 ${200 - shoulder} 46` : `L36 ${sleeveEnd + 1} 16 ${sleeveEnd - 7} ${200 - shoulder} 46`}Z`];
    if (!(tee && v === 4)) art.seams.push(`M${200 - shoulder} 46Q${l + 4} 65 ${l} 91M${shoulder} 46Q${r - 4} 65 ${r} 91`);
    art.stitches.push(`M${l + 2} ${hem - 6}Q100 ${hem + (shirt ? 5 : 0)} ${r - 2} ${hem - 6}`);
    if (!none) art.stitches.push(short ? 'M24 80L43 96M176 80L157 96' : `M21 ${sleeveEnd - 17}L40 ${sleeveEnd - 11}M160 ${sleeveEnd - 11}L179 ${sleeveEnd - 17}`);
    art.folds.push(`M${l + 3} 101L${l + 9} 128M${r - 3} 102L${r - 9} 128M${l + 7} ${hem - 19}L${l + 17} ${hem - 13}`);
    if (shirt) {
      const placketTop = openCollar ? 76 : 50;
      panel(`M96 ${placketTop}H104V${hem + 3}H96Z`, 'shade', .1);
      art.seams.push(`M97 ${placketTop}V${hem}M103 ${placketTop}V${hem}`);
      for (let y = openCollar ? 95 : 75; y < hem - 10; y += 25) art.buttons.push({ cx: 100, cy: y, r: 1.8 });
      if (v !== 1 && v !== 2) pocket(113, 78);
      if (v === 3) pocket(63, 78);
      if (v === 4) { art.seams.push(`M${l + 2} ${hem - 27}L${l + 8} ${hem - 22}M${r - 2} ${hem - 27}L${r - 8} ${hem - 22}`); }
    } else if (tee) {
      if (v === 2) { panel('M96 50H104V88H96Z', 'body'); art.seams.push('M96 50V88H104V50'); [64, 78].forEach(cy => art.buttons.push({ cx: 100, cy, r: 1.6 })); }
      if (v === 3) pocket(113, 76, 25, 29);
      if (v === 4) art.seams.push('M79 38Q62 54 49 80M121 38Q138 54 151 80');
    } else {
      panel(`M${l} ${hem - 13}Q100 ${hem - 8} ${r} ${hem - 13}V${hem}Q100 ${hem + 5} ${l} ${hem}Z`, 'shade', .16);
      art.seams.push(`M${l} ${hem - 13}Q100 ${hem - 8} ${r} ${hem - 13}`);
      for (let x = l + 5; x < r - 3; x += 6) art.stitches.push(`M${x} ${hem - 9}V${hem - 2}`);
      if (!none && !short) {
        panel(`M23 ${sleeveEnd - 18}L43 ${sleeveEnd - 10} 36 ${sleeveEnd + 1} 16 ${sleeveEnd - 7}Z`, 'shade', .16);
        panel(`M157 ${sleeveEnd - 10}L177 ${sleeveEnd - 18} 184 ${sleeveEnd - 7} 164 ${sleeveEnd + 1}Z`, 'shade', .16);
        art.seams.push(`M23 ${sleeveEnd - 18}L43 ${sleeveEnd - 10}M157 ${sleeveEnd - 10}L177 ${sleeveEnd - 18}`);
      }
      if (v === 1 || v === 2 || a.neckline === 'hood') {
        art.seams.push(v === 2 ? `M66 131L86 124 92 158H66ZM134 131L114 124 108 158H134Z` : 'M76 126Q100 131 124 126L134 159Q100 166 66 159Z');
      }
      if (v === 2) art.seams.push(`M99 55V${hem}M103 55V${hem}`);
      if (v === 3) art.seams.push('M98 40V106M103 40V106');
      if (v === 4) art.seams.push('M49 49L58 84M151 49L142 84');
    }
  }
  if (none && puffer) art.body = [`${neck}L139 49Q129 71 139 94L${r + 3} ${hem - 8}Q100 ${hem + 10} ${l - 3} ${hem - 8}L61 94Q71 71 61 49Z`];
  panel(`M${l} 91L${l + 7} 109 ${l + 7} ${hem - 9} ${l} ${hem - 4}Z`, 'shade', .12);
  panel(`M${r - 7} 108L${r} 91V${hem - 4}L${r - 7} ${hem - 9}Z`, 'shade', .12);

  if (a.neckline === 'hood') {
    panel('M76 40C68 22 79 13 100 13S132 22 124 40L114 56 86 56Z', 'body', undefined, true);
    panel('M83 35Q82 21 100 22T117 35L108 50H92Z', 'shade', .4, true);
    art.neck.push('M76 40C68 22 79 13 100 13S132 22 124 40L114 56 86 56Z', 'M87 54L86 83M113 54L114 83');
    art.buttons.push({ cx: 86, cy: 82, r: 1.6 }, { cx: 114, cy: 82, r: 1.6 });
  } else if (a.neckline === 'collar' || a.neckline === 'polo') {
    const collar = openCollar ? 'M80 35L99 73 84 65 71 44ZM120 35L101 73 116 65 129 44Z' : 'M80 35L100 49 86 65 71 44ZM120 35L100 49 114 65 129 44Z';
    panel(collar, 'body', undefined, true); art.neck.push(collar);
  } else if (a.neckline === 'turtle') {
    const top = shirt && v === 1 ? 29 : 20;
    panel(`M81 38V${top}Q100 ${top - 7} 119 ${top}V38L100 49Z`, 'body', undefined, true);
    art.neck.push(`M81 38V${top}Q100 ${top - 7} 119 ${top}V38M83 ${top + 6}Q100 ${top + 1} 117 ${top + 6}`);
  } else {
    art.neck.push(a.neckline === 'v' ? 'M79 37L100 62 121 37M82 42L100 68 118 42' : 'M79 37Q100 61 121 37M81 42Q100 65 119 42');
  }
  return art;
}
