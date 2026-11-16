import { Sun, Moon, Cloud, CloudSun, CloudMoon, CloudRain, CloudLightning, CloudSnow } from 'lucide-react';
import type { WeatherCondition } from '@/lib/types';
import { conditionForDaylight } from '@/lib/weather-condition';

export function WeatherIcon({ condition, isDay, size = 22 }: {
  condition: WeatherCondition; isDay?: boolean | null; size?: number;
}) {
  const normalized = conditionForDaylight(condition, isDay);
  const Icon = ({ sunny: Sun, clear_night: Moon, rainy: CloudRain, stormy: CloudLightning,
    snowy: CloudSnow, cloudy: Cloud, foggy: Cloud,
    partly_cloudy: isDay === true ? CloudSun : isDay === false ? CloudMoon : Cloud,
  })[normalized];
  return <Icon size={size} strokeWidth={1.5} aria-hidden="true"/>;
}
