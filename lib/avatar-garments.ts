import type { ClothingItem } from './types';
import { resolveGarmentAppearance, type AppearanceItem } from './garment-appearance';
import { outfitSlot, selectOutfitLayers } from './outfit-layers';

export type AvatarGarmentTemplate = 'tee' | 'long-top' | 'sweatshirt' | 'jacket' | 'trousers' | 'shoes' | 'beanie' | 'scarf' | 'gloves' | 'socks';
export interface AvatarGarment {
  slot: string;
  template: AvatarGarmentTemplate;
  appearance: ReturnType<typeof resolveGarmentAppearance>;
  placeholder: boolean;
}

function descriptor(item: AppearanceItem, slot: string, placeholder = false): AvatarGarment | null {
  const appearance = resolveGarmentAppearance(item);
  const type = appearance.type;
  // Skirts/dresses and equipment need independent topology; never pretend trousers are a dress.
  if (type === 'dress' || type === 'skirt' || appearance.umbrella || type === 'sun-hat' || type === 'sandals') return null;
  let template: AvatarGarmentTemplate;
  if (item.category === 'accessory') {
    if (!type || !['beanie', 'scarf', 'gloves', 'socks'].includes(type)) return null;
    template = type as AvatarGarmentTemplate;
  } else template = item.category === 'footwear' ? 'shoes' : item.category === 'bottom' ? 'trousers' : item.category === 'outer' ? 'jacket' : item.category === 'mid' ? 'sweatshirt' : appearance.sleeve === 'short' || appearance.sleeve === 'none' ? 'tee' : 'long-top';
  return { slot, template, appearance, placeholder };
}

export function avatarGarments(items: ClothingItem[]) {
  const active = selectOutfitLayers(items).active;
  const garments = active.flatMap(item => { const garment = descriptor(item, outfitSlot(item)); return garment ? [garment] : []; });
  const unsupported = active.filter(item => !descriptor(item, outfitSlot(item)));
  const foundation: AppearanceItem[] = [
    { name: '', category: 'base', garmentTypeId: 'short-sleeve-tee', colorHex: '#99aa9b' },
    { name: '', category: 'bottom', garmentTypeId: 'woven-trousers', colorHex: '#40494c' },
    { name: '', category: 'footwear', garmentTypeId: 'sneakers', colorHex: '#e8e4db' },
  ];
  for (const item of foundation) {
    const exists = item.category === 'base' ? garments.some(garment => ['base', 'mid', 'outer'].includes(garment.slot)) : garments.some(garment => garment.slot === item.category);
    if (!exists) garments.push(descriptor(item, item.category, true)!);
  }
  return { garments, unsupported };
}

export function avatarOutfitSignature(garments: AvatarGarment[]) {
  return JSON.stringify(garments.map(({ slot, template, appearance: a }) => [slot, template, a.type, a.neckline, a.sleeve, a.fit, a.length, a.pattern, a.color, a.accentColor]));
}
