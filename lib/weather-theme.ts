import type { CSSProperties } from 'react';
import type { WeatherCondition } from './types';
type Colors={label:string;accent:string;light:string;wash:string;dark:string;surface:string;nightAccent:string;glow:string};
const weatherColors:Record<WeatherCondition,Colors>={
 sunny:{label:'Güneşli',accent:'#87500a',light:'#fff0d3',wash:'#f6cf79',dark:'#261d12',surface:'#35291a',nightAccent:'#ffd18a',glow:'#ebaf3e'},
 partly_cloudy:{label:'Parçalı bulutlu',accent:'#6f5b27',light:'#f7edcc',wash:'#e8d7a3',dark:'#242317',surface:'#302e20',nightAccent:'#e8d193',glow:'#d3ba66'},
 cloudy:{label:'Bulutlu',accent:'#3e626d',light:'#e3edf0',wash:'#bacfd6',dark:'#19262d',surface:'#24343c',nightAccent:'#b5d7e1',glow:'#8bb5c6'},
 rainy:{label:'Yağmurlu',accent:'#155c7a',light:'#dceef8',wash:'#a9d4e9',dark:'#122837',surface:'#1d3a4b',nightAccent:'#99dcfa',glow:'#409ccd'},
 stormy:{label:'Fırtınalı',accent:'#674384',light:'#eae1f5',wash:'#ceb5e8',dark:'#271d37',surface:'#352849',nightAccent:'#ddbcfa',glow:'#a878d3'},
 snowy:{label:'Karlı',accent:'#295d79',light:'#e8f5fa',wash:'#c0e4f3',dark:'#162c36',surface:'#223c46',nightAccent:'#b6edff',glow:'#8fcfe7'},
 foggy:{label:'Sisli',accent:'#52634f',light:'#e7ecde',wash:'#c9d3bc',dark:'#222a21',surface:'#30392d',nightAccent:'#d4dfbe',glow:'#acb69c'},
 clear_night:{label:'Açık gece',accent:'#414986',light:'#e3e6fa',wash:'#bec6ee',dark:'#171c37',surface:'#252c4b',nightAccent:'#c4cdff',glow:'#7e8ee1'},
};
export function getWeatherTheme(condition:WeatherCondition,mode:'light'|'dark') {
 const c=weatherColors[condition], dark=mode==='dark', accent=dark?c.nightAccent:c.accent;
 const style={
 '--ww-accent':accent,'--ww-accent-ink':dark?'#14232b':'#ffffff',
 '--ww-canvas':dark?c.dark:c.light,'--ww-surface':dark?c.surface:'#fffdf8',
 '--ww-soft':dark?c.dark:'#f6f5ef','--ww-wash':dark?c.surface:c.wash,
 '--ww-glow':c.glow,'--ww-ink':dark?'#f7f6ec':'#202b2b',
 '--ww-muted':dark?'#c2cbc8':'#384546','--ww-line':dark?'#677975':'#a8b8b7',
 '--ww-stage':dark?c.dark:c.light,colorScheme:mode,
 } as CSSProperties;
 return {label:c.label,accent,style};
}
