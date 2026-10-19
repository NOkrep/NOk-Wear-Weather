'use client';

import { memo, useId } from 'react';
import { resolveGarmentAppearance, type AppearanceItem } from '@/lib/garment-appearance';

interface GarmentVisualProps { item: AppearanceItem; className?: string; worn?: boolean }

/** Original vector templates; styling is representative and never changes source facts. */
export const GarmentVisual = memo(function GarmentVisual({ item, className = '', worn = false }: GarmentVisualProps) {
  const id = useId().replace(/:/g, '');
  const a = resolveGarmentAppearance(item), type = a.type;
  const v = a.design?.variant ?? -1;
  const seam = { stroke: '#182d29', strokeOpacity: .36, strokeWidth: 1.1, fill: 'none' };
  const stitch = { ...seam, strokeOpacity: .2, strokeDasharray: '2 2' };
  const top = ['base', 'mid', 'outer'].includes(item.category) && type !== 'dress';
  const hem = a.length === 'cropped' ? 155 : a.length === 'long' || type === 'coat-parka' ? 210 : 189;
  const width = a.fit === 'slim' ? 31 : a.fit === 'relaxed' ? 43 : a.fit === 'oversized' ? 48 : 37;
  const rightSleeve = a.sleeve === 'short' ? '173 68 155 101 137 91' : a.sleeve === 'three-quarter' ? '176 126 155 135 137 91' : '183 162 159 169 137 94';
  const leftSleeve = a.sleeve === 'short' ? '63 91 45 101 27 68' : a.sleeve === 'three-quarter' ? '63 91 45 135 24 126' : '63 94 41 169 17 162';
  const topPath = a.sleeve === 'none'
    ? `M79 33Q100 48 121 33L136 42 132 81 ${100 + width} ${hem}Q100 ${hem + 8} ${100 - width} ${hem}L68 81 64 42Z`
    : `M77 34Q100 44 123 34L144 44 ${rightSleeve} ${100 + width} ${hem}Q100 ${hem + 8} ${100 - width} ${hem}L${leftSleeve} 56 44Z`;
  const trouserHem = a.length === 'cropped' ? 175 : a.length === 'long' ? 222 : 214;
  const shortsHem = a.length === 'cropped' ? 116 : a.length === 'long' ? 166 : 142;
  const narrow = type === 'leggings';
  const legWidth = narrow || a.fit === 'slim' ? 12 : a.fit === 'oversized' ? 24 : a.fit === 'relaxed' ? 21 : 18;
  const boot = type === 'rain-boots' || type === 'winter-boots';
  let paths: string[] = top ? [topPath] : type === 'dress' ? ['M79 31Q100 48 121 31L137 44 126 95 160 211Q100 225 40 211L74 95 63 44Z']
    : type === 'skirt' ? [`M68 44Q100 50 132 44L${100 + width + 20} ${trouserHem - 13}Q100 ${trouserHem + 2} ${80 - width} ${trouserHem - 13}Z`]
    : item.category === 'bottom' ? [type === 'shorts' ? `M57 36Q100 42 143 36L${125 + legWidth} ${shortsHem} ${125 - legWidth} ${shortsHem + 5} 100 88 ${75 + legWidth} ${shortsHem + 5} ${75 - legWidth} ${shortsHem}Z` : `M59 30Q100 37 141 30L143 88 ${122 + legWidth} ${trouserHem} ${122 - legWidth} ${trouserHem} 100 96 ${78 + legWidth} ${trouserHem} ${78 - legWidth} ${trouserHem} 57 88Z`]
    : type === 'sandals' ? ['M45 87Q65 67 84 88L89 183Q64 211 40 186Z', 'M116 88Q139 67 157 89L162 186Q139 211 111 183Z']
    : item.category === 'footwear' ? [boot ? `M57 ${type === 'rain-boots' ? 42 : 66}H111L108 128Q121 145 150 151Q169 157 168 177H38V149L48 129Z` : type === 'running-shoes' ? 'M29 148L51 104Q68 119 91 108L121 138 157 147Q175 154 173 176H26Z' : 'M30 145L52 102Q69 114 91 108L120 136 155 146Q171 150 172 172H28Z']
    : type === 'beanie' ? ['M49 141V105A51 51 0 0 1 151 105V141Z', 'M43 128H157V160H43Z']
    : type === 'sun-hat' ? ['M63 69Q100 55 137 69L147 135H53Z', 'M30 135Q100 122 170 135L179 155Q100 177 21 155Z']
    : type === 'scarf' ? ['M69 38Q100 25 132 38L121 190 94 186 102 85 86 210 58 205Z']
    : type === 'gloves' ? ['M34 180V105Q35 97 43 104L43 71Q48 60 54 72V97L57 61Q64 53 69 65V96L75 66Q84 61 85 74V106L91 87Q101 82 104 94L90 136 85 180Z', 'M118 180V105Q119 97 127 104V71Q132 60 138 72V97L141 61Q148 53 153 65V96L159 66Q168 61 169 74V106L175 87Q185 82 188 94L174 136 169 180Z']
    : type === 'socks' ? ['M55 40H92V146L68 186Q50 207 34 192Q25 179 38 166L55 145Z', 'M121 40H158V146L134 186Q116 207 100 192Q91 179 104 166L121 145Z']
    : a.umbrella ? ['M26 110A74 74 0 0 1 174 110Q155 94 137 110 118 94 100 110 81 94 63 110 44 94 26 110Z']
    : ['M69 64H131L149 127 100 176 51 127Z'];


  if (type === 'rain-poncho') paths = [`M78 33Q100 45 122 33L145 60 185 ${v === 4 ? 213 : 190}Q100 ${v === 4 ? 229 : 212} 15 ${v === 4 ? 213 : 190}L55 60Z`];
  if (v >= 0) {
    if (type === 'tank-top' && v === 1) paths = ['M79 30H87L88 58Q100 69 112 58L113 30H121L134 79 139 188Q100 198 61 188L66 79Z'];
    if (type === 'tank-top' && v === 2) paths = ['M82 31Q100 41 118 31L126 55 117 80 136 190Q100 200 64 190L83 80 74 55Z'];
    if (type === 'blouse' && v === 3) paths = ['M78 34Q100 47 122 34L151 43Q180 65 177 131L164 163 146 159 139 99 139 186Q100 202 61 186L61 99 54 159 36 163 23 131Q20 65 49 43Z'];
    if (['jeans', 'leggings'].includes(type ?? '') && v === 3) paths = ['M59 30Q100 37 141 30L140 91 134 146 154 215H104L100 100 96 215H46L66 146 60 91Z'];
    if (type === 'skirt') paths = [v === 1 ? 'M68 44Q100 50 132 44L138 205Q100 215 62 205Z' : v === 3 ? 'M68 44Q100 50 132 44L154 204 92 218 46 202Z' : `M68 44Q100 50 132 44L${v === 2 ? 166 : 157} 205Q100 225 ${v === 2 ? 34 : 43} 205Z`];
    if (type === 'dress' && v === 1) paths = ['M78 33Q100 46 122 33L145 45 174 139 153 148 130 91 145 213Q100 225 55 213L70 91 47 148 26 139 55 45Z'];
    if (type === 'dress' && v === 3) paths = ['M77 34Q100 49 123 34L144 46 166 75 146 96 132 83 139 213H61L68 83 54 96 34 75 56 46Z'];
    if (type === 'dress' && v === 4) paths = ['M80 30Q100 43 120 30L133 47 124 92 160 216Q100 229 40 216L76 92 67 47Z'];
    if (type === 'sneakers' && v === 1) paths = ['M47 82H102L105 130 144 145Q174 149 174 177H27V149L42 130Z'];
    if ((type === 'rain-boots' && (v === 1 || v === 2)) || (type === 'winter-boots' && v === 1)) paths = ['M51 106H111L108 134Q125 148 150 151Q170 158 168 177H38V150L48 133Z'];
    if (type === 'winter-boots' && v === 4) paths = ['M57 42H111L108 128Q125 145 150 151Q170 158 168 177H38V149L48 128Z'];
    if (type === 'scarf' && v === 1) paths = ['M51 75Q100 54 149 75L143 150Q100 173 57 150Z', 'M64 83Q100 69 136 83L132 101Q100 115 68 101Z'];
    if (type === 'scarf' && v === 3) paths = ['M25 77Q100 46 175 77L100 209Z'];
    if (type === 'scarf' && v === 4) paths = ['M48 72Q100 47 152 72L143 103 113 95 132 168 109 174 94 106 73 187 48 178 78 95 57 106Z'];
    if (type === 'beanie' && v === 1) paths = ['M49 141V104Q49 35 105 24 159 33 151 102V141Z', 'M43 128H157V160H43Z'];
    if (type === 'beanie' && v === 2) paths = [...paths, 'M84 48A16 16 0 1 0 116 48A16 16 0 1 0 84 48Z'];
    if (type === 'beanie' && v === 3) paths = ['M49 140V123A51 51 0 0 1 151 123V140Z', 'M43 130H157V156H43Z'];
    if (type === 'sun-hat' && v === 2) paths = ['M51 124Q48 59 105 63 152 69 149 130Z', 'M102 122Q153 115 182 144L169 156 102 144Z'];
    if (type === 'sun-hat' && v === 4) paths = ['M49 108Q100 83 150 108L147 129Q100 106 53 129Z', 'M78 119Q139 102 180 146L166 158Q113 137 78 140Z'];
    if (type === 'sun-hat' && (v === 1 || v === 3)) paths = ['M66 66Q100 56 134 66L145 129H55Z', `M${v === 1 ? 14 : 8} 131Q100 114 ${v === 1 ? 186 : 192} 131L178 160Q100 181 22 160Z`];
    if (type === 'gloves' && v === 1) paths = ['M37 185V104Q36 68 62 68 89 68 87 111L95 97Q108 89 108 106L87 145V185Z', 'M120 185V104Q119 68 145 68 172 68 170 111L178 97Q191 89 191 106L170 145V185Z'];
    if (type === 'gloves' && v === 2) paths = ['M36 181V101L87 101V115L96 96 109 108 86 146V181Z', 'M119 181V101L170 101V115L179 96 192 108 169 146V181Z'];
    if (type === 'socks' && (v === 1 || v === 2)) { const y = v === 1 ? 110 : 20; paths = [`M55 ${y}H92V146L68 186Q50 207 34 192Q25 179 38 166L55 145Z`, `M121 ${y}H158V146L134 186Q116 207 100 192Q91 179 104 166L121 145Z`]; }
  }
  const designLines = v < 0 ? [] : illustrationDetails(type, v, hem);

  return <svg className={`garment-visual ${className}`} viewBox="0 0 200 240" fill="none" aria-hidden="true" focusable="false" data-garment-type={type ?? (a.umbrella ? 'umbrella' : 'unspecified')} data-garment-pattern={a.pattern} data-garment-design={a.design?.id}>
    <defs>
      <linearGradient id={`${id}-shade`} x1="30" x2="172" gradientUnits="userSpaceOnUse"><stop stopColor="#122821" stopOpacity=".23"/><stop offset=".3" stopColor="#fff" stopOpacity=".25"/><stop offset=".6" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#122821" stopOpacity=".29"/></linearGradient>
      <pattern id={`${id}-print`} width={a.pattern === 'dots' ? 15 : 24} height={a.pattern === 'dots' ? 15 : 24} patternUnits="userSpaceOnUse">
        {a.pattern === 'stripes' && <path d="M0 6H24M0 18H24" stroke={a.accentColor} strokeWidth="4"/>}
        {a.pattern === 'checks' && <><path d="M0 8H24M8 0V24" stroke={a.accentColor} strokeWidth="6" opacity=".6"/><path d="M0 20H24M20 0V24" stroke={a.accentColor} strokeWidth="1.5"/></>}
        {a.pattern === 'dots' && <circle cx="6" cy="6" r="2" fill={a.accentColor}/>}
      </pattern>
      <clipPath id={`${id}-clip`}>{paths.map((d, i) => <path d={d} key={i}/>)}</clipPath>
      <pattern id={`${id}-knit`} width="5" height="6" patternUnits="userSpaceOnUse"><path d="M0 0L2.5 4 5 0" {...seam} strokeOpacity=".13" strokeWidth=".6"/></pattern>
    </defs>
    {!worn && <ellipse cx="100" cy="227" rx="53" ry="4" fill="#172e26" opacity=".08"/>}
    <g clipPath={`url(#${id}-clip)`}>
      <rect x="10" y="0" width="185" height="225" fill={a.color}/>
      {a.pattern === 'colour-block' ? <path d="M10 104H195V145H10Z" fill={a.accentColor}/> : a.pattern !== 'plain' && <rect width="200" height="225" fill={`url(#${id}-print)`}/>}
      {(type === 'sweater' || type === 'cardigan' || type === 'beanie' || type === 'scarf') && <rect width="200" height="225" fill={`url(#${id}-knit)`}/>}
      <rect width="200" height="225" fill={`url(#${id}-shade)`}/>
    </g>
    {paths.map((d, i) => <path d={d} {...seam} strokeOpacity=".4" key={i}/>)}
    {(top || type === 'dress') && <>
      {a.neckline === 'hood' ? <><path d="M77 34Q74 7 100 9 126 7 123 34L112 57H88Z" fill={a.color} stroke={seam.stroke} strokeOpacity={seam.strokeOpacity}/><path d="M86 31Q100 14 114 31L100 52Z" fill="#132c26" opacity=".23"/><path d="M88 55V83M112 55V83" {...seam}/></>
        : a.neckline === 'turtle' ? <path d="M81 34V17Q100 12 119 17V34Q100 48 81 34Z" fill={a.color} stroke={seam.stroke} strokeOpacity={seam.strokeOpacity}/>
        : a.neckline === 'collar' || a.neckline === 'polo' ? <><path d="M77 34L100 46 87 65 70 42ZM123 34L100 46 113 65 130 42Z" fill={a.color} stroke={seam.stroke} strokeOpacity={seam.strokeOpacity}/><path d={a.neckline === 'polo' ? 'M100 47V87' : `M100 47V${hem}`} {...seam}/>{(a.neckline === 'polo' ? [68, 79] : [78, 104, 130, 156]).map(y => <circle cx="102" cy={y} r="1.5" fill="#183028" opacity=".6" key={y}/>)}</>
        : a.neckline === 'v' ? <path d="M78 35L100 67 122 35" {...seam} strokeWidth="3"/>
        : <path d="M78 35Q100 70 122 35" {...seam} strokeWidth="4"/>}
      <g clipPath={`url(#${id}-clip)`}><path d={`M${103 - width} ${hem - 7}Q100 ${hem} ${97 + width} ${hem - 7}`} {...stitch}/>
      {a.sleeve !== 'none' && <path d="M58 49Q65 71 63 91M142 49Q135 71 137 91" {...stitch}/>}
      {v < 0 && type === 'puffer' && <path d="M58 78H142M61 100H139M61 123H139M61 146H139M61 169H139M31 104L47 109M25 133L41 138M153 109L169 104M159 138L175 133" {...seam}/>}
      {v < 0 && (type === 'cardigan' || type === 'fleece' || type === 'rain-jacket' || type === 'softshell' || type === 'windbreaker') && <path d={`M100 57V${hem}M65 139L84 127M135 139L116 127`} {...seam}/>}
      {v < 0 && type === 'softshell' && <path d="M119 72V106M62 97L73 108M138 97L127 108" {...seam} strokeWidth="2"/>}
      {v < 0 && type === 'windbreaker' && <path d="M52 77Q100 105 148 77" {...seam}/>}
      {v < 0 && type === 'fleece' && <path d="M116 78H130V104H116Z" {...stitch}/>}
      {v < 0 && type === 'sweatshirt' && <path d="M77 136L69 160H131L123 136Z" {...seam}/>}
      {v < 0 && type === 'thermal-top' && <path d="M72 80L80 122V170M128 80L120 122V170" {...stitch}/>}
      {v < 0 && type === 'light-jacket' && <path d="M70 78H89V103H70ZM111 78H130V103H111Z" {...seam}/>}
      {v < 0 && type === 'coat-parka' && <path d="M79 64L73 76 100 107 127 76 121 64M65 153L82 143M135 153L118 143" {...seam}/>}
      {v < 0 && type === 'dress' && <path d="M74 95Q100 103 126 95M87 102L72 206M113 102L128 206" {...seam}/>}</g>
    </>}
    {v < 0 && item.category === 'bottom' && <g clipPath={`url(#${id}-clip)`}>
      <path d="M59 40Q100 47 141 40M100 45V88" {...seam}/>
      {type !== 'skirt' && <path d="M64 48Q64 72 82 73M136 48Q136 72 118 73" {...seam}/>}
      {type === 'jeans' && <><path d="M67 32V47M83 34V47M117 34V47M133 32V47M76 87L75 207M124 87L125 207" {...stitch}/><circle cx="102" cy="37" r="2" fill="#b4a57b"/></>}
      {type === 'woven-trousers' && <path d="M80 83L78 207M120 83L122 207" {...seam} strokeOpacity=".18"/>}
      {type === 'joggers' && <path d="M94 44L89 73M106 44L111 73M64 207H92M108 207H136" {...seam} strokeWidth="2"/>}
      {type === 'leggings' && <path d="M60 49Q100 56 140 49M79 61L88 97M121 61L112 97" {...stitch}/>}
      {type === 'skirt' && <path d="M81 51L67 203M119 51L133 203M48 196Q100 209 152 196" {...stitch}/>}
    </g>}
    {v < 0 && item.category === 'footwear' && (type === 'sandals' ? <><path d="M43 110L86 124M43 141L86 155M114 110L158 124M114 141L158 155" stroke={a.accentColor} strokeWidth="13"/><path d="M44 184Q65 198 86 183M115 183Q138 198 159 184" {...seam}/></> : <>
      <path d="M29 173Q95 185 170 173V184H29Z" fill={a.accentColor} stroke={seam.stroke} strokeOpacity={seam.strokeOpacity}/>
      {boot ? <><path d="M58 78H101V128H54M108 130L100 160" {...seam}/>{type === 'winter-boots' && <path d="M57 66H110M60 92H101M58 103H100M56 114H99" stroke={a.accentColor} strokeWidth="4"/>}{type === 'rain-boots' && <path d="M58 52H109M60 61V125" {...stitch}/>}</> : <><path d="M43 121Q55 138 73 142M101 116L89 146 123 157M132 144L122 170" {...seam}/><path d="M82 121L104 118M87 129L111 126M93 137L117 134" stroke={a.accentColor} strokeWidth="3" strokeLinecap="round"/>{type === 'running-shoes' && <path d="M40 151L57 135M46 155L64 139M141 155L151 162" {...stitch}/>}</>}
    </>)}
    {v < 0 && type === 'beanie' && <path d="M53 134V153M63 134V153M73 134V153M83 134V153M93 134V153M103 134V153M113 134V153M123 134V153M133 134V153M143 134V153" {...seam}/>}
    {v < 0 && type === 'scarf' && <path d="M69 45Q100 57 130 45M62 196L85 200M98 179L121 183" {...seam}/>}
    {v < 0 && type === 'gloves' && <path d="M35 169H85M119 169H169" {...seam} strokeWidth="3"/>}
    {v < 0 && type === 'socks' && <path d="M57 49H90M123 49H156M57 58H90M123 58H156" {...seam}/>}
    {v >= 0 && item.category === 'footwear' && type !== 'sandals' && <path d="M29 173Q95 185 170 173V184H29Z" fill={a.accentColor} stroke={seam.stroke} strokeOpacity={seam.strokeOpacity}/>}
    {designLines.length > 0 && <g clipPath={`url(#${id}-clip)`}>
      {type === 'shirt' && <path d={`M100 57V${hem - 5}M102 80h1M102 104h1M102 128h1M102 152h1`} {...seam}/>}
      {item.category === 'bottom' && <path d="M59 40Q100 47 141 40M100 45V88" {...seam}/>}
      {designLines.map((d, index) => <path d={d} {...seam} strokeWidth={type === 'sandals' ? 7 : 1.6} key={index}/>)}
    </g>}
    {a.umbrella && <path d="M100 36V182A13 13 0 0 1 74 182M100 36Q65 55 63 110M100 36Q135 55 137 110" {...seam} strokeWidth="2"/>}
  </svg>;
});
/** Seams and closures carry visual differences; none are evidence of real materials. */
function illustrationDetails(type: string | undefined, v: number, hem: number): string[] {
  const zip = `M100 52V${hem - 6}M97 58V${hem - 6}`;
  const pocket = 'M115 78H134V103Q124 112 115 103Z';
  const cargo = 'M58 111H85V145H58ZM115 111H142V145H115ZM58 117H85M115 117H142';
  const raglan = 'M78 35L49 93M122 35L151 93';
  const placket = 'M96 51H104V90H96ZM100 62V65M100 75V78';
  if (type === 'short-sleeve-tee') return [['M72 180H128'],['M78 35L100 65 122 35'],[placket],[pocket,'M61 177H139'],[raglan]][v];
  if (type === 'long-sleeve-tee') return [['M63 180H137'],[placket],[raglan],['M55 57L61 86M145 57L139 86'],['M84 22H116M84 30H116']][v];
  if (type === 'tank-top') return [['M68 79Q100 90 132 79'],['M83 34V56M117 34V56'],['M83 80Q100 92 117 80'],['M58 146H142'],['M64 184Q100 210 136 184']][v];
  if (type === 'shirt') return [[pocket],['M81 33Q100 46 119 33M100 42V185'],['M73 39L100 66 127 39'],[pocket,'M66 78H85V103H66Z'],[pocket,zip,'M64 195H136']][v];
  if (type === 'polo-shirt') return [[placket],['M43 159L57 164M143 164L157 159',placket],['M86 46L100 69 114 46'],['M72 41L88 62M128 41L112 62'],['M100 47V86M97 50V84']][v];
  if (type === 'thermal-top') return [[raglan],['M100 46V103'],['M83 26H117'],['M70 74L83 105V177M130 74L117 105V177'],[raglan,'M68 93L76 175M132 93L124 175']][v];
  if (type === 'sweatshirt') return [['M65 174H135M43 156L57 160M143 160L157 156'],['M76 129L67 159H133L124 129Z'],[zip,'M65 128L85 138M135 128L115 138'],['M100 42V106M96 42V105'],['M55 54L62 89M145 54L138 89M55 148H145']][v];
  if (type === 'sweater') return [['M65 177H135'],['M78 35L100 64 122 35'],['M83 22H117M83 30H117'],['M86 65Q111 80 86 95Q111 110 86 125Q111 140 86 155M113 65Q88 80 113 95Q88 110 113 125Q88 140 113 155'],[placket]][v];
  if (type === 'cardigan') return [[zip,'M102 84h1M102 110h1M102 136h1'],[zip,'M100 69h2M100 95h2M100 121h2'],['M84 49L78 205M116 49L122 205'],[zip],['M100 52V148M62 143H138']][v];
  if (type === 'fleece') return [[zip,pocket],['M100 42V108M96 42V108'],[zip,'M65 139L84 129M135 139L116 129'],[placket,'M100 64h1M100 77h1'],[zip,'M54 62Q100 99 146 62',pocket]][v];
  if (type === 'light-jacket') return [[zip,pocket],['M77 38L69 71 100 106 131 71 123 38M103 111V115M65 140H83M117 140H135'],[zip,'M65 179H135M49 151L61 158M139 158L151 151'],[zip,pocket,'M66 78H85V103H66Z'],[zip,pocket,'M66 181H86M114 181H134']][v];
  if (type === 'windbreaker') return [[zip,'M55 80Q100 102 145 80'],['M100 49V104M73 126H127V160H73Z'],[zip,'M85 23H115'],[zip,'M56 144H144'],[zip,'M56 75L140 115']][v];
  if (type === 'rain-jacket') return [[zip], [zip,'M62 199H138'],['M100 52V105M72 121H128V157H72Z'],[zip,'M54 77Q100 101 146 77L140 91Q100 110 60 91Z'],[zip,'M53 145H147']][v];
  if (type === 'rain-poncho') return [['M35 170Q100 196 165 170'],[zip],['M38 139h3M33 155h3M162 139h-3M167 155h-3'],['M76 100H124V135H76Z'],['M44 184Q100 208 156 184M100 66V114']][v];
  if (type === 'softshell') return [[zip], [zip,'M65 133L84 122M135 133L116 122'],[zip,pocket], [zip,'M62 77L77 113V178M138 77L123 113V178'],[zip,'M66 192Q100 212 134 192']][v];
  if (type === 'puffer' || type === 'gilet' && v === 1) return [zip, v === 1 ? 'M61 78L100 95 139 78M61 105L100 122 139 105M61 132L100 149 139 132M61 159L100 176 139 159' : `M61 78H139M61 101H139M61 124H139M61 147H139M61 170H139`, ...(v === 4 ? ['M62 194H138'] : [])];
  if (type === 'coat-parka') return [[zip,'M87 86h2M112 86h2M87 114h2M112 114h2'],['M65 116H135M89 111L111 121M111 111L89 121'],[zip,pocket,'M64 145H84V170H64ZM116 145H136V170H116Z'],[zip,'M85 23H115'],[zip,'M72 42L65 76 100 112 135 76 128 42']][v];
  if (type === 'gilet') return [[zip],[zip],[zip,pocket,'M66 116H89V149H66ZM111 116H134V149H111Z'],['M81 38L100 87 119 38M100 87V177M102 107h1M102 132h1M102 157h1'],[zip,'M63 198H137']][v];
  if (type === 'blouse') return [['M79 40Q100 64 121 40'],['M95 53L80 108 98 83 120 108 105 53'],['M125 47L76 108 134 184M67 103L121 105'],['M39 147L54 150M146 150L161 147'],['M73 74Q100 102 127 74M71 88Q100 116 129 88']][v];
  if (type === 'jeans' || type === 'woven-trousers') return [['M78 90V207M122 90V207'],[type === 'woven-trousers' ? 'M75 48L85 80M125 48L115 80' : 'M82 93L88 207M118 93L112 207'],['M74 90L64 207M126 90L136 207'],['M78 100L60 207M122 100L140 207'],[cargo]][v];
  if (type === 'joggers') return [['M63 202H92M108 202H137M96 43L88 72M104 43L112 72'],['M62 213H94M106 213H138'],[cargo],['M62 81L61 200M138 81L139 200'],['M62 168H94M106 168H138']][v];
  if (type === 'leggings') return [['M60 51Q100 61 140 51'],['M64 168H94M106 168H136'],['M61 80L81 89 76 126 61 123M139 80L119 89 124 126 139 123'],['M75 116L61 203M125 116L139 203'],['M64 70L84 98 78 185M136 70L116 98 122 185']][v];
  if (type === 'shorts') return [['M56 130H89M111 130H144'],[cargo],['M54 127Q72 151 94 128M106 128Q128 151 146 127'],['M55 155H92M108 155H145'],['M73 48L84 79M127 48L116 79']][v];
  if (type === 'skirt') return [['M72 56L59 198M128 56L141 198'],['M115 185L120 208'],['M79 52L58 205M90 53L79 213M110 53L121 213M121 52L142 205'],['M128 49L75 204M76 68L130 193'],['M100 52V206M102 76h1M102 108h1M102 140h1M102 172h1']][v];
  if (type === 'dress') return [['M75 95Q100 104 125 95'],[zip,'M72 98H128'],['M123 45L79 101 135 199M75 98L125 100'],['M72 176H128'],['M71 112Q100 120 129 112M58 161Q100 174 142 161']][v];
  if (type === 'sandals') return [['M43 110L86 124M43 141L86 155M114 110L158 124M114 141L158 155'],['M43 107L85 155M43 155L85 107M115 107L157 155M115 155L157 107'],['M43 102Q64 79 85 102M115 102Q136 79 157 102M43 148H85M115 148H157'],['M65 109V139L43 155M65 139L86 155M136 109V139L115 155M136 139L158 155'],['M43 105H85M43 132H85M43 160H85M115 105H157M115 132H157M115 160H157']][v];
  if (type === 'sneakers') return [['M82 121L105 119M88 130L112 128M94 139L119 137'],['M64 89L96 94M64 101L97 106M63 113L98 118'],['M49 121Q86 134 101 143'],['M38 153L64 136 91 151 118 139 158 159'],['M65 120L111 130M61 133L122 145']][v];
  if (type === 'running-shoes') return [['M82 120L104 118M90 131L113 129M98 141L122 139'],['M30 169Q100 157 172 169M28 176H174'],['M31 178v9M50 180v9M70 182v9M92 182v9M114 182v9M137 180v9M159 178v9'],['M49 145L78 129 123 157 147 151'],['M47 126Q82 145 108 145M134 151Q151 151 161 164']][v];
  if (type === 'rain-boots' || type === 'winter-boots') return [['M58 80H101M58 94H101M57 108H100M55 122H99'],['M53 116H105M45 151Q80 144 113 154'],['M56 112L63 138H99L105 112M65 117V133M73 117V133M81 117V133M89 117V133'],['M60 83H89V108H60ZM72 86V105M108 83H124'],['M59 52H108M61 61L83 69 105 61M83 69V101']][v];
  if (type === 'socks') return [['M57 50H90M123 50H156'],['M57 118H90M123 118H156'],['M57 30H90M123 30H156'],['M57 148Q78 157 79 169M38 174L58 191M123 148Q144 157 145 169M104 174L124 191'],['M57 55H90M57 67H90M57 79H90M123 55H156M123 67H156M123 79H156']][v];
  if (type === 'beanie') return [['M53 134V153M70 134V153M87 134V153M104 134V153M121 134V153M138 134V153'],['M58 114Q99 101 143 114'],['M91 42L108 53M108 42L91 53'],['M53 137H147'],['M63 82V125M75 71V125M87 65V125M99 62V125M111 65V125M123 71V125M135 82V125']][v];
  if (type === 'sun-hat') return [['M59 115H141'],['M56 119H144M36 144Q100 157 164 144'],['M103 66V120M57 111H93'],['M17 141Q56 125 100 146 144 125 183 141'],['M53 111Q100 94 147 111']][v];
  if (type === 'scarf') return [['M69 45Q100 57 130 45'],['M61 126Q100 145 139 126'],['M60 193L59 214M67 196L66 217M74 198L73 219M81 200L80 221M100 180V198M108 181V199M116 182V200'],['M42 85L100 184 158 85'],['M84 87L113 102M88 103L108 85']][v];
  if (type === 'gloves') return [['M36 168H85M120 168H169'],['M39 169H85M122 169H169'],['M40 109H83M123 109H166'],['M36 157H85M36 181H85M120 157H169M120 181H169'],['M44 125L60 113 79 129 73 155 46 153ZM127 125L143 113 162 129 156 155 129 153Z']][v];
  return [];
}
