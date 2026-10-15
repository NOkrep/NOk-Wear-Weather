'use client';

import { memo, useId } from 'react';
import type { ClothingItem } from '@/lib/types';

interface GarmentVisualProps {
  item: Pick<ClothingItem, 'name' | 'category' | 'colorHex'>;
  className?: string;
  worn?: boolean;
}

/** Shared technical fashion illustration, coloured from the recommended item. */
export const GarmentVisual = memo(function GarmentVisual({ item, className = '', worn = false }: GarmentVisualProps) {
  const id = useId().replace(/:/g, '');
  const name = item.name.toLocaleLowerCase('tr');
  const shirt = /gömlek|oxford|poplin/.test(name);
  const hood = /hoodie|kapüşon|yağmurluk|hardshell/.test(name);
  const puffer = /şişme|puffer|dolgulu/.test(name);
  const long = /trençkot|kaban|parka/.test(name);
  const polo = /polo/.test(name);
  const turtle = /balıkçı/.test(name);
  const short = item.category === 'base' && !/uzun|termal/.test(name);
  const fill = `url(#${id}-fabric)`;
  const seam = { stroke: '#17221e', strokeOpacity: .25, strokeWidth: 1.2, fill: 'none' };
  const stitch = { ...seam, strokeOpacity: .15, strokeDasharray: '2 2' };

  return (
    <svg className={`garment-visual ${className}`} viewBox="0 0 200 240" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-fabric`} x1="20" y1="55" x2="175" y2="190" gradientUnits="userSpaceOnUse">
          <stop stopColor={item.colorHex || '#b7c0a7'} />
          <stop offset=".5" stopColor={item.colorHex || '#b7c0a7'} />
          <stop offset="1" stopColor={item.colorHex || '#b7c0a7'} />
        </linearGradient>
        <linearGradient id={`${id}-shade`} x1="30" x2="170" gradientUnits="userSpaceOnUse">
          <stop stopColor="#000" stopOpacity=".18" />
          <stop offset=".25" stopColor="#fff" stopOpacity=".3" />
          <stop offset=".52" stopColor="#fff" stopOpacity="0" />
          <stop offset=".78" stopColor="#000" stopOpacity=".07" />
          <stop offset="1" stopColor="#000" stopOpacity=".28" />
        </linearGradient>
        <pattern id={`${id}-knit`} width="4" height="5" patternUnits="userSpaceOnUse">
          <path d="M0 0l2 3 2-3" stroke="#17221e" strokeOpacity=".09" strokeWidth=".5" />
        </pattern>
      </defs>
      {!worn && <ellipse cx="100" cy="221" rx="55" ry="5" fill="#17221e" opacity=".07" />}
      {item.category === 'bottom' ? (
        <g>
          <path d={/şort/.test(name) ? 'M58 30Q100 35 142 30L151 139 110 143 100 84 91 143 49 139Z' : 'M58 27Q100 32 142 27L145 88 137 211 107 211 100 93 93 211 63 211 55 88Z'} fill={fill} stroke="#28342a" strokeOpacity=".3" />
          <path d={/şort/.test(name) ? 'M58 30Q100 35 142 30L151 139 110 143 100 84 91 143 49 139Z' : 'M58 27Q100 32 142 27L145 88 137 211 107 211 100 93 93 211 63 211 55 88Z'} fill={`url(#${id}-shade)`} />
          <path d="M58 39Q100 44 142 39M100 42v43q11 1 11-12V42M61 45q2 25 19 25M139 45q-2 25-19 25" {...seam} />
          <path d="M67 32v14M83 34v13M118 34v13M134 32v14" stroke="#27362b" strokeOpacity=".35" strokeWidth="3" />
          <circle cx="102" cy="37" r="1.8" fill="#48513f" />
          {!/şort/.test(name) && <path d="M79 83l-3 119M121 83l3 119M64 203h28M108 203h28" {...stitch} />}
        </g>
      ) : item.category === 'footwear' ? (
        <g transform="translate(0 28)">
          {/bot/.test(name) ? <>
            <path d="M55 58h53l-1 65q8 16 39 24c13 4 20 13 20 25H40v-30l8-21Z" fill={fill} stroke="#29312c" strokeOpacity=".5" />
            <path d="M65 68h31v54H60Z" fill="#1e2521" opacity=".3" />
            <path d="M52 63h8l-8 74q-2 8-9 9M108 122q-15 17-7 40M119 143q18 0 28 12" {...seam} />
            <path d="M40 171h126v10H40Z" fill="#30372e" /><path d="M44 181h35v6H44M130 181h30v6h-30" fill="#242c26" />
          </> : <>
            <path d="M30 137q3-13 12-25l13-18q17 12 38 6l25 30 38 11q16 4 17 21l-4 10H30q-8-16 0-35Z" fill={fill} stroke="#28342a" strokeOpacity=".35" />
            <path d="M39 115q9 16 27 18l11 25M97 105l-9 28 35 14M128 138q-10 8-11 22" {...seam} />
            <path d="M32 158q54 12 138 0v14q-67 10-140 0Z" fill="#e5e3d7" stroke="#28342a" strokeOpacity=".25" />
            <path d="M83 115l21-3M87 122l23-3M91 130l23-4" stroke="#f0efdf" strokeWidth="3" strokeLinecap="round" />
            <path d="M39 170h121" {...stitch} />
          </>}
        </g>
      ) : item.category === 'accessory' ? (
        <g>
          {/gözlük/.test(name) ? <>
            <path d="M31 91h57v35q-27 28-49-4ZM112 91h57l-8 31q-22 28-49 4Z" fill={fill} stroke="#28342a" strokeWidth="3" />
            <path d="M87 100q13-8 26 0M31 94l-8-14M169 94l8-14" stroke="#28342a" strokeWidth="4" />
          </> : /atkı/.test(name) ? <>
            <path d="M67 40q33-14 66 0l-12 151-29-5 8-92-13 115-29-5Z" fill={fill} stroke="#28342a" strokeOpacity=".25" />
            <path d="M70 50q30 12 59 0M65 62q30 12 63 0M62 195l23 4M97 177l25 4" {...seam} />
          </> : /bere|şapka/.test(name) ? <>
            <path d="M47 139V98a53 53 0 0 1 106 0v41Z" fill={fill} />
            <rect x="43" y="125" width="114" height="32" rx="8" fill={fill} stroke="#28342a" strokeOpacity=".3" />
            <path d="M57 131v20M65 131v20M73 131v20M81 131v20M89 131v20M97 131v20M105 131v20M113 131v20M121 131v20M129 131v20M137 131v20M145 131v20" {...seam} />
          </> : <>
            <path d="M27 108a73 73 0 0 1 146 0q-18-17-36 0-18-17-37 0-18-17-37 0-18-17-36 0Z" fill={fill} stroke="#28342a" strokeOpacity=".3" />
            <path d="M100 35v145a13 13 0 0 1-26 0M100 36q-35 20-37 72M100 36q35 20 37 72" {...seam} strokeWidth="2" />
          </>}
        </g>
      ) : (
        <g>
          <path id={`${id}-shape`} d={short ? 'M76 34Q100 42 124 34L143 43 175 66 155 101 137 91 139 185Q100 191 61 185L63 91 45 101 25 66 57 43Z' : `M76 29Q100 38 124 29L145 40Q154 43 158 60L183 158 160 166 138 97 ${long ? '144 210Q100 216 56 210' : '141 184Q100 192 59 184'} L62 97 40 166 17 158 42 60Q46 43 55 40Z`} fill={fill} stroke="#26352a" strokeOpacity=".28" />
          <use href={`#${id}-shape`} fill={`url(#${id}-shade)`} />
          {!shirt && item.category === 'mid' && !polo && <use href={`#${id}-shape`} fill={`url(#${id}-knit)`} />}
          {hood ? <>
            <path d="M76 29Q76 3 100 8q24-5 24 21L113 54H87Z" fill={fill} stroke="#28342a" strokeOpacity=".3" />
            <path d="M84 27q16-17 32 0l-16 25Z" fill="#17221e" opacity=".18" />
            <path d="M100 52v133M87 51v35M113 51v35M69 126l15-10M131 126l-15-10" {...seam} />
          </> : shirt || polo || item.category === 'outer' ? <>
            <path d="M77 28L100 45 87 63 70 39ZM123 28L100 45 113 63 130 39Z" fill={fill} stroke="#28342a" strokeOpacity=".4" />
            <path d={long ? 'M87 63l-10 9 23 30 23-30-10-9M98 101v109M74 134h52M76 139h48' : 'M98 47v139M102 49v137'} {...seam} />
            {(long ? [110, 139, 170] : [70, 93, 116, 139, 162]).map(y => <circle key={y} cx={long ? 109 : 100} cy={y} r={long ? 2 : 1.6} fill="#29372d" opacity=".55" />)}
            <path d={long ? 'M68 149l17-9M132 149l-17-9' : item.category === 'outer' ? 'M70 73h22v27H70ZM108 73h22v27h-22ZM70 74l11 10 11-10M108 74l11 10 11-10M68 141l17-8M132 141l-17-8M63 170h74' : 'M72 77h17v19H72ZM73 81h15'} {...seam} />
          </> : turtle ? <path d="M81 24V11q19-7 38 0v13q-19 14-38 0Z" fill={fill} stroke="#28342a" strokeOpacity=".25" /> : <>
            <path d="M77 31q23 28 46 0" stroke="#17221e" strokeOpacity=".24" strokeWidth="5" />
            <path d="M77 32q23 25 46 0" stroke="#fff" strokeOpacity=".18" strokeWidth="1.5" />
          </>}
          {puffer && <path d="M58 76h84M60 99h80M60 122h80M59 145h82M59 167h82M35 89l17 5M30 111l20 6M25 135l18 6M148 94l17-5M150 117l20-6M157 141l18-6" {...seam} />}
          <path d={short ? 'M31 68l16 25M169 68l-16 25M64 179q36 6 72 0' : `M22 153l18 5M160 158l18-5M65 ${long ? 203 : 178}q35 6 70 0M58 52q6 22 4 45M142 52q-6 22-4 45`} {...stitch} />
          <path d={short ? 'M70 96q-5 44 0 72M130 96q5 44 0 72' : 'M70 104q-4 39 0 63M130 104q4 39 0 63'} stroke="#fff" strokeOpacity=".12" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
});
