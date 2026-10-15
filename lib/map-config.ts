export const CARTO_API_KEY =
  process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_4dgh_1_fb67c545080244da64b27f70';

// CARTO Voyager High-Definition Raster Basemap
export const CARTO_VOYAGER_TILE_URL = `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`;

// CARTO Dark Matter for Dark mode
export const CARTO_DARK_TILE_URL = `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`;

export function getCartoTileUrl(theme: 'dark' | 'light' = 'dark'): string {
  return theme === 'dark' ? CARTO_DARK_TILE_URL : CARTO_VOYAGER_TILE_URL;
}

export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>';
