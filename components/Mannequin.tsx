'use client';
import { memo, useId } from 'react';
import type { ClothingItem } from '@/lib/types';
import { useLocale } from '@/lib/i18n';

export interface Avatar {
  build: 'slim' | 'regular' | 'broad'; hair: 'none' | 'short' | 'long'; beard: boolean; face: boolean;
  faceShape: 'oval' | 'round' | 'angular'; hairColor: string;
}

/** Fitted fashion illustration. Every garment uses the mannequin's actual shoulder/hip coordinates. */
export const Mannequin = memo(function Mannequin({ avatar, items }: { avatar: Avatar; items: ClothingItem[] }) {
  const { t } = useLocale();
  const id = useId().replace(/:/g, '');
  const top = items.find(item => item.category === 'mid') || items.find(item => item.category === 'base');
  const outer = items.find(item => item.category === 'outer');
  const bottom = items.find(item => item.category === 'bottom');
  const shoes = items.find(item => item.category === 'footwear');
  const long = /kaban|trençkot|parka/.test(outer?.name.toLocaleLowerCase('tr') || '');
  const puffer = /şişme|puffer|dolgulu/.test(outer?.name.toLocaleLowerCase('tr') || '');
  const short = top?.category === 'base' && !/uzun|termal/.test(top.name.toLocaleLowerCase('tr'));
  const shorts = /şort/.test(bottom?.name.toLocaleLowerCase('tr') || '');
  const skin = `url(#${id}-porcelain)`;
  const fabric = (name: string) => `url(#${id}-${name})`;
  const bodyScale = avatar.build === 'slim' ? .92 : avatar.build === 'broad' ? 1.1 : 1;
  const pants = shorts ? 'M116 304Q160 311 204 304L212 422 168 424 160 355 152 424 108 422Z' : 'M116 304Q160 311 204 304L208 353 198 557Q183 562 170 557L160 367 150 557Q136 562 122 557L112 353Z';
  const topPath = short ? 'M135 135Q160 153 185 135L211 147 231 204 207 216 199 191 202 319Q160 325 118 319L121 191 113 216 89 204 109 147Z' : 'M135 135Q160 153 185 135L210 146Q219 153 225 179L248 346 226 350 200 215 202 319Q160 325 118 319L120 215 94 350 72 346 95 179Q101 153 110 146Z';
  const coatBottom = long ? 424 : 322;
  const jacket = `M134 133L146 161 143 ${coatBottom}Q124 ${coatBottom+3} 110 ${coatBottom-3}L115 220 93 356 69 350 93 177Q99 151 110 145Z M186 133L174 161 177 ${coatBottom}Q196 ${coatBottom+3} 210 ${coatBottom-3}L205 220 227 356 251 350 227 177Q221 151 210 145Z`;
  return <svg className="mannequin mannequin-v2" viewBox="0 0 320 640" role="img" aria-label={t('Beyaz mağaza mankeni üzerinde kombin görünümü')}>
    <defs>
      <linearGradient id={`${id}-porcelain`} x1=".05" y1=".3" x2=".95" y2=".45"><stop stopColor="#a9b1b0"/><stop offset=".2" stopColor="#e3e7e5"/><stop offset=".43" stopColor="#fffef8"/><stop offset=".7" stopColor="#eff1eb"/><stop offset="1" stopColor="#aeb9b7"/></linearGradient>
      <linearGradient id={`${id}-face`}><stop stopColor="#c0c8c5"/><stop offset=".4" stopColor="#fffdf5"/><stop offset="1" stopColor="#d5dcd7"/></linearGradient>
      <linearGradient id={`${id}-shade`}><stop stopColor="#000" stopOpacity=".18"/><stop offset=".28" stopColor="#fff" stopOpacity=".2"/><stop offset=".52" stopColor="#fff" stopOpacity=".03"/><stop offset=".8" stopColor="#000" stopOpacity=".06"/><stop offset="1" stopColor="#000" stopOpacity=".28"/></linearGradient>
      {([['top', top?.colorHex || '#d9dbd2'], ['outer', outer?.colorHex || '#7b8267'], ['bottom', bottom?.colorHex || '#e1dfd1'], ['shoes', shoes?.colorHex || '#e5e8e1']] as const).map(([name,color])=><linearGradient key={name} id={`${id}-${name}`} x1="0" y1="0" x2="1" y2=".25"><stop stopColor={color}/><stop offset="1" stopColor={color}/></linearGradient>)}
      <filter id={`${id}-floor`} x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>
    <ellipse cx="160" cy="617" rx="77" ry="8" fill="#182b29" opacity=".12" filter={`url(#${id}-floor)`}/>
    <ellipse cx="160" cy="618" rx="68" ry="4" fill="none" stroke="currentColor" opacity=".12"/>
    <g transform={`translate(160 0) scale(${bodyScale} 1) translate(-160 0)`}>
      {avatar.hair === 'long' && <path d="M128 62Q124 18 158 17q38 0 35 46l8 88-32-10-4-68-15-1-2 69-31 9Z" fill={avatar.hairColor}/>}
      <g fill={skin}>
        <path d="M143 100Q151 109 177 100l-1 26q4 9 20 15l-36 30-36-30q19-7 20-15Z"/>
        <path d="M125 138Q160 153 195 138l17 29-7 69q-12 31-8 55l9 33q-11 22-46 22t-46-22l9-33q4-24-8-55l-7-69Z"/>
        <path d="M113 146q-18 3-21 26l-15 91-9 77q-1 12-4 26l-5 28q0 10 4 10l7-23-1 25q2 9 6 5l3-26 1 28q4 8 7 0l1-28 3 23q4 5 6-2l-3-36q4 10 8 6l-9-22-1-12 18-72 26-88Z"/>
        <path d="M207 146q18 3 21 26l15 91 9 77q1 12 4 26l5 28q0 10-4 10l-7-23 1 25q-2 9-6 5l-3-26-1 28q-4 8-7 0l-1-28-3 23q-4 5-6-2l3-36q-4 10-8 6l9-22 1-12-18-72-26-88Z"/>
        <path d="M118 315q21-9 42 3l-5 84-5 82-5 86q-7 12-24 5l-1-94-7-84Z"/>
        <path d="M160 318q21-12 42-3l5 82-7 84-1 94q-17 7-24-5l-5-86-5-82Z"/>
        <path d="M121 562q10 7 24 0l-1 30-4 14q-11 9-31 6-8-5 2-12l10-11Z"/>
        <path d="M175 562q14 7 24 0v27l10 11q10 7 2 12-20 3-31-6l-4-14Z"/>
        <path d={avatar.faceShape === 'angular' ? 'M137 39q23-18 46 0l2 39-10 24-15 9-15-9-10-24Z' : avatar.faceShape === 'round' ? 'M133 59q0-32 27-32t27 32l-2 24q-5 25-25 27-20-2-25-27Z' : 'M136 55q0-30 24-30t24 30l-1 26q-3 24-23 30-20-6-23-30Z'} fill={`url(#${id}-face)`}/>
        <ellipse cx="136" cy="68" rx="3" ry="9"/><ellipse cx="184" cy="68" rx="3" ry="9"/>
      </g>
      <path d="M157 52l-3 26 8 3" stroke="#b3bdb5" strokeWidth=".9" fill="none" opacity=".45"/>
      <path d="M145 124q14 10 30 0M130 146l21 10M190 146l-21 10" fill="none" stroke="#a8b5ad" strokeWidth=".7" opacity=".5"/>
      {avatar.hair === 'short' && <path d="M134 60q-7-37 25-39 32-1 28 37l-9-16-18-7-17 9-4 17Z" fill={avatar.hairColor}/>}
      {avatar.hair === 'long' && <path d="M131 62q-6-43 27-43 37-1 33 43l-14-20-18-7-18 16-4 37Z" fill={avatar.hairColor}/>}
      {avatar.face && <g fill="none" stroke="#75847b" strokeWidth="1.1" strokeLinecap="round"><path d="M144 60q5-3 10 0M167 60q5-3 10 0M152 91q8 3 16 0"/><path d="M158 66l-2 13 6 1" opacity=".6"/></g>}
      {avatar.beard && <path d="M138 77l8 9 14 3 14-3 8-9-6 21-16 12-16-12Z" fill={avatar.hairColor} opacity=".9"/>}
      {bottom && <g><path d={pants} fill={fabric('bottom')}/><path d={pants} fill={fabric('shade')}/><g fill="none" stroke="#17251e" strokeOpacity=".19" strokeWidth=".9"><path d="M116 315q44 7 88 0M159 317v42q9 0 10-12v-29M122 321q2 23 18 25M198 321q-2 23-18 25"/>{!shorts && <path d="M135 369l-3 175M185 369l3 175M122 550q14 4 28 0M170 550q14 4 28 0"/>}</g><path d="M122 354l10 9M198 354l-10 9M128 470l10 6M182 476l10-6" stroke="#fff" strokeOpacity=".16" fill="none"/></g>}
      {top && <g><path d={topPath} fill={fabric('top')}/><path d={topPath} fill={fabric('shade')}/><path d="M135 137q25 24 50 0" stroke="#102a20" strokeOpacity=".25" strokeWidth="3" fill="none"/>{/gömlek|oxford|polo/.test(top.name.toLocaleLowerCase('tr')) && <g stroke="#15251c" strokeOpacity=".25" strokeWidth=".8" fill={fabric('top')}><path d="M135 135l25 20-13 21-19-31M185 135l-25 20 13 21 19-31M160 155v164"/>{[190,218,246,274,302].map(y=><circle cx="162" cy={y} r="1.2" key={y}/>)}</g>}<path d="M124 311q36 5 72 0" stroke="#162c20" strokeOpacity=".15" fill="none"/></g>}
      {outer && <g><path d={jacket} fill={fabric('outer')}/><path d={jacket} fill={fabric('shade')}/><g stroke="#14261d" strokeOpacity=".28" strokeWidth=".9" fill="none"><path d={`M134 133l-6 22 16 24-15 10 14 33M186 133l6 22-16 24 15 10-14 33M114 ${coatBottom-9}l25 3M181 ${coatBottom-6}l25-3M73 343l20 5M227 348l20-5M119 255l17-5M201 255l-17-5`}/>{!long && <path d="M117 185h18v25h-18ZM185 185h18v25h-18ZM117 186l9 7 9-7M185 186l9 7 9-7"/>}{puffer && <path d="M105 190h33M182 190h33M105 220h35M180 220h35M110 250h31M179 250h31M110 280h32M178 280h32M80 280l19 4M221 284l19-4"/>}</g>{[230,263,296].map(y=><circle key={y} cx="183" cy={y} r="1.5" fill="#1a3022" opacity=".5"/>)}</g>}
      {shoes && <g fill={fabric('shoes')} stroke="#1e3025" strokeOpacity=".2"><path d="M121 564q11 7 25 0l-1 27-3 17q-13 11-37 5-4-8 7-15l8-12Z"/><path d="M174 564q14 7 25 0l1 22 8 12q11 7 7 15-24 6-37-5l-3-17Z"/><path d="M107 610q19 5 36-4M177 606q17 9 36 4" fill="none" stroke="#ecede3" strokeWidth="4"/></g>}
    </g>
  </svg>;
});
