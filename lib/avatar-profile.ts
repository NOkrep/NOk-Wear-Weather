export const AVATAR_STORAGE_KEY = 'wear_weather_avatar_v2';
export const LEGACY_AVATAR_STORAGE_KEY = 'wear_weather_avatar_v1';
export const SKIN_TONES = ['#fff1e0', '#edc19d', '#d79b75', '#af7652', '#7d4b34', '#4c2b23'] as const;
export const HAIR_COLOURS = ['#242220', '#493126', '#79472c', '#bc8754', '#d7ba7c', '#c7c3ba'] as const;
export const HAIR_STYLES = [
  { id: 'none', label: 'Saçsız' }, { id: 'crop', label: 'Kısa kesim' },
  { id: 'pixie', label: 'Pixie' }, { id: 'parted', label: 'Yana ayrık' },
  { id: 'long', label: 'Uzun saç' }, { id: 'buns', label: 'Topuz' },
] as const;

export interface AvatarProfile {
  version: 2;
  body: 'body-a' | 'body-b';
  build: 'slim' | 'regular' | 'broad';
  mode: 'character' | 'porcelain';
  skinTone: string;
  hair: typeof HAIR_STYLES[number]['id'];
  hairColor: string;
  beard: boolean;
}
export type AvatarView = 'front' | 'side' | 'back' | 'free';
export const DEFAULT_AVATAR: AvatarProfile = {
  version: 2, body: 'body-a', build: 'regular', mode: 'character',
  skinTone: '#edc19d', hair: 'parted', hairColor: '#493126', beard: false,
};

/** Only known local choices survive parsing. Model URLs and arbitrary fields are never stored. */
export function normalizeAvatarProfile(value: unknown): AvatarProfile {
  const v = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    version: 2,
    body: v.body === 'body-b' ? 'body-b' : 'body-a',
    build: ['slim', 'regular', 'broad'].includes(String(v.build)) ? v.build as AvatarProfile['build'] : DEFAULT_AVATAR.build,
    mode: v.mode === 'porcelain' ? 'porcelain' : 'character',
    skinTone: SKIN_TONES.includes(v.skinTone as typeof SKIN_TONES[number]) ? String(v.skinTone) : DEFAULT_AVATAR.skinTone,
    hair: HAIR_STYLES.some(style => style.id === v.hair) ? v.hair as AvatarProfile['hair'] : DEFAULT_AVATAR.hair,
    hairColor: typeof v.hairColor === 'string' && /^#[\da-f]{6}$/i.test(v.hairColor) ? v.hairColor.toLowerCase() : DEFAULT_AVATAR.hairColor,
    beard: v.beard === true,
  };
}

type ProfileStorage = Pick<Storage, 'getItem' | 'setItem'>;
function browserStorage(): ProfileStorage | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; } catch { return undefined; }
}
function parse(storage: ProfileStorage, key: string): unknown {
  try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; }
}
export function readAvatarProfile(storage = browserStorage()): AvatarProfile {
  if (!storage) return { ...DEFAULT_AVATAR };
  const current = parse(storage, AVATAR_STORAGE_KEY) as Record<string, unknown> | null;
  if (current?.version === 2) return normalizeAvatarProfile(current);
  const old = parse(storage, LEGACY_AVATAR_STORAGE_KEY) as Record<string, unknown> | null;
  if (!old || !['slim', 'regular', 'broad'].includes(String(old.build))) return { ...DEFAULT_AVATAR };
  // Keep the old record intact. Unsupported SVG face controls do not masquerade as 3D morphs.
  return normalizeAvatarProfile({ ...DEFAULT_AVATAR, build: old.build, hair: old.hair === 'short' ? 'parted' : old.hair === 'long' ? 'long' : 'none', hairColor: old.hairColor, beard: old.beard });
}
export function saveAvatarProfile(profile: AvatarProfile, storage = browserStorage()): boolean {
  if (!storage) return false;
  try { storage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(normalizeAvatarProfile(profile))); return true; } catch { return false; }
}
